import { describe, it, expect, beforeEach } from "vitest"
import { consumeAiRequest, AiRateLimitError } from "../src/utils/ai-rate-limit"
import { prisma } from "@devforge/database"

describe("AI Rate Limit Concurrency", () => {
  let userId: string

  beforeEach(async () => {
    // Create a fresh user for each test
    const user = await prisma.user.create({
      data: {
        username: `testuser-${Date.now()}-${Math.random()}`,
        email: `testuser-${Date.now()}-${Math.random()}@example.com`,
        password: "password",
      }
    })
    userId = user.id
  })

  it("should handle concurrent requests atomically, allowing only 3", async () => {
    const promises = Array.from({ length: 5 }).map(() => 
      consumeAiRequest(userId, prisma).catch((e: Error) => e)
    )

    const results = await Promise.all(promises)
    
    const successes = results.filter((r) => r === true)
    const failures = results.filter((r) => r instanceof AiRateLimitError)

    expect(successes.length).toBe(3)
    expect(failures.length).toBe(2)
  })
})

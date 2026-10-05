import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest"
import { completeMatch } from "../src/services/arena.service"
import { prisma } from "@devforge/database"

describe("Arena Service", () => {
  let player1: any
  let player2: any
  let problem: any

  beforeEach(async () => {
    player1 = await prisma.user.create({
      data: {
        username: `player1-${Date.now()}`,
        email: `p1-${Date.now()}@example.com`,
        password: "password123",
        xp: 0
      }
    })
    player2 = await prisma.user.create({
      data: {
        username: `player2-${Date.now()}`,
        email: `p2-${Date.now()}@example.com`,
        password: "password123",
        xp: 0
      }
    })
    problem = await prisma.problem.create({
      data: {
        title: "Test Problem",
        slug: `test-problem-${Date.now()}`,
        description: "Test description",
        category: "Test",
        difficulty: "EASY",
        examples: [],
        constraints: [],
        starterCode: "{}",
        testCases: "[]"
      }
    })
  })

  // We don't need afterAll to delete these anymore, because setup.ts will truncate them before the NEXT test anyway.
  // But just in case, we can keep an afterEach.
  afterEach(async () => {
    // Delete matches before users to avoid foreign key violations
    await prisma.match.deleteMany().catch(() => {})
    if (player1?.id) await prisma.user.delete({ where: { id: player1.id } }).catch(() => {})
    if (player2?.id) await prisma.user.delete({ where: { id: player2.id } }).catch(() => {})
    if (problem?.id) await prisma.problem.delete({ where: { id: problem.id } }).catch(() => {})
  })

  it("should handle concurrent completeMatch calls atomically and award XP only once", async () => {
    // Setup a new active match
    const match = await prisma.match.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        problemId: problem.id,
        status: "ACTIVE",
        isFriendly: false,
      }
    })

    // Get initial XP
    const p1Initial = await prisma.user.findUnique({ where: { id: player1.id } })

    // Concurrently try to complete the match
    const results = await Promise.allSettled([
      completeMatch(match.id, player1.id),
      completeMatch(match.id, player1.id),
      completeMatch(match.id, player1.id)
    ])

    const successes = results.filter(r => r.status === "fulfilled")
    const failures = results.filter(r => r.status === "rejected")

    expect(successes.length).toBe(1)
    expect(failures.length).toBe(2)

    // Check XP increment
    const p1Final = await prisma.user.findUnique({ where: { id: player1.id } })
    expect(p1Final!.xp).toBe(p1Initial!.xp + 100)

    // Cleanup match
    await prisma.match.delete({ where: { id: match.id } })
  }, 15000)
})

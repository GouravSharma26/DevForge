import { PrismaClient } from "@prisma/client"

export class AiRateLimitError extends Error {
  statusCode = 429;
  constructor(message = "Daily AI request limit reached. Please try again later.") {
    super(message)
    this.name = "AiRateLimitError"
  }
}

/**
 * Consumes an AI request for a given user.
 * Throws AiRateLimitError if the user has reached the daily limit.
 */
export async function consumeAiRequest(userId: string, prisma: PrismaClient) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    throw new Error("User not found for rate limiting")
  }

  // Admin users have unlimited access
  if (user.role === "ADMIN") {
    return true
  }

  // Atomic update using raw SQL
  const result = await prisma.$executeRaw`
    UPDATE "User"
    SET 
      "aiRequestCount" = CASE 
        WHEN "lastAiRequestAt" IS NULL THEN 1
        WHEN "lastAiRequestAt" < NOW() - INTERVAL '24 hours' THEN 1 
        ELSE "aiRequestCount" + 1 
      END,
      "lastAiRequestAt" = NOW()
    WHERE "id" = ${userId}
      AND (
        "lastAiRequestAt" IS NULL
        OR "lastAiRequestAt" < NOW() - INTERVAL '24 hours' 
        OR "aiRequestCount" < 3
      )
  `

  if (result === 0) {
    throw new AiRateLimitError()
  }

  return true
}

export async function refundAiRequest(userId: string, prisma: PrismaClient) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role === "ADMIN") {
    return true
  }

  // Atomic update using raw SQL to decrement but floor at 0
  await prisma.$executeRaw`
    UPDATE "User"
    SET "aiRequestCount" = CASE WHEN "aiRequestCount" > 0 THEN "aiRequestCount" - 1 ELSE 0 END
    WHERE "id" = ${userId}
  `

  return true
}

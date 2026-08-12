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
    select: { role: true, aiRequestCount: true, lastAiRequestAt: true },
  })

  if (!user) {
    throw new Error("User not found for rate limiting")
  }

  // Admin users have unlimited access
  if (user.role === "ADMIN") {
    return true
  }

  const now = new Date()
  let newCount = user.aiRequestCount
  
  // Reset if last request was more than 24 hours ago
  if (user.lastAiRequestAt) {
    const hoursSinceLastRequest = (now.getTime() - user.lastAiRequestAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastRequest >= 24) {
      newCount = 0
    }
  }

  // Enforce strict limit of 3
  if (newCount >= 3) {
    throw new AiRateLimitError()
  }

  // Increment and update timestamp
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiRequestCount: newCount + 1,
      lastAiRequestAt: now,
    },
  })

  return true
}

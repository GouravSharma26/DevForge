import { prisma } from "@devforge/database"

export async function getRandomEasyProblem() {
  return getRandomProblemByDifficulty("EASY")
}

export async function getRandomProblemByDifficulty(difficulty: "EASY" | "MEDIUM" | "HARD") {
  const random = await getNRandomProblems(1, [difficulty])
  return random[0]
}

export async function getNRandomProblems(count: number, difficulties?: string[]) {
  const ids = await prisma.problem.findMany({
    where: difficulties?.length ? { difficulty: { in: difficulties as any[] } } : undefined,
    select: { id: true },
  })
  
  if (!ids.length) {
    if (difficulties?.length) {
      return getNRandomProblems(count) // fallback to any
    }
    return []
  }

  // Fisher-Yates Shuffle on IDs
  const shuffled = [...ids]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  const selectedIds = shuffled.slice(0, Math.max(1, count)).map(p => p.id)

  return prisma.problem.findMany({
    where: { id: { in: selectedIds } },
    select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true },
  })
}

export async function createMatch(player1Id: string, problemId: string, isFriendly: boolean = false) {
  return prisma.match.create({
    data: { player1Id, problemId, status: "WAITING", isFriendly },
    include: {
      problem: { select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true } },
      player1: { select: { id: true, username: true, xp: true, avatar: true } },
    },
  })
}

import { ERROR_MESSAGES } from "../utils/constants"

export async function joinMatch(matchId: string, player2Id: string) {
  const { count } = await prisma.match.updateMany({
    where: { id: matchId, status: "WAITING" },
    data: {
      player2Id,
      status: "ACTIVE",
      startedAt: new Date(),
    },
  })
  if (count === 0) throw new Error(ERROR_MESSAGES.MATCH_NOT_WAITING)

  return prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      problem: { select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true } },
      player1: { select: { id: true, username: true, xp: true, avatar: true } },
      player2: { select: { id: true, username: true, xp: true, avatar: true } },
    },
  })
}

export async function completeMatch(matchId: string, winnerId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Atomically update the match status
    const { count } = await tx.match.updateMany({
      where: { id: matchId, status: "ACTIVE" },
      data: { winnerId, status: "COMPLETED", endedAt: new Date() },
    })

    if (count === 0) {
      throw new Error("Match already completed or not active")
    }

    // 2. Fetch the updated match
    const updatedMatch = await tx.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    })

    // 3. Award XP if it was a ranked/non-friendly match
    if (!updatedMatch.isFriendly) {
      const { awardXp } = await import("./xp.service")
      await awardXp(winnerId, 100, tx)
    }

    return updatedMatch
  })
}

export async function getWaitingMatch() {
  return prisma.match.findFirst({
    where: { status: "WAITING" },
    orderBy: { createdAt: "asc" },
    include: {
      player1: { select: { id: true, username: true } },
      problem: { select: { id: true, title: true, slug: true } },
    },
  })
}

export async function getMatchById(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      problem: { select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true } },
      player1: { select: { id: true, username: true, xp: true, avatar: true } },
      player2: { select: { id: true, username: true, xp: true, avatar: true } },
      winner: { select: { id: true, username: true } },
    },
  })
}

export async function getMatchHistory(userId: string) {
  return prisma.match.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { player1Id: userId },
        { player2Id: userId }
      ]
    },
    orderBy: { endedAt: "desc" },
    take: 10,
    include: {
      problem: { select: { title: true, difficulty: true } },
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      winner: { select: { id: true, username: true } },
    }
  })
}

export async function cancelMatch(matchId: string) {
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (match && match.status === "WAITING") {
      return await prisma.match.delete({ where: { id: matchId } })
    }
  } catch (err) {
    console.error("Failed to cancel match:", err)
  }
}
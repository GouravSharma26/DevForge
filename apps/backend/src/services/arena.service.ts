import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function getRandomEasyProblem() {
  return getRandomProblemByDifficulty("EASY")
}

export async function getRandomProblemByDifficulty(difficulty: "EASY" | "MEDIUM" | "HARD") {
  const random = await getNRandomProblems(1, [difficulty])
  return random[0]
}

export async function getNRandomProblems(count: number, difficulties?: string[]) {
  const problems = await prisma.problem.findMany({
    where: difficulties?.length ? { difficulty: { in: difficulties as any[] } } : undefined,
    select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true },
  })
  
  if (!problems.length) {
    if (difficulties?.length) {
      return getNRandomProblems(count) // fallback to any
    }
    return []
  }

  // Shuffle array
  const shuffled = problems.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.max(1, count))
}

export async function createMatch(player1Id: string, problemId: string, isFriendly: boolean = false) {
  return prisma.match.create({
    data: { player1Id, problemId, status: "WAITING", isFriendly },
    include: {
      problem: true,
      player1: { select: { id: true, username: true, xp: true, avatar: true } },
    },
  })
}

export async function joinMatch(matchId: string, player2Id: string) {
  return prisma.match.update({
    where: { id: matchId },
    data: {
      player2Id,
      status: "ACTIVE",
      startedAt: new Date(),
    },
    include: {
      problem: true,
      player1: { select: { id: true, username: true, xp: true, avatar: true } },
      player2: { select: { id: true, username: true, xp: true, avatar: true } },
    },
  })
}

export async function completeMatch(matchId: string, winnerId: string) {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { winnerId, status: "COMPLETED", endedAt: new Date() },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  })

  // Award XP to winner ONLY if not friendly match
  if (!match.isFriendly) {
    await prisma.user.update({
      where: { id: winnerId },
      data: { xp: { increment: 100 } },
    })
  }

  return match
}

export async function getWaitingMatch() {
  return prisma.match.findFirst({
    where: { status: "WAITING" },
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
      problem: true,
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
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function getRandomEasyProblem() {
  const problems = await prisma.problem.findMany({
    where: { difficulty: "EASY" },
    select: { id: true },
  })
  const random = problems[Math.floor(Math.random() * problems.length)]
  return random
}

export async function createMatch(player1Id: string, problemId: string) {
  return prisma.match.create({
    data: { player1Id, problemId, status: "WAITING" },
    include: {
      problem: true,
      player1: { select: { id: true, username: true, xp: true } },
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
      player1: { select: { id: true, username: true, xp: true } },
      player2: { select: { id: true, username: true, xp: true } },
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

  // Award XP to winner
  await prisma.user.update({
    where: { id: winnerId },
    data: { xp: { increment: 100 } },
  })

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
      player1: { select: { id: true, username: true, xp: true } },
      player2: { select: { id: true, username: true, xp: true } },
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
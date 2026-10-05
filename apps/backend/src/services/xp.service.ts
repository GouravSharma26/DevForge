import { prisma } from "@devforge/database"

// XP thresholds for levels 1 to 50
function getXpForLevel(level: number): number {
  if (level === 1) return 0
  if (level === 2) return 500
  if (level === 3) return 1500
  if (level === 4) return 3000
  // Scaling calculation for higher levels
  return 3000 + (level - 4) * 2000
}

function getRankTitle(level: number): string {
  if (level < 5) return "Iron Apprentice"
  if (level < 10) return "Bronze Artificer"
  if (level < 15) return "Silver Forgesmith"
  if (level < 25) return "Gold Innovator"
  if (level < 50) return "Obsidian Architect"
  return "Ember Grandmaster"
}

export async function awardXp(userId: string, xpAmount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  let newXp = user.xp + xpAmount
  let newLevel = user.level

  // Check for level up
  while (newXp >= getXpForLevel(newLevel + 1)) {
    newLevel++
  }

  const newRankTitle = getRankTitle(newLevel)

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      rankTitle: newRankTitle
    }
  })

  return { xp: newXp, level: newLevel, rankTitle: newRankTitle, leveledUp: newLevel > user.level }
}

export async function updateArenaStats(userId: string, isWinner: boolean, isDraw: boolean, eloChange: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  let newElo = Math.max(0, user.elo + eloChange) // Prevent negative Elo

  await prisma.user.update({
    where: { id: userId },
    data: {
      elo: newElo,
      arenaWins: isWinner ? { increment: 1 } : undefined,
      arenaLosses: (!isWinner && !isDraw) ? { increment: 1 } : undefined,
      arenaDraws: isDraw ? { increment: 1 } : undefined
    }
  })
}

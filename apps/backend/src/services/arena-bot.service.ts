import { Server } from "socket.io"
import { prisma } from "@devforge/database"

import { completeMatch } from "./arena.service"

// In-memory map: matchId -> NodeJS.Timeout
const activeBotTimers = new Map<string, NodeJS.Timeout>()

export async function calculateBotSolveTime(problemDifficulty: string): Promise<{ botId: string; ms: number }> {
  const config = await prisma.systemConfig.findUnique({ where: { id: "global" } })
  if (!config) throw new Error("SystemConfig missing")

  let baseTime = config.baseTimeEasy
  if (problemDifficulty === "MEDIUM") baseTime = config.baseTimeMedium
  if (problemDifficulty === "HARD") baseTime = config.baseTimeHard

  // Pick a random bot tier
  const tiers = ["beginner", "intermediate", "grandmaster"]
  const botTier = tiers[Math.floor(Math.random() * tiers.length)]
  
  let multiplier = config.multIntermediate
  if (botTier === "beginner") multiplier = config.multBeginner
  if (botTier === "grandmaster") multiplier = config.multGrandmaster

  // Calculate random variance (e.g. ± 20%)
  const variance = config.variancePercent
  const randomFactor = 1 - variance + Math.random() * (variance * 2)

  const finalTimeSeconds = baseTime * multiplier * randomFactor
  
  const botUser = await prisma.user.findUnique({ where: { username: `devbot-${botTier}` } })
  
  return { 
    botId: botUser!.id, 
    ms: finalTimeSeconds * 1000 
  }
}

export function startBotBattle(matchId: string, botId: string, solveTimeMs: number, io: Server) {
  console.log(`🤖 Bot ${botId} joining match ${matchId}. Will solve in ${Math.round(solveTimeMs / 1000)}s`)
  
  const timer = setTimeout(async () => {
    try {
      // 1. Scare tactic: "submitted!"
      io.to(matchId).emit("arena:opponent_submitted")
      
      // 2. Wait 3 seconds to "evaluate"
      setTimeout(async () => {
        // Complete the match with bot as winner
        const match = await completeMatch(matchId, botId)
        
        const winner = await prisma.user.findUnique({ where: { id: botId } })
        
        io.to(matchId).emit("arena:match_over", {
          winnerId: botId,
          winnerUsername: winner?.username || "DevBot",
          results: [{ 
            passed: true, 
            input: "Bot Auto-Solve", 
            expected: "Passed", 
            actual: "Passed" 
          }]
        })
        console.log(`🤖 Bot ${botId} WON match ${matchId}`)
      }, 3000)

    } catch (err) {
      console.error("Bot battle error", err)
    }
  }, solveTimeMs)

  activeBotTimers.set(matchId, timer)
}

export function cancelBotBattle(matchId: string) {
  const timer = activeBotTimers.get(matchId)
  if (timer) {
    clearTimeout(timer)
    activeBotTimers.delete(matchId)
    console.log(`🛑 Cancelled bot battle for match ${matchId}`)
  }
}

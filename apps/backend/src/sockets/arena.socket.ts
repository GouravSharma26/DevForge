import { Server, Socket } from "socket.io"
import {
  getWaitingMatch,
  createMatch,
  joinMatch,
  completeMatch,
  getRandomEasyProblem,
  getMatchById,
} from "../services/arena.service"
import { submitSolution } from "../services/problems.service"

// In-memory map: userId → socketId
const userSockets = new Map<string, string>()
// In-memory map: matchId → Set of userIds
const matchPlayers = new Map<string, Set<string>>()

export function registerArenaHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string

  userSockets.set(userId, socket.id)
  console.log(`🎮 Arena: ${userId} connected (${socket.id})`)

  // ── JOIN QUEUE ──────────────────────────────────────────────────────────────
  socket.on("arena:join_queue", async () => {
    try {
      const waiting = await getWaitingMatch()

      if (waiting && waiting.player1Id !== userId) {
        // Match found — join as player 2
        const match = await joinMatch(waiting.id, userId)

        socket.join(match.id)

        // Also get player1's socket and put them in the room
        const p1SocketId = userSockets.get(match.player1Id)
        if (p1SocketId) {
          const p1Socket = io.sockets.sockets.get(p1SocketId)
          p1Socket?.join(match.id)
        }

        // Track players in match
        matchPlayers.set(match.id, new Set([match.player1Id, userId]))

        // Notify both players
        io.to(match.id).emit("arena:match_found", {
          matchId: match.id,
          problem: match.problem,
          player1: match.player1,
          player2: match.player2,
        })

        console.log(`⚔️  Match started: ${match.id}`)
      } else {
        // No match waiting — create one
        const problem = await getRandomEasyProblem()
        const match = await createMatch(userId, problem.id)

        socket.join(match.id)
        socket.emit("arena:waiting", {
          matchId: match.id,
          message: "Waiting for opponent...",
        })

        console.log(`⏳ Waiting for opponent: ${match.id}`)
      }
    } catch (err) {
      console.error("arena:join_queue error", err)
      socket.emit("arena:error", { message: "Failed to join queue" })
    }
  })

  // ── CODE CHANGE (broadcast to opponent) ────────────────────────────────────
  socket.on("arena:code_change", ({ matchId, code }: { matchId: string; code: string }) => {
    socket.to(matchId).emit("arena:opponent_code", { code })
  })

  // ── SUBMIT ──────────────────────────────────────────────────────────────────
  socket.on(
    "arena:submit",
    async ({
      matchId,
      problemId,
      code,
      language,
    }: {
      matchId: string
      problemId: string
      code: string
      language: string
    }) => {
      try {
        // Notify opponent that this player submitted
        socket.to(matchId).emit("arena:opponent_submitted")

        const result = await submitSolution(userId, problemId, code, language)

        if (result.allPassed) {
          // This player won
          const match = await completeMatch(matchId, userId)

          io.to(matchId).emit("arena:match_over", {
            winnerId: userId,
            winnerUsername:
              match.player1Id === userId
                ? match.player1.username
                : match.player2?.username,
            results: result.results,
          })

          console.log(`🏆 Match ${matchId} won by ${userId}`)

          // 🛠️ MEMORY LEAK FIX 1: Cleanup when match naturally completes
          matchPlayers.delete(matchId)
        } else {
          // Failed — send results only to this player
          socket.emit("arena:submit_result", {
            passed: false,
            results: result.results,
          })
        }
      } catch (err) {
        console.error("arena:submit error", err)
        socket.emit("arena:error", { message: "Submission failed" })
      }
    }
  )

  // ── LEAVE ───────────────────────────────────────────────────────────────────
  socket.on("arena:leave", ({ matchId }: { matchId: string }) => {
    socket.leave(matchId)
    socket.to(matchId).emit("arena:opponent_left")

    // 🛠️ MEMORY LEAK FIX 2: Cleanup when player manually leaves
    matchPlayers.delete(matchId)
  })

  // ── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    userSockets.delete(userId)

    // 🛠️ MEMORY LEAK FIX 3: Find any active match this user was in, clean it up, and alert opponent
    for (const [matchId, players] of matchPlayers.entries()) {
      if (players.has(userId)) {
        socket.to(matchId).emit("arena:opponent_left")
        matchPlayers.delete(matchId)
      }
    }

    console.log(`❌ Arena: ${userId} disconnected`)
  })
}
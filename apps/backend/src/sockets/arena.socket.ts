import { z } from "zod"
import { Server, Socket } from "socket.io"
import {
  getWaitingMatch,
  createMatch,
  joinMatch,
  completeMatch,
  getRandomEasyProblem,
  getNRandomProblems,
  getMatchById,
  cancelMatch,
} from "../services/arena.service"
import { submitSolution } from "../services/problems.service"
import { prisma } from "@devforge/database"
import { calculateBotSolveTime, startBotBattle, cancelBotBattle } from "../services/arena-bot.service"


// In-memory map: userId → socketId
const userSockets = new Map<string, string>()
// In-memory map: matchId → Set of userIds (Active DB Matches - Quick Match only)
const matchPlayers = new Map<string, Set<string>>()
const disconnectTimeouts = new Map<string, NodeJS.Timeout>()
const activeMatches = new Map<string, any>()
let quickMatchLock: Promise<void> | null = null


// In-memory map: Friendly Rooms (Exam Mode)
interface FriendlyRoom {
  code: string
  name: string
  organizerId: string
  organizerUsername: string
  organizerAvatar: string | null
  participantId: string | null
  participantUsername: string | null
  participantAvatar: string | null
  participantReady: boolean
  
  // Custom Settings
  difficulties: string[]
  numberOfQuestions: number
  timeLimitMinutes: number
  
  // Exam State
  problems: any[]
  startTime: number | null
  endTime: number | null
  examTimeout: NodeJS.Timeout | null
  examStatus: Record<string, Record<string, "PASSED" | "FAILED" | "NONE">> // userId -> { problemId: status }
  activeTabs: Record<string, string> // userId -> problemId
  scores: Record<string, number> // userId -> score
}
const friendlyRooms = new Map<string, FriendlyRoom>() // code -> room
const userToRoom = new Map<string, string>() // userId -> code

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}


function on<T>(socket: Socket, ev: string, schema: z.ZodType<T>, fn: (p: T) => Promise<any> | any) {
  socket.on(ev, async (raw: unknown) => {
    // Tolerate payload-less emits and ack callbacks passed as the only argument
    const payload = typeof raw === "function" ? {} : (raw ?? {})
    const p = schema.safeParse(payload)
    if (!p.success) {
      console.warn(`[Arena Socket] Invalid payload for ${ev}:`, p.error.format())
      return socket.emit("arena:error", { message: "Invalid payload" })
    }
    try {
      await fn(p.data)
    } catch (e: any) {
      console.error(`[Arena Socket] Error in ${ev}:`, e)
      socket.emit("arena:error", { message: e.message || "Internal error" })
    }
  })
}

export function registerArenaHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string
  const username = socket.data.username as string || "Unknown Developer"
  const avatar = socket.data.avatar as string | null

  userSockets.set(userId, socket.id)
  
  // Clear any existing disconnect timeout for this user (they refreshed)
  if (disconnectTimeouts.has(userId)) {
    clearTimeout(disconnectTimeouts.get(userId)!)
    disconnectTimeouts.delete(userId)
  }

  // CHECK FOR RECONNECTION
  const codeRoom = userToRoom.get(userId)
  if (codeRoom) {
    const room = friendlyRooms.get(codeRoom)
    if (room) {
      socket.join(`room_${codeRoom}`)
      if (room.startTime) {
        socket.emit("arena:exam_started", {
          roomCode: codeRoom,
          problems: room.problems,
          endTime: room.endTime,
          player1: { id: room.organizerId, username: room.organizerUsername, avatar: room.organizerAvatar },
          player2: { id: room.participantId, username: room.participantUsername, avatar: room.participantAvatar },
          examStatus: room.examStatus,
          activeTabs: room.activeTabs,
        })
      } else {
        socket.emit("arena:room_restarted", room) // Re-syncs them directly into the lobby
      }
    }
  }

  const activeMatch = Array.from(activeMatches.values()).find(m => m.player1.id === userId || m.player2?.id === userId)
  if (activeMatch) {
    socket.join(`match_${activeMatch.id}`)
    socket.emit("arena:match_found", {
      matchId: activeMatch.id,
      problem: activeMatch.problem,
      player1: activeMatch.player1,
      player2: activeMatch.player2,
      isFriendly: false
    })
  }

  socket.on("disconnect", () => {
    userSockets.delete(userId)
    
    const timeout = setTimeout(async () => {
        // QUICK MATCH
        const match = Array.from(activeMatches.values()).find(m => m.player1.id === userId || m.player2?.id === userId)
        if (match) {
          const opponentId = match.player1.id === userId ? match.player2?.id : match.player1.id
          
          if (match.status === "ACTIVE" && opponentId) {
            try {
              const endedMatch = await completeMatch(match.id, opponentId)
              io.to(match.id).emit("arena:match_over", {
                winnerId: opponentId,
                winnerUsername: endedMatch.player1Id === opponentId ? endedMatch.player1.username : endedMatch.player2?.username,
                results: [{ passed: true, input: "Opponent Forfeited", expected: "Win", actual: "Win" }],
                isFriendly: false,
              })
              console.log(`🏳️ Match ${match.id} forfeited by disconnect. Winner: ${opponentId}`)
            } catch (e) {
              console.error("Failed to complete match on disconnect", e)
            }
          } else {
            const oppSocketId = opponentId ? userSockets.get(opponentId) : undefined
            if (oppSocketId) {
              io.to(oppSocketId).emit("arena:opponent_left")
            }
          }
          
          activeMatches.delete(match.id)
          if (match.status === "WAITING") {
            cancelMatch(match.id)
          }
        }

      // FRIENDLY ROOM
      const codeRoom = userToRoom.get(userId)
      if (codeRoom) {
        const room = friendlyRooms.get(codeRoom)
        if (room) {
          if (room.organizerId === userId) {
            if (room.participantId) {
              room.organizerId = room.participantId
              room.organizerUsername = room.participantUsername as string
              room.organizerAvatar = room.participantAvatar
              room.participantId = null
              room.participantUsername = null
              room.participantAvatar = null
              room.participantReady = false
              delete room.examStatus[userId]
              delete room.activeTabs[userId]
              delete room.scores[userId]
              io.to(`room_${codeRoom}`).emit("arena:room_updated", room)
            } else {
              if (room.examTimeout) clearTimeout(room.examTimeout)
              friendlyRooms.delete(codeRoom)
            }
          } else if (room.participantId === userId) {
            room.participantId = null
            room.participantUsername = null
            room.participantAvatar = null
            room.participantReady = false
            delete room.examStatus[userId]
            delete room.activeTabs[userId]
            delete room.scores[userId]
            io.to(`room_${codeRoom}`).emit("arena:room_updated", room)
          }
          userToRoom.delete(userId)
        }
      }
    }, 10000) // 10 second grace period for page refresh

    disconnectTimeouts.set(userId, timeout)
  })

  console.log(`🎮 Arena: ${userId} connected (${socket.id})`)

  // ── QUICK MATCH (Ranked) ──────────────────────────────────────────────────────────────
  on(socket, "arena:join_queue", z.object({}), async () => {
    try {
      // Serialize matchmaking to prevent DB race conditions
      while (quickMatchLock) {
        await quickMatchLock
      }
      
      let releaseLock!: () => void
      quickMatchLock = new Promise((resolve) => {
        releaseLock = resolve
      })

      try {
        const waiting = await getWaitingMatch()

      if (waiting && waiting.player1Id !== userId) {
        const match = await joinMatch(waiting.id, userId)
        socket.join(match.id)

        const p1SocketId = userSockets.get(match.player1Id)
        if (p1SocketId) {
          const p1Socket = io.sockets.sockets.get(p1SocketId)
          p1Socket?.join(match.id)
        }

        matchPlayers.set(match.id, new Set([match.player1Id, userId]))
        activeMatches.set(match.id, match)

        io.to(match.id).emit("arena:match_found", {
          matchId: match.id,
          problem: match.problem,
          player1: match.player1,
          player2: match.player2,
          isFriendly: false,
        })
        console.log(`⚔️  Match started: ${match.id}`)
      } else {
        const problem = await getRandomEasyProblem()
        const match = await createMatch(userId, problem.id, false)

        activeMatches.set(match.id, match)

        socket.join(match.id)
        socket.emit("arena:waiting", {
          matchId: match.id,
          message: "Waiting for opponent...",
        })
        console.log(`⏳ Waiting for opponent: ${match.id}`)

        const config = await prisma.systemConfig.findUnique({ where: { id: "global" } })
        if (config?.botEnabled) {
          setTimeout(async () => {
            try {
              const currentMatch = await getMatchById(match.id)
              if (currentMatch && currentMatch.status === "WAITING") {
                const botData = await calculateBotSolveTime(currentMatch.problem.difficulty)
                const botMatch = await joinMatch(match.id, botData.botId)
                matchPlayers.set(match.id, new Set([match.player1Id, botData.botId]))
                activeMatches.set(match.id, botMatch)
                io.to(match.id).emit("arena:match_found", {
                  matchId: botMatch.id,
                  problem: botMatch.problem,
                  player1: botMatch.player1,
                  player2: botMatch.player2,
                  isFriendly: false,
                })
                startBotBattle(match.id, botData.botId, botData.ms, io)
              }
            } catch (e) {
              console.error("Bot injection failed", e)
            }
          }, config.botQueueWaitTime * 1000)
        }
      }
      } finally {
        releaseLock()
        if (quickMatchLock) { // Only nullify if it's our lock (though it's sequential anyway)
          quickMatchLock = null
        }
      }
    } catch (err: any) {
      console.error("arena:join_queue error", err)
      socket.emit("arena:error", { message: err?.message || "Failed to join queue" })
    }
  })

  // ── FRIENDLY MATCHES (Custom Rooms / Exam Mode) ──────────────────────────────────────────
  
  on(socket, "arena:create_room", z.object({ name: z.string(), numberOfQuestions: z.number(), timeLimitMinutes: z.number(), difficulties: z.array(z.string()) }), async ({ name, numberOfQuestions, timeLimitMinutes, difficulties }) => {
    const existingCode = userToRoom.get(userId)
    if (existingCode) {
      friendlyRooms.delete(existingCode)
      userToRoom.delete(userId)
    }

    const code = generateRoomCode()
    const room: FriendlyRoom = {
      code,
      name,
      organizerId: userId,
      organizerUsername: username,
      organizerAvatar: avatar,
      participantId: null,
      participantUsername: null,
      participantAvatar: null,
      participantReady: false,
      difficulties: difficulties && difficulties.length > 0 ? difficulties : ["EASY", "MEDIUM", "HARD"],
      numberOfQuestions,
      timeLimitMinutes,
      problems: [],
      startTime: null,
      endTime: null,
      examTimeout: null,
      examStatus: { [userId]: {} },
      activeTabs: {},
      scores: { [userId]: 0 },
    }
    
    friendlyRooms.set(code, room)
    userToRoom.set(userId, code)
    socket.join(`room_${code}`)
    
    socket.emit("arena:room_created", room)
    console.log(`🏠 Friendly Room created: ${code} by ${userId}`)
  })

  on(socket, "arena:join_room", z.object({ code: z.string() }), async ({ code }) => {
    const room = friendlyRooms.get(code.toUpperCase())
    if (!room) {
      return socket.emit("arena:error", { message: "Room not found or expired" })
    }
    if (room.participantId && room.participantId !== userId) {
      return socket.emit("arena:error", { message: "Room is full" })
    }
    if (room.organizerId === userId) {
      return socket.emit("arena:error", { message: "You are the organizer" })
    }

    room.participantId = userId
    room.participantUsername = username
    room.participantAvatar = avatar
    room.participantReady = false
    room.examStatus[userId] = {}
    room.scores[userId] = 0
    
    userToRoom.set(userId, code)
    socket.join(`room_${code}`)

    io.to(`room_${code}`).emit("arena:room_updated", room)
  })

  on(socket, "arena:toggle_ready", z.object({}), async () => {
    const code = userToRoom.get(userId)
    if (!code) return
    const room = friendlyRooms.get(code)
    if (room && room.participantId === userId) {
      room.participantReady = !room.participantReady
      io.to(`room_${code}`).emit("arena:room_updated", room)
    }
  })

  on(socket, "arena:kick_player", z.object({}), async () => {
    const code = userToRoom.get(userId)
    if (!code) return
    const room = friendlyRooms.get(code)
    if (room && room.organizerId === userId && room.participantId) {
      const pSocketId = userSockets.get(room.participantId)
      if (pSocketId) {
        const pSocket = io.sockets.sockets.get(pSocketId)
        pSocket?.leave(`room_${code}`)
        pSocket?.emit("arena:kicked")
      }
      userToRoom.delete(room.participantId)
      room.participantId = null
      room.participantUsername = null
      room.participantAvatar = null
      room.participantReady = false
      delete room.examStatus[room.participantId as string]
      delete room.activeTabs[room.participantId as string]
      delete room.scores[room.participantId as string]
      io.to(`room_${code}`).emit("arena:room_updated", room)
    }
  })

  on(socket, "arena:leave_room", z.object({}), async () => {
    const codeRoom = userToRoom.get(userId)
    if (codeRoom) {
      const room = friendlyRooms.get(codeRoom)
      if (room) {
        if (room.organizerId === userId) {
          if (room.participantId) {
            room.organizerId = room.participantId
            room.organizerUsername = room.participantUsername as string
            room.organizerAvatar = room.participantAvatar
            room.participantId = null
            room.participantUsername = null
            room.participantAvatar = null
            room.participantReady = false
            delete room.examStatus[userId]
            delete room.activeTabs[userId]
            delete room.scores[userId]
            socket.to(`room_${codeRoom}`).emit("arena:room_updated", room)
          } else {
            friendlyRooms.delete(codeRoom)
          }
        } else if (room.participantId === userId) {
          room.participantId = null
          room.participantUsername = null
          room.participantAvatar = null
          room.participantReady = false
          delete room.examStatus[userId]
          delete room.activeTabs[userId]
          delete room.scores[userId]
          socket.to(`room_${codeRoom}`).emit("arena:room_updated", room)
        }
        userToRoom.delete(userId)
      }
    }
    socket.leave(`room_${codeRoom}`)
  })

  on(socket, "arena:update_room_settings", z.object({ numberOfQuestions: z.number(), timeLimitMinutes: z.number(), difficulties: z.array(z.string()) }), async ({ numberOfQuestions, timeLimitMinutes, difficulties }) => {
    const code = userToRoom.get(userId)
    if (!code) return
    const room = friendlyRooms.get(code)
    if (room && room.organizerId === userId) {
      room.numberOfQuestions = numberOfQuestions
      room.timeLimitMinutes = timeLimitMinutes
      room.difficulties = difficulties
      room.participantReady = false
      io.to(`room_${code}`).emit("arena:room_updated", room)
    }
  })

  on(socket, "arena:play_again", z.object({}), async () => {
    const code = userToRoom.get(userId)
    console.log(`play_again triggered for user ${userId}. code=${code}`)
    if (!code) return
    const room = friendlyRooms.get(code)
    console.log(`room found? ${!!room}`)
    if (room && (room.organizerId === userId || room.participantId === userId)) {
      console.log(`resetting room problems. currently: ${room.problems?.length}`)
      if (room.problems && room.problems.length > 0) {
        room.problems = []
        room.examStatus = { [room.organizerId]: {} }
        if (room.participantId) room.examStatus[room.participantId] = {}
        room.activeTabs = {}
        room.scores = { [room.organizerId]: 0 }
        if (room.participantId) room.scores[room.participantId] = 0
        room.startTime = null
        room.endTime = null
        if (room.examTimeout) {
          clearTimeout(room.examTimeout)
          room.examTimeout = null
        }
        room.participantReady = false
      }
      console.log(`emitting room_restarted to ${userId}`)
      socket.emit("arena:room_restarted", room)
      socket.to(`room_${code}`).emit("arena:room_updated", room)
    }
  })

  on(socket, "arena:start_room", z.object({}), async () => {
    const code = userToRoom.get(userId)
    if (!code) return
    const room = friendlyRooms.get(code)
    
    if (room && room.organizerId === userId && room.participantId && room.participantReady) {
      try {
        // Fetch N random problems for the exam
        const problems = await getNRandomProblems(room.numberOfQuestions, room.difficulties)
        room.problems = problems
        
        room.startTime = Date.now()
        room.endTime = room.startTime + (room.timeLimitMinutes * 60 * 1000)
        
        // Auto-end the exam when time runs out
        room.examTimeout = setTimeout(() => {
          endExam(code, "Time's up!")
        }, room.timeLimitMinutes * 60 * 1000)
        
        // Emit exam started state directly (we don't create DB records to avoid clutter)
        // Initialize statuses
        room.problems.forEach(p => {
          room.examStatus[room.organizerId][p.id] = "NONE"
          room.examStatus[room.participantId as string][p.id] = "NONE"
        })

        io.to(`room_${code}`).emit("arena:exam_started", {
          roomCode: code,
          problems: room.problems,
          endTime: room.endTime,
          player1: { id: room.organizerId, username: room.organizerUsername, avatar: room.organizerAvatar },
          player2: { id: room.participantId, username: room.participantUsername, avatar: room.participantAvatar },
          examStatus: room.examStatus,
          activeTabs: room.activeTabs,
        })
        
        console.log(`⚔️ Exam started for room: ${code}`)
      } catch (err) {
        console.error("arena:start_room error", err)
        socket.emit("arena:error", { message: "Failed to start exam" })
      }
    }
  })

  function endExam(code: string, reason: string) {
    const room = friendlyRooms.get(code)
    if (!room) return
    
    if (room.examTimeout) clearTimeout(room.examTimeout)
    
    const p1Score = room.scores[room.organizerId] || 0
    const p2Score = room.scores[room.participantId as string] || 0
    
    let winnerId = null
    let winnerUsername = null
    
    if (p1Score > p2Score) {
      winnerId = room.organizerId
      winnerUsername = room.organizerUsername
    } else if (p2Score > p1Score) {
      winnerId = room.participantId
      winnerUsername = room.participantUsername
    } else {
      winnerId = "TIE"
      winnerUsername = "Tie Game"
    }
    
    io.to(`room_${code}`).emit("arena:exam_over", {
      reason,
      winnerId,
      winnerUsername,
      scores: room.scores
    })
  }

  // ── EXAM SUBMISSION & INTERACTION ────────────────────────────────────────────────────────
  
  on(socket, "arena:exam_switch_tab", z.object({ problemId: z.string() }), async ({ problemId }) => {
    const codeRoom = userToRoom.get(userId)
    if (!codeRoom) return
    const room = friendlyRooms.get(codeRoom)
    if (!room) return
    
    room.activeTabs[userId] = problemId
    io.to(`room_${codeRoom}`).emit("arena:exam_tabs_updated", { activeTabs: room.activeTabs })
  })

  on(socket, "arena:exam_forfeit", z.object({}), async () => {
    const codeRoom = userToRoom.get(userId)
    if (!codeRoom) return
    const room = friendlyRooms.get(codeRoom)
    if (!room) return
    
    // The player who forfeited gets a score of -1 to ensure they lose
    room.scores[userId] = -1
    endExam(codeRoom, `${username} forfeited the match!`)
  })

  on(socket, "arena:submit_exam_code", z.object({ problemId: z.string(), code: z.string(), language: z.string() }), async ({ problemId, code: sourceCode, language }) => {
    const codeRoom = userToRoom.get(userId)
    if (!codeRoom) return
    const room = friendlyRooms.get(codeRoom)
    if (!room) return
    if (!room.problems.some((p: any) => p.id === problemId)) return socket.emit("arena:error", { message: "Invalid problem ID" })
    
    // Check if already passed
    if (room.examStatus[userId] && room.examStatus[userId][problemId] === "PASSED") {
      return socket.emit("arena:error", { message: "Already passed this question" })
    }
    
    try {
      const result = await submitSolution(userId, problemId, sourceCode, language)
      
      if (result.allPassed) {
        room.examStatus[userId][problemId] = "PASSED"
        room.scores[userId] += 1
        
        io.to(`room_${codeRoom}`).emit("arena:exam_progress", {
          userId,
          problemId,
          score: room.scores[userId],
          examStatus: room.examStatus
        })
        
        socket.emit("arena:submit_result", { passed: true, results: result.results, problemId })
        
        // Check if someone finished all
        if (room.scores[userId] >= room.numberOfQuestions) {
          endExam(codeRoom, `${username} finished all questions!`)
        }
      } else {
        room.examStatus[userId][problemId] = "FAILED"
        io.to(`room_${codeRoom}`).emit("arena:exam_progress", {
          userId,
          problemId,
          score: room.scores[userId],
          examStatus: room.examStatus
        })
        
        socket.emit("arena:submit_result", { passed: false, results: result.results, problemId })
      }
    } catch (err) {
      socket.emit("arena:error", { message: "Submission failed" })
    }
  })

  // ── STANDARD IN-GAME EVENTS ──────────────────────────────────────────────────────────────
  
  on(socket, "arena:code_change", z.object({ matchId: z.string(), code: z.string() }), async ({ matchId, code }) => {
    const matchMem = activeMatches.get(matchId)
    if (!matchMem || (matchMem.player1Id !== userId && matchMem.player2?.id !== userId)) {
      return socket.emit("arena:error", { message: "Unauthorized code change" })
    }
    socket.to(matchId).emit("arena:opponent_code", { code })
  })

  on(socket, "arena:submit", z.object({ matchId: z.string(), problemId: z.string(), code: z.string(), language: z.string() }), async ({ matchId, problemId, code, language }) => {
    const matchMem = activeMatches.get(matchId)
    if (!matchMem || (matchMem.player1Id !== userId && matchMem.player2?.id !== userId)) {
      return socket.emit("arena:error", { message: "Unauthorized submission" })
    }
    if (matchMem.problemId !== problemId) {
      return socket.emit("arena:error", { message: "Invalid problem ID for this match" })
    }
    if (matchMem.status !== "ACTIVE") {
      return socket.emit("arena:error", { message: "Match is not active" })
    }

    socket.to(matchId).emit("arena:opponent_submitted")
    const result = await submitSolution(userId, problemId, code, language)

    if (result.allPassed) {
      const match = await completeMatch(matchId, userId)

      io.to(matchId).emit("arena:match_over", {
        winnerId: userId,
        winnerUsername:
          match.player1Id === userId
            ? match.player1.username
            : match.player2?.username,
        results: result.results,
        isFriendly: match.isFriendly,
      })

      console.log(`🏆 Match ${matchId} won by ${userId}`)
      cancelBotBattle(matchId)
      matchPlayers.delete(matchId)
      activeMatches.delete(matchId)
    } else {
      socket.emit("arena:submit_result", {
        passed: false,
        results: result.results,
      })
    }
  })

    on(socket, "arena:leave", z.object({ matchId: z.string() }), async ({ matchId }) => {
      const matchMem = activeMatches.get(matchId)
      if (!matchMem || (matchMem.player1Id !== userId && matchMem.player2?.id !== userId)) {
        return socket.emit("arena:error", { message: "Unauthorized leave" })
      }

      socket.leave(matchId)
      cancelBotBattle(matchId)
      matchPlayers.delete(matchId)
      const match = matchMem
      if (match) {
        if (match.status === "WAITING") {
          cancelMatch(matchId)
          socket.to(matchId).emit("arena:opponent_left")
        } else if (match.status === "ACTIVE") {
          const opponentId = match.player1Id === userId ? match.player2?.id : match.player1.id
          if (opponentId) {
            try {
              const endedMatch = await completeMatch(matchId, opponentId)
              io.to(matchId).emit("arena:match_over", {
                winnerId: opponentId,
                winnerUsername: endedMatch.player1Id === opponentId ? endedMatch.player1.username : endedMatch.player2?.username,
                results: [{ passed: true, input: "Opponent Forfeited", expected: "Win", actual: "Win" }],
                isFriendly: false,
              })
              console.log(`🏳️ Match ${matchId} forfeited by ${userId}. Winner: ${opponentId}`)
            } catch (e) {
              console.error("Failed to complete match on forfeit", e)
            }
          }
        }
      }
      activeMatches.delete(matchId)
    })
}
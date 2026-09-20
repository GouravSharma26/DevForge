import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/store/auth.store"
import { useMe } from "./useUser"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface FriendlyRoom {
  code: string
  name: string
  organizerId: string
  organizerUsername: string
  organizerAvatar: string | null
  participantId: string | null
  participantUsername: string | null
  participantAvatar: string | null
  participantReady: boolean
  numberOfQuestions: number
  timeLimitMinutes: number
  difficulties: string[]
}

export interface ArenaState {
  status: "idle" | "searching" | "waiting" | "friendly_waiting" | "active" | "exam_active" | "won" | "lost"
  matchId: string | null
  problem: any | null
  player1: { id: string; username: string; avatar?: string | null; xp?: number } | null
  player2: { id: string; username: string; avatar?: string | null; xp?: number } | null
  opponentCode: string
  results: any[] | null
  winnerUsername: string | null
  opponentSubmitted: boolean
  opponentLeft: boolean
  error: string | null
  room: FriendlyRoom | null
  isFriendly: boolean
  
  // Exam State
  examProblems: any[]
  examEndTime: number | null
  examStatus: Record<string, Record<string, "PASSED" | "FAILED" | "NONE">>
  examActiveTabs: Record<string, string>
  examScores: Record<string, number>
  examReason: string | null
  
  // UI State
  isSubmitting: boolean
}

const INITIAL: ArenaState = {
  status: "idle",
  matchId: null,
  problem: null,
  player1: null,
  player2: null,
  opponentCode: "",
  results: null,
  winnerUsername: null,
  opponentSubmitted: false,
  opponentLeft: false,
  error: null,
  room: null,
  isFriendly: false,
  examProblems: [],
  examEndTime: null,
  examStatus: {},
  examActiveTabs: {},
  examScores: {},
  examReason: null,
  isSubmitting: false,
}

export function useArena() {
  const token = useAuthStore((s) => s.token)
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<ArenaState>(INITIAL)

  const updateState = useCallback((partial: Partial<ArenaState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const { data: dbUser } = useMe()
  const myIdRef = useRef<string | null>(null)

  useEffect(() => {
    myIdRef.current = dbUser?.id || useAuthStore.getState().user?.id || null
  }, [dbUser])

  useEffect(() => {
    if (!token) return

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      { withCredentials: true }
    )

    socketRef.current = socket

    // QUICK MATCH EVENTS
    socket.on("arena:waiting", ({ matchId }) => {
      updateState({ status: "waiting", matchId })
    })

    socket.on("arena:match_found", ({ matchId, problem, player1, player2, isFriendly }) => {
      updateState({ status: "active", matchId, problem, player1, player2, isFriendly: !!isFriendly })
    })

    // FRIENDLY ROOM LOBBY EVENTS
    socket.on("arena:room_created", (room: FriendlyRoom) => {
      updateState({ status: "friendly_waiting", room, error: null, isFriendly: true })
    })

    socket.on("arena:room_updated", (room: FriendlyRoom) => {
      setState(prev => {
        if (prev.status === "exam_active" || prev.status === "won" || prev.status === "lost") {
          return { ...prev, room, isFriendly: true }
        }
        return { ...prev, status: "friendly_waiting", room, isFriendly: true }
      })
    })

    socket.on("arena:room_restarted", (room: FriendlyRoom) => {
      setState(prev => ({
        ...prev,
        status: "friendly_waiting",
        room,
        error: null,
        examProblems: [],
        examStatus: {},
        examActiveTabs: {},
        examScores: {},
        examReason: null,
      }))
    })

    socket.on("arena:room_destroyed", () => {
      setState(INITIAL)
      updateState({ error: "Room was destroyed by the organizer." })
    })

    socket.on("arena:kicked", () => {
      setState(INITIAL)
      updateState({ error: "You were kicked from the room." })
    })

    // EXAM EVENTS
    socket.on("arena:exam_started", ({ roomCode, problems, endTime, player1, player2, examStatus, activeTabs }) => {
      updateState({
        status: "exam_active",
        examProblems: problems,
        examEndTime: endTime,
        player1,
        player2,
        examStatus: examStatus || { [player1.id]: {}, [player2.id]: {} },
        examActiveTabs: activeTabs || {},
        examScores: { [player1.id]: 0, [player2.id]: 0 }
      })
    })

    socket.on("arena:exam_tabs_updated", ({ activeTabs }) => {
      setState(prev => ({ ...prev, examActiveTabs: activeTabs }))
    })

    socket.on("arena:exam_progress", ({ userId, problemId, score, examStatus }) => {
      setState(prev => ({
        ...prev,
        examScores: { ...prev.examScores, [userId]: score },
        examStatus: examStatus
      }))
    })
    
    socket.on("arena:exam_over", ({ reason, winnerId, winnerUsername, scores }) => {
      const myId = myIdRef.current
      updateState({
        status: winnerId === myId ? "won" : winnerId === "TIE" ? "won" : "lost",
        winnerUsername: winnerId === "TIE" ? "It's a Tie!" : winnerUsername,
        examReason: reason,
        examScores: scores,
        isFriendly: true,
      })
    })

    // SHARED / QUICK MATCH EVENTS
    socket.on("arena:opponent_code", ({ code }) => {
      updateState({ opponentCode: code })
    })

    socket.on("arena:opponent_submitted", () => {
      updateState({ opponentSubmitted: true })
    })

    socket.on("arena:submit_result", ({ results, problemId }) => {
      updateState({ results, isSubmitting: false })
      // For exam mode, problemId is returned to know which one failed
    })

    socket.on("arena:match_over", ({ winnerId, winnerUsername, results }) => {
      const myId = myIdRef.current
      updateState({
        status: winnerId === myId ? "won" : "lost",
        winnerUsername,
        results,
        isSubmitting: false,
      })
    })

    socket.on("arena:opponent_left", () => {
      updateState({ opponentLeft: true })
    })

    socket.on("arena:error", ({ message }) => {
      setState(prev => ({
        ...prev,
        error: message,
        isSubmitting: false,
        status: (prev.status === "searching" || prev.status === "waiting") ? "idle" : prev.status
      }))
    })

    return () => {
      socket.disconnect()
    }
  }, [token, updateState])

  // QUICK MATCH ACTIONS
  const joinQueue = useCallback(() => {
    updateState({ status: "searching" })
    socketRef.current?.emit("arena:join_queue")
  }, [updateState])

  const sendCodeChange = useCallback(
    (matchId: string, code: string) => {
      socketRef.current?.emit("arena:code_change", { matchId, code })
    },
    []
  )

  const submitCode = useCallback(
    (matchId: string, problemId: string, code: string, language: string) => {
      updateState({ isSubmitting: true })
      socketRef.current?.emit("arena:submit", { matchId, problemId, code, language })
    },
    [updateState]
  )

  const leaveMatch = useCallback((matchId: string) => {
    socketRef.current?.emit("arena:leave", { matchId })
    setState(INITIAL)
  }, [])

  // FRIENDLY ROOM ACTIONS
  const createRoom = useCallback((name: string, numberOfQuestions: number, timeLimitMinutes: number, difficulties: string[]) => {
    socketRef.current?.emit("arena:create_room", { name, numberOfQuestions, timeLimitMinutes, difficulties })
  }, [])

  const joinRoom = useCallback((code: string) => {
    socketRef.current?.emit("arena:join_room", { code })
  }, [])

  const toggleReady = useCallback(() => {
    socketRef.current?.emit("arena:toggle_ready")
  }, [])

  const kickPlayer = useCallback(() => {
    socketRef.current?.emit("arena:kick_player")
  }, [])

  const startRoom = useCallback(() => {
    socketRef.current?.emit("arena:start_room")
  }, [])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("arena:leave_room")
    setState(INITIAL)
  }, [])
  
  // EXAM ACTIONS
  const submitExamCode = useCallback((problemId: string, code: string, language: string) => {
    updateState({ isSubmitting: true })
    socketRef.current?.emit("arena:submit_exam_code", { problemId, code, language })
  }, [updateState])

  const switchExamTab = useCallback((problemId: string) => {
    socketRef.current?.emit("arena:exam_switch_tab", { problemId })
  }, [])

  const forfeitExam = useCallback(() => {
    socketRef.current?.emit("arena:exam_forfeit")
  }, [])

  const playAgain = useCallback(() => {
    socketRef.current?.emit("arena:play_again")
  }, [])

  const updateRoomSettings = useCallback((numberOfQuestions: number, timeLimitMinutes: number, difficulties: string[]) => {
    socketRef.current?.emit("arena:update_room_settings", { numberOfQuestions, timeLimitMinutes, difficulties })
  }, [])

  const reset = useCallback(() => setState(INITIAL), [])

  return {
    state,
    joinQueue,
    sendCodeChange,
    submitCode,
    leaveMatch,
    reset,
    createRoom,
    joinRoom,
    toggleReady,
    kickPlayer,
    startRoom,
    leaveRoom,
    submitExamCode,
    switchExamTab,
    forfeitExam,
    playAgain,
    updateRoomSettings,
  }
}

export function useMatchHistory() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ["matchHistory"],
    queryFn: async () => {
      const res = await api.get("/arena/history")
      return res.data.data
    },
    enabled: !!token,
  })
}
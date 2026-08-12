import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/store/auth.store"
import { useMe } from "./useUser"

interface ArenaState {
  status: "idle" | "searching" | "waiting" | "active" | "won" | "lost"
  matchId: string | null
  problem: any | null
  player1: any | null
  player2: any | null
  opponentCode: string
  results: any[] | null
  winnerUsername: string | null
  opponentSubmitted: boolean
  opponentLeft: boolean
  error: string | null
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
}

export function useArena() {
  const token = useAuthStore((s) => s.token)
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<ArenaState>(INITIAL)

  const updateState = (partial: Partial<ArenaState>) =>
    setState((prev) => ({ ...prev, ...partial }))

  const { data: dbUser } = useMe()
  const myIdRef = useRef<string | null>(null)

  useEffect(() => {
    myIdRef.current = dbUser?.id || useAuthStore.getState().user?.id || null
  }, [dbUser])

  useEffect(() => {
    if (!token) return

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      { auth: { token } }
    )

    socketRef.current = socket

    socket.on("arena:waiting", ({ matchId }) => {
      updateState({ status: "waiting", matchId })
    })

    socket.on("arena:match_found", ({ matchId, problem, player1, player2 }) => {
      updateState({ status: "active", matchId, problem, player1, player2 })
    })

    socket.on("arena:opponent_code", ({ code }) => {
      updateState({ opponentCode: code })
    })

    socket.on("arena:opponent_submitted", () => {
      updateState({ opponentSubmitted: true })
    })

    socket.on("arena:submit_result", ({ results }) => {
      updateState({ results })
    })

    socket.on("arena:match_over", ({ winnerId, winnerUsername, results }) => {
      const myId = myIdRef.current
      updateState({
        status: winnerId === myId ? "won" : "lost",
        winnerUsername,
        results,
      })
    })

    socket.on("arena:opponent_left", () => {
      updateState({ opponentLeft: true })
    })

    socket.on("arena:error", ({ message }) => {
      updateState({ error: message })
    })

    return () => {
      socket.disconnect()
    }
  }, [token])

  const joinQueue = useCallback(() => {
    updateState({ status: "searching" })
    socketRef.current?.emit("arena:join_queue")
  }, [])

  const sendCodeChange = useCallback(
    (matchId: string, code: string) => {
      socketRef.current?.emit("arena:code_change", { matchId, code })
    },
    []
  )

  const submitCode = useCallback(
    (matchId: string, problemId: string, code: string, language: string) => {
      socketRef.current?.emit("arena:submit", { matchId, problemId, code, language })
    },
    []
  )

  const leaveMatch = useCallback((matchId: string) => {
    socketRef.current?.emit("arena:leave", { matchId })
    setState(INITIAL)
  }, [])

  const reset = useCallback(() => setState(INITIAL), [])

  return {
    state,
    joinQueue,
    sendCodeChange,
    submitCode,
    leaveMatch,
    reset,
  }
}

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

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
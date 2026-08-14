"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useArena } from "@/hooks/useArena"
import { useAuthStore } from "@/store/auth.store"
import { useMe } from "@/hooks/useUser"
import { Users, Zap, X, Copy, Check, Minus, Plus, Clock, Trophy, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

// Helper for countdown timer
function useCountdown(endTime: number | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  useEffect(() => {
    if (!endTime) return
    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now())
      setTimeLeft(remaining)
    }
    tick()
    const int = setInterval(tick, 1000)
    return () => clearInterval(int)
  }, [endTime])
  
  if (!endTime) return "00:00"
  
  const m = Math.floor(timeLeft / 1000 / 60).toString().padStart(2, '0')
  const s = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ArenaPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const userStore = useAuthStore((s) => s.user)
  const { data: dbUser } = useMe()
  const user = dbUser || userStore
  
  const { 
    state, joinQueue, sendCodeChange, submitCode, leaveMatch, reset,
    createRoom, joinRoom, toggleReady, kickPlayer, startRoom, leaveRoom,
    submitExamCode, switchExamTab, forfeitExam, playAgain, updateRoomSettings
  } = useArena()
  
  // Quick Match Code State
  const [code, setCode] = useState("")

  // Exam Mode Local State
  const [activeProblemIdx, setActiveProblemIdx] = useState(0)
  const [examDrafts, setExamDrafts] = useState<Record<string, string>>({})

  // UI State
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(30)
  const [isDragging, setIsDragging] = useState(false)
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [forfeitTimer, setForfeitTimer] = useState(5)

  // Modals for Friendly Match
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [showEditSettings, setShowEditSettings] = useState(false)
  
  // Create Room Form State
  const [roomName, setRoomName] = useState("")
  const [numberOfQuestions, setNumberOfQuestions] = useState(3)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30)
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["EASY", "MEDIUM", "HARD"])
  
  // Join Room Form State
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState(false)
  
  const examTimer = useCountdown(state.examEndTime)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Initialize Quick Match code
  useEffect(() => {
    if (state.problem && state.status === "active") {
      setCode((state.problem.starterCode as any)?.javascript || "")
    }
  }, [state.problem, state.status])

  // Initialize Exam Mode Drafts & Send initial tab
  useEffect(() => {
    if (state.status === "exam_active" && state.examProblems.length > 0) {
      const initialDrafts: Record<string, string> = {}
      state.examProblems.forEach(p => {
        initialDrafts[p.id] = (p.starterCode as any)?.javascript || ""
      })
      setExamDrafts(initialDrafts)
      setActiveProblemIdx(0)
      switchExamTab(state.examProblems[0].id)
    }
  }, [state.status, state.examProblems, switchExamTab])

  // Forfeit Timer countdown
  useEffect(() => {
    let int: NodeJS.Timeout
    if (showForfeitConfirm) {
      setForfeitTimer(5)
      int = setInterval(() => {
        setForfeitTimer(p => {
          if (p <= 1) {
            clearInterval(int)
            return 0
          }
          return p - 1
        })
      }, 1000)
    }
    return () => clearInterval(int)
  }, [showForfeitConfirm])

  // Terminal Resize Drag Logic
  useEffect(() => {
    if (!isDragging) return
    const handleDrag = (e: MouseEvent) => {
      // Rough calculation of container height (viewport - header)
      const containerHeight = window.innerHeight - 64 
      const newHeightPct = ((window.innerHeight - e.clientY) / containerHeight) * 100
      if (newHeightPct > 10 && newHeightPct < 85) {
        setTerminalHeight(newHeightPct)
      }
    }
    const handleMouseUp = () => setIsDragging(false)
    
    // Add covering div to prevent iframe pointer events if necessary, but document events work well
    document.addEventListener("mousemove", handleDrag)
    document.addEventListener("mouseup", handleMouseUp)
    
    // Disable text selection during drag
    document.body.style.userSelect = "none"
    
    return () => {
      document.removeEventListener("mousemove", handleDrag)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  function handleQuickMatchCodeChange(val: string) {
    setCode(val)
    if (state.matchId) sendCodeChange(state.matchId, val)
  }

  function handleExamCodeChange(val: string) {
    const activeProblem = state.examProblems[activeProblemIdx]
    if (activeProblem) {
      setExamDrafts(prev => ({ ...prev, [activeProblem.id]: val }))
    }
  }

  function handleSwitchTab(idx: number) {
    setActiveProblemIdx(idx)
    const prob = state.examProblems[idx]
    if (prob) switchExamTab(prob.id)
  }

  const handleCopyCode = () => {
    if (state.room?.code) {
      navigator.clipboard.writeText(state.room.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!hydrated || !token) return null

  // ──────────────────────────────────────────────────────────────
  // 1. IDLE (MODE SELECTION)
  // ──────────────────────────────────────────────────────────────
  if (state.status === "idle") return (
    <main className="bg-base min-h-full flex flex-col pt-12 pb-24 px-6 relative overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">PvP Arena</h1>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-2">Choose your battleground</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Quick Match Card */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-[var(--color-accent)] animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <Zap className="w-12 h-12 text-[#ea580c] mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono mb-2">Quick Match</h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono mb-6 flex-1">
              Battle a random opponent. First to solve the problem wins.
            </p>
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono bg-black/20 p-2 rounded-lg justify-center border border-[var(--border-subtle)]">
                <span>🏆</span> Ranked • +100 XP
              </div>
              <button 
                onClick={joinQueue}
                className="w-full py-3 rounded-xl text-sm font-bold border-none cursor-pointer font-mono bg-gradient-to-br from-[#ea580c] to-[#d97706] text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)] transition-all hover:brightness-110"
              >
                Find Match
              </button>
            </div>
          </div>

          {/* Friendly Match Card */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-[var(--color-accent)] animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Users className="w-12 h-12 text-[#10b981] mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono mb-2">Friendly Exam</h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono mb-6 flex-1">
              Create a custom room. Set global time and number of questions.
            </p>
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono bg-black/20 p-2 rounded-lg justify-center border border-[var(--border-subtle)]">
                <span>🤝</span> Unranked • 0 XP
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowCreateRoom(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border-none cursor-pointer font-mono bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] transition-all"
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowJoinRoom(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border-none cursor-pointer font-mono bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/20 transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => router.push("/problems")}
          className="mt-12 text-xs text-[var(--text-muted)] bg-transparent border-none cursor-pointer font-mono hover:text-[var(--text-primary)] transition-colors"
        >
          ← Back to Practice
        </button>
      </div>

      {/* MODALS */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm relative">
            <button onClick={() => setShowCreateRoom(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
              <Users className="text-[#10b981]" size={20} /> Create Room
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-mono mb-1.5 block uppercase tracking-wider">Room Name</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Late Night Grind"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#10b981]"
                />
              </div>
              
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-[var(--border-subtle)]">
                <label className="text-xs text-[var(--text-secondary)] font-mono block uppercase tracking-wider">No. Questions</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setNumberOfQuestions(Math.max(1, numberOfQuestions - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Minus size={14}/></button>
                  <span className="text-sm font-bold font-mono w-4 text-center">{numberOfQuestions}</span>
                  <button onClick={() => setNumberOfQuestions(Math.min(10, numberOfQuestions + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Plus size={14}/></button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-[var(--border-subtle)]">
                <label className="text-xs text-[var(--text-secondary)] font-mono block uppercase tracking-wider">Time Limit (Min)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTimeLimitMinutes(Math.max(5, timeLimitMinutes - 5))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Minus size={14}/></button>
                  <span className="text-sm font-bold font-mono w-6 text-center">{timeLimitMinutes}</span>
                  <button onClick={() => setTimeLimitMinutes(Math.min(120, timeLimitMinutes + 5))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Plus size={14}/></button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] font-mono mb-2 block uppercase tracking-wider">Difficulties</label>
                <div className="flex gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map(diff => {
                    const isSelected = selectedDifficulties.includes(diff)
                    return (
                      <button
                        key={diff}
                        onClick={() => {
                          if (isSelected && selectedDifficulties.length > 1) {
                            setSelectedDifficulties(prev => prev.filter(d => d !== diff))
                          } else if (!isSelected) {
                            setSelectedDifficulties(prev => [...prev, diff])
                          }
                        }}
                        className={`flex-1 py-2 text-xs rounded-lg font-mono font-bold transition-all ${
                          isSelected 
                            ? (diff === "EASY" ? 'bg-[#10b981] text-black' : diff === "MEDIUM" ? 'bg-[#f59e0b] text-black' : 'bg-[#ef4444] text-white')
                            : 'bg-transparent border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        {diff}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  createRoom(roomName || `${user?.username}'s Room`, numberOfQuestions, timeLimitMinutes, selectedDifficulties)
                  setShowCreateRoom(false)
                }}
                className="w-full py-3 mt-2 rounded-xl text-sm font-bold font-mono bg-white text-black hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Generate Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-sm relative">
            <button onClick={() => setShowJoinRoom(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
              <Zap className="text-[#10b981]" size={20} /> Join Room
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-mono mb-1.5 block text-center uppercase tracking-wider">Enter Code</label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-4 text-center text-2xl tracking-[0.3em] text-white font-mono focus:outline-none focus:border-[#10b981] shadow-inner"
                />
              </div>
              {state.error && <p className="text-xs text-red-500 font-mono text-center bg-red-500/10 p-2 rounded">{state.error}</p>}
              <button
                disabled={joinCode.length < 6}
                onClick={() => joinRoom(joinCode)}
                className="w-full py-3 mt-4 rounded-xl text-sm font-bold font-mono bg-gradient-to-r from-[#10b981] to-[#059669] text-black shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Battle
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )

  // ──────────────────────────────────────────────────────────────
  // 2. LOBBY (FRIENDLY WAITING ROOM)
  // ──────────────────────────────────────────────────────────────
  if (state.status === "friendly_waiting" && state.room) {
    const isOrganizer = state.room.organizerId === user?.id
    
    return (
      <main className="bg-base min-h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="glass-panel rounded-2xl max-w-2xl w-full p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] to-[#3b82f6]" />
          
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
                {state.room.name}
                {isOrganizer && (
                  <button 
                    onClick={() => {
                      setNumberOfQuestions(state.room!.numberOfQuestions)
                      setTimeLimitMinutes(state.room!.timeLimitMinutes)
                      setSelectedDifficulties(state.room!.difficulties || ["EASY", "MEDIUM", "HARD"])
                      setShowEditSettings(true)
                    }}
                    className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-[var(--text-muted)] hover:text-white px-2 py-1 rounded transition-colors"
                  >
                    Edit Settings
                  </button>
                )}
              </h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-[#10b981] border border-[#10b981]/30 font-mono flex items-center gap-1">
                  <Clock size={12}/> {state.room.timeLimitMinutes} MINS
                </span>
                <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-[#3b82f6] border border-[#3b82f6]/30 font-mono flex items-center gap-1">
                  <Trophy size={12}/> {state.room.numberOfQuestions} Qs
                </span>
                {state.room.difficulties?.map(d => (
                  <span key={d} className={`text-[10px] px-2 py-1 rounded font-mono font-bold uppercase border ${d === 'EASY' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : d === 'MEDIUM' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
            {isOrganizer ? (
              <button onClick={leaveRoom} className="text-xs bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 font-mono transition-colors">
                Destroy Room
              </button>
            ) : (
              <button onClick={leaveRoom} className="text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg hover:text-white font-mono transition-colors">
                Leave Room
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Organizer Slot */}
            <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-[var(--border-subtle)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#ea580c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] mb-4 flex items-center justify-center text-2xl border border-[var(--color-accent)] shadow-[0_0_15px_rgba(234,88,12,0.2)] relative z-10">
                👑
              </div>
              <p className="text-sm font-bold text-white font-mono relative z-10">{state.room.organizerUsername}</p>
              <p className="text-xs text-[#ea580c] font-mono mt-1 relative z-10">Organizer</p>
            </div>

            {/* Participant Slot */}
            <div className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-[var(--border-subtle)] relative overflow-hidden group">
              {isOrganizer && state.room.participantId && (
                <button onClick={kickPlayer} className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-400 font-mono z-20 bg-black/50 px-2 py-1 rounded">Kick</button>
              )}
              {state.room.participantId ? (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-b ${state.room.participantReady ? 'from-[#10b981]/10' : 'from-transparent'} to-transparent transition-colors`} />
                  <div className={`w-16 h-16 rounded-full bg-[var(--bg-surface)] mb-4 flex items-center justify-center text-2xl border transition-colors relative z-10 ${state.room.participantReady ? 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-[#10b981]/10' : 'border-[var(--border-subtle)]'}`}>
                    {state.room.participantReady ? '🔥' : '⏳'}
                  </div>
                  <p className="text-sm font-bold text-white font-mono relative z-10">{state.room.participantUsername}</p>
                  <p className={`text-xs font-mono mt-1 relative z-10 ${state.room.participantReady ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                    {state.room.participantReady ? 'READY' : 'Not Ready'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--border-subtle)] mb-4 flex items-center justify-center opacity-50 relative z-10" />
                  <p className="text-sm font-bold text-[var(--text-muted)] font-mono relative z-10">Waiting for player...</p>
                </>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center pt-6 border-t border-[var(--border-subtle)]">
            {isOrganizer ? (
              <div className="w-full flex flex-col items-center">
                <div className="mb-6 text-center w-full">
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono mb-2 uppercase tracking-widest">Share Code</p>
                  <div 
                    onClick={handleCopyCode}
                    className="group bg-black/40 border border-[var(--border-subtle)] rounded-lg py-3 px-6 flex items-center justify-center gap-4 cursor-pointer hover:border-[var(--color-accent)] transition-all max-w-xs mx-auto shadow-inner"
                  >
                    <span className="text-3xl font-mono tracking-[0.2em] text-white font-bold">{state.room.code}</span>
                    {copied ? <Check className="text-[#10b981]" size={20} /> : <Copy className="text-[var(--text-muted)] group-hover:text-[var(--color-accent)] transition-colors" size={20} />}
                  </div>
                </div>
                <button
                  disabled={!state.room.participantId || !state.room.participantReady}
                  onClick={startRoom}
                  className="w-full max-w-xs py-4 rounded-xl text-sm font-bold border-none font-mono bg-gradient-to-br from-[#10b981] to-[#059669] text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  START MATCH
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <button
                  onClick={toggleReady}
                  className={`w-full max-w-xs py-4 rounded-xl text-sm font-bold border-2 font-mono transition-all ${
                    state.room.participantReady 
                      ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-transparent border-[var(--border-subtle)] text-white hover:border-white shadow-lg'
                  }`}
                >
                  {state.room.participantReady ? 'I AM READY' : 'CLICK TO GET READY'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Settings Modal */}
        {showEditSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(16,185,129,0.1)] border border-[#10b981]/30">
              <button onClick={() => setShowEditSettings(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                <Clock className="text-[#10b981]" size={20} /> Edit Settings
              </h2>
              <div className="flex flex-col gap-6">
                
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-[var(--border-subtle)]">
                  <label className="text-xs text-[var(--text-secondary)] font-mono block uppercase tracking-wider">No. Questions</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNumberOfQuestions(Math.max(1, numberOfQuestions - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Minus size={14}/></button>
                    <span className="text-sm font-bold font-mono w-4 text-center">{numberOfQuestions}</span>
                    <button onClick={() => setNumberOfQuestions(Math.min(10, numberOfQuestions + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Plus size={14}/></button>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-[var(--border-subtle)]">
                  <label className="text-xs text-[var(--text-secondary)] font-mono block uppercase tracking-wider">Time Limit (Min)</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTimeLimitMinutes(Math.max(5, timeLimitMinutes - 5))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Minus size={14}/></button>
                    <span className="text-sm font-bold font-mono w-6 text-center">{timeLimitMinutes}</span>
                    <button onClick={() => setTimeLimitMinutes(Math.min(120, timeLimitMinutes + 5))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-white/10 text-white transition-colors"><Plus size={14}/></button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-secondary)] font-mono mb-2 block uppercase tracking-wider">Difficulties</label>
                  <div className="flex gap-2">
                    {(["EASY", "MEDIUM", "HARD"] as const).map(diff => {
                      const isSelected = selectedDifficulties.includes(diff)
                      return (
                        <button
                          key={diff}
                          onClick={() => {
                            if (isSelected && selectedDifficulties.length > 1) {
                              setSelectedDifficulties(prev => prev.filter(d => d !== diff))
                            } else if (!isSelected) {
                              setSelectedDifficulties(prev => [...prev, diff])
                            }
                          }}
                          className={`flex-1 py-2 text-xs rounded-lg font-mono font-bold transition-all ${
                            isSelected 
                              ? (diff === "EASY" ? 'bg-[#10b981] text-black' : diff === "MEDIUM" ? 'bg-[#f59e0b] text-black' : 'bg-[#ef4444] text-white')
                              : 'bg-transparent border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                          }`}
                        >
                          {diff}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    updateRoomSettings(numberOfQuestions, timeLimitMinutes, selectedDifficulties)
                    setShowEditSettings(false)
                  }}
                  className="w-full py-3 mt-2 rounded-xl text-sm font-bold font-mono bg-gradient-to-r from-[#10b981] to-[#059669] text-black shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // 3. SEARCHING / WAITING (QUICK MATCH)
  // ──────────────────────────────────────────────────────────────
  if (state.status === "searching" || state.status === "waiting") return (
    <main className="bg-base min-h-full flex items-center justify-center p-6 overflow-y-auto">
      <div className="text-center flex flex-col gap-4 items-center">
        <div className="text-5xl animate-pulse">⚔️</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono">
          {state.status === "searching" ? "Finding opponent..." : "Waiting for opponent..."}
        </h2>
        <p className="text-xs text-[var(--text-muted)] font-mono">Match ID: {state.matchId}</p>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#ea580c]" style={{ animation: `bounce 1s ease infinite ${i * 0.15}s` }} />
          ))}
        </div>
        <button
          onClick={reset}
          className="text-xs text-[var(--text-muted)] bg-transparent border-none cursor-pointer font-mono hover:text-white transition-colors mt-4"
        >
          Cancel
        </button>
      </div>
    </main>
  )

  // ──────────────────────────────────────────────────────────────
  // 4. WON / LOST
  // ──────────────────────────────────────────────────────────────
  if (state.status === "won" || state.status === "lost") {
    const won = state.status === "won"
    const tie = state.winnerUsername === "It's a Tie!"
    
    return (
      <main className="bg-base min-h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="text-6xl mb-4">{tie ? "🤝" : won ? "🏆" : "💀"}</div>
          <h1 className={`text-4xl font-extrabold font-mono ${tie ? "text-[#3b82f6]" : won ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
            {tie ? "It's a Tie!" : won ? "You Won!" : "You Lost"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-2">
            {state.examReason 
              ? state.examReason
              : won 
                ? (state.isFriendly ? "Bragging rights secured!" : "+100 XP earned") 
                : `${state.winnerUsername} solved it first`}
          </p>
        </div>

        {/* Exam Scores (if Exam Mode) */}
        {Object.keys(state.examScores).length > 0 && (
          <div className="flex gap-8 mb-8 bg-black/20 p-6 rounded-2xl border border-[var(--border-subtle)]">
             <div className="text-center">
                <p className="text-xs text-[var(--text-muted)] font-mono mb-1">Your Score</p>
                <p className={`text-3xl font-bold font-mono ${won ? 'text-[#10b981]' : 'text-white'}`}>{state.examScores[user?.id || ''] || 0}</p>
             </div>
             <div className="w-px bg-[var(--border-subtle)]" />
             <div className="text-center">
                <p className="text-xs text-[var(--text-muted)] font-mono mb-1">Opponent Score</p>
                <p className="text-3xl font-bold text-white font-mono">
                  {Object.entries(state.examScores).find(([k]) => k !== user?.id)?.[1] || 0}
                </p>
             </div>
          </div>
        )}

        {/* Quick Match Results */}
        {state.results && !state.examReason && (
          <div className="w-full max-w-md flex flex-col gap-2 mb-8">
            {state.results.map((r: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg text-xs font-mono border ${r.passed ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                Test {i + 1}: {r.passed ? "✅ Passed" : "❌ Failed"}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-4">
          <button onClick={state.isFriendly ? playAgain : reset} className="py-3 px-8 rounded-xl text-sm font-bold border-none font-mono bg-gradient-to-br from-[#ea580c] to-[#d97706] text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)] hover:brightness-110">
            Play Again
          </button>
          <button
            onClick={() => {
              if (state.isFriendly) leaveRoom()
              else leaveMatch(state.matchId || "")
              reset()
            }}
            className="py-3 px-8 rounded-xl text-sm font-bold font-mono bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white"
          >
            Back to Arena
          </button>
          <button
            onClick={() => {
              if (state.isFriendly) leaveRoom()
              else leaveMatch(state.matchId || "")
              router.push("/problems")
            }}
            className="py-3 px-8 rounded-xl text-sm font-bold font-mono bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white"
          >
            Practice
          </button>
        </div>
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // Helpers for Render
  // ──────────────────────────────────────────────────────────────
  const renderDot = (status: "PASSED" | "FAILED" | "NONE", isActive: boolean) => {
    if (status === "PASSED") return <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    if (status === "FAILED") return <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
    if (isActive) return <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
    return <div className="w-2.5 h-2.5 rounded-full bg-[var(--border-subtle)]" />
  }

  // ──────────────────────────────────────────────────────────────
  // QUICK MATCH ACTIVE BATTLE
  // ──────────────────────────────────────────────────────────────
  if (state.status === "active") {
    return (
      <main className="bg-base h-screen flex flex-col overflow-hidden">
        {/* Battle bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] px-6 h-12 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">⚔️ LIVE BATTLE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="text-[11px] text-[var(--text-muted)] font-mono">{state.problem?.title}</span>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              <span className={`text-xs font-mono ${state.player1?.id === user?.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {state.player1?.username}
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono font-bold">VS</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span className={`text-xs font-mono ${state.player2?.id === user?.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {state.player2?.username}
              </span>
              {state.opponentSubmitted && (
                <span className="text-[10px] text-[#f59e0b] font-mono animate-pulse">submitted!</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowForfeitConfirm(true)}
              className="bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold font-mono hover:bg-red-500/20 transition-colors"
            >
              QUIT MATCH
            </button>
            <button
              disabled={state.isSubmitting}
              onClick={() => state.matchId && submitCode(state.matchId, state.problem.id, code, "javascript")}
              className="px-5 py-2 rounded-lg text-xs cursor-pointer font-mono bg-[#ea580c]/10 border border-[#ea580c]/30 text-[#ea580c] font-bold shadow-[0_4px_15px_rgba(234,88,12,0.15)] hover:bg-[#ea580c]/20 transition-colors disabled:opacity-50"
            >
              {state.isSubmitting ? "Compiling..." : "▶ Submit"}
            </button>
          </div>
        </div>

        {state.opponentLeft && (
          <div className="bg-[#f59e0b]/10 border-b border-[#f59e0b]/30 py-2 px-6 text-xs text-[#f59e0b] text-center font-mono">
            Opponent disconnected — you win by default!
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Problem panel */}
          <div className="w-[35%] border-r border-[var(--border-subtle)] p-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] font-mono">{state.problem?.title}</h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">{state.problem?.category}</p>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre-wrap">
              {state.problem?.description}
            </p>
            {state.problem?.examples && (state.problem.examples as any[]).map((ex: any, i: number) => (
              <div key={i} className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-3 text-[11px] font-mono">
                <p className="text-[var(--text-muted)]">Input: <code className="text-[var(--text-primary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.input}</code></p>
                <p className="text-[var(--text-muted)] mt-1">Output: <code className="text-[var(--text-secondary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.output}</code></p>
              </div>
            ))}
          </div>

          {/* Editor & Terminal */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor */}
            <div style={{ height: `${100 - terminalHeight}%` }} className="flex flex-col border-b border-[var(--border-subtle)] min-h-0">
              <div className="px-4 py-2 border-b border-white/10 bg-base text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5a5780]" />
                Your Code
              </div>
              <div className="flex-1 relative min-h-0">
                <MonacoEditor
                  height="100%"
                  language="javascript"
                  value={code}
                  onChange={(val) => {
                    setCode(val || "")
                    if (state.matchId) sendCodeChange(state.matchId, val || "")
                  }}
                  theme="vs-dark"
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 } }}
                />
              </div>
            </div>

            {/* Draggable Resizer */}
            <div 
              className="h-1 bg-[var(--border-subtle)] cursor-row-resize hover:bg-[#ea580c] transition-colors relative z-10"
              onMouseDown={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
            />

            {/* Terminal */}
            <div style={{ height: `${terminalHeight}%` }} className="bg-[#0a0a0a] flex flex-col min-h-0">
              <div className="px-4 py-2 border-b border-white/5 bg-[#111] text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-2 sticky top-0 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                Terminal Output
              </div>
              <div className="p-4 font-mono text-xs flex flex-col gap-4 overflow-y-auto">
                {!state.results ? (
                  <div className="text-[#555]">&gt; Ready. Awaiting code execution...</div>
                ) : (
                  state.results.map((r: any, i: number) => (
                    <div key={i} className={`flex flex-col gap-1.5 bg-white/5 p-3 rounded-lg border ${r.passed ? 'border-[#10b981]/30' : 'border-[#ef4444]/30'} shrink-0`}>
                      <div className={`font-bold ${r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        Test {i + 1}: {r.passed ? "✅ Passed" : "❌ Failed"}
                      </div>
                      <div className="flex gap-4">
                        <div className="text-[var(--text-muted)] text-[10px]">Input: <code className="text-[var(--text-secondary)]">{r.input}</code></div>
                        <div className="text-[var(--text-muted)] text-[10px]">Expected: <code className="text-[var(--text-secondary)]">{r.expected}</code></div>
                      </div>
                      <div className="text-[var(--text-muted)] text-[10px]">
                        Output: <code className={r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}>{r.output || "no output"}</code>
                      </div>
                      {r.stderr && (
                        <div className="text-[#ef4444] text-[10px] mt-1 p-2 bg-[#ef4444]/10 rounded whitespace-pre-wrap">
                          {r.stderr}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quit Modal */}
        {showForfeitConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#111] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full text-center">
              <h3 className="text-lg font-bold text-white font-mono mb-2">Quit Match?</h3>
              <p className="text-sm text-[var(--text-muted)] font-mono mb-6">If you quit, your opponent will automatically win.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowForfeitConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-sm font-bold font-mono hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    leaveMatch(state.matchId!)
                    setShowForfeitConfirm(false)
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-500 border border-red-500/30 text-sm font-bold font-mono hover:bg-red-500/30 transition-colors"
                >
                  Yes, Quit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // 6. ACTIVE EXAM BATTLE (FRIENDLY MULTI-QUESTION)
  // ──────────────────────────────────────────────────────────────
  if (state.status === "exam_active") {
    const activeProblem = state.examProblems[activeProblemIdx]
    const oppId = Object.keys(state.examStatus).find(k => k !== user?.id) || ''
    const myId = user?.id || ''
    
    const myStatus = state.examStatus[myId] || {}
    const oppStatus = state.examStatus[oppId] || {}
    const isPassed = myStatus[activeProblem?.id] === "PASSED"

    const oppActiveProblemId = state.examActiveTabs[oppId]
    
    return (
      <main className="bg-base h-screen flex flex-col overflow-hidden">
        {/* Exam Battle bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowForfeitConfirm(true)}
              className="bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold font-mono hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              QUIT MATCH
            </button>
            <div className="flex items-center gap-2 text-sm font-mono font-bold text-white bg-black/40 px-3 py-1 rounded-lg border border-[var(--border-subtle)] shadow-inner">
               <Clock size={14} className={examTimer.startsWith("00:") ? "text-red-500 animate-pulse" : "text-[#10b981]"} />
               <span className={examTimer.startsWith("00:") ? "text-red-500" : ""}>{examTimer}</span>
            </div>
          </div>
          
          {/* Enhanced Scoreboard */}
          <div className="flex items-center gap-8">
            {/* Player 1 (You) */}
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px] font-bold">
                   {state.player1?.id === myId ? state.player1?.username[0] : state.player2?.username[0]}
                 </div>
                 <span className="text-xs font-bold text-white font-mono">YOU</span>
               </div>
               <div className="flex gap-1.5">
                 {state.examProblems.map(p => (
                   <div key={p.id}>{renderDot(myStatus[p.id] || "NONE", activeProblem?.id === p.id)}</div>
                 ))}
               </div>
            </div>

            <div className="w-px h-8 bg-[var(--border-subtle)]" />

            {/* Player 2 (Opponent) */}
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-6 h-6 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[10px] font-bold">
                   {state.player1?.id === oppId ? state.player1?.username[0] : state.player2?.username[0]}
                 </div>
                 <span className="text-xs font-bold text-[var(--text-muted)] font-mono uppercase truncate max-w-[80px]">
                   {state.player1?.id === oppId ? state.player1?.username : state.player2?.username}
                 </span>
               </div>
               <div className="flex gap-1.5">
                 {state.examProblems.map(p => (
                   <div key={p.id}>{renderDot(oppStatus[p.id] || "NONE", oppActiveProblemId === p.id)}</div>
                 ))}
               </div>
            </div>
          </div>
          
          <button
            disabled={isPassed || state.isSubmitting}
            onClick={() => activeProblem && submitExamCode(activeProblem.id, examDrafts[activeProblem.id], "javascript")}
            className="w-32 py-2 rounded-lg text-xs cursor-pointer font-mono bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] font-bold shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:bg-[#10b981]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
          >
            {state.isSubmitting ? (
              <span className="animate-pulse">Compiling...</span>
            ) : isPassed ? "✅ Passed" : "▶ Submit"}
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Problem panel */}
          <div className="w-[40%] border-r border-[var(--border-subtle)] flex flex-col bg-black/10">
            {/* Question Tabs */}
            <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-base)] overflow-x-auto shrink-0">
              {state.examProblems.map((p, idx) => {
                const s = myStatus[p.id]
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchTab(idx)}
                    className={`flex-1 py-3 px-4 text-xs font-mono font-bold border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${
                      activeProblemIdx === idx 
                        ? 'border-[var(--color-accent)] text-white bg-[var(--bg-surface)]' 
                        : 'border-transparent text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Q{idx + 1}
                    {s === "PASSED" && <Check size={12} className="text-[#10b981]" />}
                    {s === "FAILED" && <X size={12} className="text-[#ef4444]" />}
                  </button>
                )
              })}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-bold text-white font-mono">{activeProblem?.title}</h2>
                <div className="flex gap-2 mt-2">
                   <span className="text-[10px] bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-0.5 rounded font-mono uppercase border border-[var(--border-subtle)]">
                     {activeProblem?.category}
                   </span>
                   <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase border ${activeProblem?.difficulty === 'EASY' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : activeProblem?.difficulty === 'MEDIUM' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'}`}>
                     {activeProblem?.difficulty}
                   </span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre-wrap">
                {activeProblem?.description}
              </p>
              {activeProblem?.examples && (activeProblem.examples as any[]).map((ex: any, i: number) => (
                <div key={i} className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs font-mono">
                  <p className="text-[var(--text-muted)]">Input: <code className="text-white bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.input}</code></p>
                  <p className="text-[var(--text-muted)] mt-2">Output: <code className="text-[var(--text-secondary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.output}</code></p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor & Terminal */}
          <div className="flex-[1_1_60%] flex flex-col relative overflow-hidden min-h-0">
            {/* Editor */}
            <div 
              style={{ height: isTerminalMinimized ? 'calc(100% - 40px)' : `${100 - terminalHeight}%` }}
              className={`flex flex-col border-b border-[var(--border-subtle)] overflow-hidden transition-all duration-300 min-h-0 shrink-0`}
            >
              <div className="py-2 px-4 border-b border-white/10 bg-[var(--bg-base)] text-xs text-[var(--text-muted)] font-mono flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5a5780]" />
                  Your Code
                </div>
                {isPassed && <span className="text-[#10b981] font-bold">SOLVED</span>}
              </div>
              <div className="flex-1 relative overflow-hidden min-h-0">
                {isPassed && <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px] pointer-events-none" />}
                <MonacoEditor
                  height="100%"
                  language="javascript"
                  value={examDrafts[activeProblem?.id] || ""}
                  onChange={(val) => handleExamCodeChange(val || "")}
                  theme="vs-dark"
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 }, readOnly: isPassed }}
                />
              </div>
            </div>
            
            {/* Resizer Handle */}
            {!isTerminalMinimized && (
              <div 
                className="h-1 bg-[var(--border-subtle)] hover:bg-[#ea580c] cursor-ns-resize shrink-0 transition-colors z-20 relative"
                onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
              />
            )}

            {/* Terminal */}
            <div 
              style={{ height: isTerminalMinimized ? '40px' : `${terminalHeight}%` }}
              className={`bg-[#0a0a0a] flex flex-col transition-all duration-300 min-h-0 shrink-0`}
            >
              <div 
                className="h-10 py-2 px-4 border-b border-white/5 bg-[#111] text-xs text-[var(--text-muted)] font-mono flex items-center justify-between shrink-0 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsTerminalMinimized(!isTerminalMinimized)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                  Terminal Output
                </div>
                <button className="text-[var(--text-muted)] hover:text-white transition-colors bg-transparent border-none">
                  {isTerminalMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {!isTerminalMinimized && (
                <div className="p-4 font-mono text-xs flex flex-col gap-4 overflow-y-auto flex-1">
                  {!state.results ? (
                    <div className="text-[#555]">&gt; Run code to see output...</div>
                  ) : (
                    state.results.map((r: any, i: number) => (
                      <div key={i} className={`flex flex-col gap-1.5 bg-white/5 p-3 rounded-lg border ${r.passed ? 'border-[#10b981]/30' : 'border-[#ef4444]/30'} shrink-0`}>
                        <div className={`font-bold ${r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          Test {i + 1}: {r.passed ? "✅ Passed" : "❌ Failed"}
                        </div>
                        <div className="flex gap-4">
                          <div className="text-[var(--text-muted)] text-[10px]">Input: <code className="text-[var(--text-secondary)]">{r.input}</code></div>
                          <div className="text-[var(--text-muted)] text-[10px]">Expected: <code className="text-[var(--text-secondary)]">{r.expected}</code></div>
                        </div>
                        <div className="text-[var(--text-muted)] text-[10px]">
                          Output: <code className={r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}>{r.output || "no output"}</code>
                        </div>
                        {r.stderr && (
                          <div className="text-[#ef4444] text-[10px] mt-1 p-2 bg-[#ef4444]/10 rounded whitespace-pre-wrap">
                            {r.stderr}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Forfeit Confirm Modal */}
        {showForfeitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[#111] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-white font-mono mb-2">Quit Match?</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mb-8">
                  Are you sure you want to quit? This will immediately forfeit the match and grant the win to your opponent.
                </p>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setShowForfeitConfirm(false)}
                     className="flex-1 py-3 rounded-xl text-sm font-bold bg-[var(--bg-surface)] text-white border border-[var(--border-subtle)] hover:bg-white/10 transition-colors font-mono"
                   >
                     Cancel
                   </button>
                   <button 
                     disabled={forfeitTimer > 0}
                     onClick={() => {
                        setShowForfeitConfirm(false)
                        forfeitExam()
                     }}
                     className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {forfeitTimer > 0 ? `Wait (${forfeitTimer})` : "Yes, Quit"}
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>
    )
  }

  // ──────────────────────────────────────────────────────────────
  // 6. ACTIVE BATTLE (QUICK MATCH)
  // ──────────────────────────────────────────────────────────────
  return (
    <main className="bg-base h-screen flex flex-col overflow-hidden">
      {/* Battle bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--glass-bg)]/5 px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white font-mono">⚔️ LIVE BATTLE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:block">{state.problem?.title}</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
            <span className={`text-xs font-mono ${state.player1?.id === user?.id ? "text-white font-bold" : "text-[var(--text-muted)]"}`}>
              {state.player1?.username}
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold">VS</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            <span className={`text-xs font-mono ${state.player2?.id === user?.id ? "text-white font-bold" : "text-[var(--text-muted)]"}`}>
              {state.player2?.username}
            </span>
            {state.opponentSubmitted && (
              <span className="text-[9px] text-[#f59e0b] font-mono animate-pulse uppercase tracking-wider">submitted!</span>
            )}
          </div>
        </div>
        <button
          disabled={state.isSubmitting}
          onClick={() => state.matchId && submitCode(state.matchId, state.problem.id, code, "javascript")}
          className="w-32 py-2 rounded-lg text-xs cursor-pointer font-mono bg-[#d97706]/20 border border-[#fdba74]/40 text-[#fed7aa] font-bold shadow-[0_4px_20px_rgba(234,88,12,0.1)] hover:bg-[#d97706]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {state.isSubmitting ? (
            <span className="animate-pulse">Compiling...</span>
          ) : "▶ Submit"}
        </button>
      </div>

      {state.opponentLeft && (
        <div className="bg-[#f59e0b]/10 border-b border-[#f59e0b]/30 py-2 px-6 text-xs text-[#f59e0b] text-center font-mono shrink-0">
          Opponent disconnected — you win by default!
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Problem panel */}
        <div className="w-[35%] border-r border-[var(--border-subtle)] overflow-y-auto p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">{state.problem?.title}</h2>
            <div className="flex gap-2 mt-2">
               <span className="text-[10px] bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-0.5 rounded font-mono uppercase border border-[var(--border-subtle)]">
                 {state.problem?.category}
               </span>
               <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase border ${state.problem?.difficulty === 'EASY' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : state.problem?.difficulty === 'MEDIUM' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'}`}>
                 {state.problem?.difficulty}
               </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre-wrap">
            {state.problem?.description}
          </p>
          {state.problem?.examples && (state.problem.examples as any[]).map((ex: any, i: number) => (
            <div key={i} className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs font-mono">
              <p className="text-[var(--text-muted)]">Input: <code className="text-white bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.input}</code></p>
              <p className="text-[var(--text-muted)] mt-2">Output: <code className="text-[var(--text-secondary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">{ex.output}</code></p>
            </div>
          ))}
        </div>

        {/* Editor & Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
          {/* Editor */}
          <div 
            style={{ height: isTerminalMinimized ? 'calc(100% - 40px)' : `${100 - terminalHeight}%` }}
            className={`flex flex-col border-b border-[var(--border-subtle)] transition-all duration-300 overflow-hidden min-h-0 shrink-0`}
          >
            <div className="py-2 px-4 border-b border-white/10 bg-[var(--bg-base)] text-xs text-[var(--text-muted)] font-mono flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5a5780]" />
              Your Code
            </div>
            <div className="flex-1 relative overflow-hidden min-h-0">
              <MonacoEditor
                height="100%"
                language="javascript"
                value={code}
                onChange={(val) => handleQuickMatchCodeChange(val || "")}
                theme="vs-dark"
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 } }}
              />
            </div>
          </div>
          
          {/* Resizer Handle */}
          {!isTerminalMinimized && (
            <div 
              className="h-1 bg-[var(--border-subtle)] hover:bg-[#ea580c] cursor-ns-resize shrink-0 transition-colors z-20 relative"
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
            />
          )}

          {/* Terminal */}
          <div 
            style={{ height: isTerminalMinimized ? '40px' : `${terminalHeight}%` }}
            className={`bg-[#0a0a0a] flex flex-col transition-all duration-300 overflow-hidden min-h-0 shrink-0`}
          >
            <div 
              className="h-10 py-2 px-4 border-b border-white/5 bg-[#111] text-xs text-[var(--text-muted)] font-mono flex items-center justify-between shrink-0 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setIsTerminalMinimized(!isTerminalMinimized)}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                Terminal Output
              </div>
              <button className="text-[var(--text-muted)] hover:text-white transition-colors bg-transparent border-none">
                  {isTerminalMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {!isTerminalMinimized && (
              <div className="p-4 font-mono text-xs flex flex-col gap-4 overflow-y-auto flex-1">
                {!state.results ? (
                  <div className="text-[#555]">&gt; Ready. Awaiting code execution...</div>
                ) : (
                  state.results.map((r: any, i: number) => (
                    <div key={i} className={`flex flex-col gap-1.5 bg-white/5 p-3 rounded-lg border ${r.passed ? 'border-[#10b981]/30' : 'border-[#ef4444]/30'} shrink-0`}>
                      <div className={`font-bold ${r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        Test {i + 1}: {r.passed ? "✅ Passed" : "❌ Failed"}
                      </div>
                      <div className="flex gap-4">
                        <div className="text-[var(--text-muted)] text-[10px]">Input: <code className="text-[var(--text-secondary)]">{r.input}</code></div>
                        <div className="text-[var(--text-muted)] text-[10px]">Expected: <code className="text-[var(--text-secondary)]">{r.expected}</code></div>
                      </div>
                      <div className="text-[var(--text-muted)] text-[10px]">
                        Output: <code className={r.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}>{r.output || "no output"}</code>
                      </div>
                      {r.stderr && (
                        <div className="text-[#ef4444] text-[10px] mt-1 p-2 bg-[#ef4444]/10 rounded whitespace-pre-wrap">
                          {r.stderr}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
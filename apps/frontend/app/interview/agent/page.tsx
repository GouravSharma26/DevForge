"use client"

import { useEffect, useState, useRef, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Bot, Send, User, ChevronLeft, Loader2, StopCircle, Sparkles } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { toast } from "sonner"

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  isStreaming?: boolean;
}

function AIInterviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get("resumeId")
  const { token, hydrated } = useAuthStore()

  const durationParam = searchParams.get("duration") || "5"
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(true) // Start true while waiting for AI to speak first
  const [timeLeft, setTimeLeft] = useState(parseInt(durationParam) * 60)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleEnd = useCallback((force = false) => {
    if (force || confirm("Are you sure you want to end the interview?")) {
      setIsEvaluating(true)
      socket?.emit("interview:end")
    }
  }, [socket])

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isEvaluating && finalScore === null) {
        const timer = setTimeout(() => handleEnd(true), 0)
        return () => clearTimeout(timer)
      }
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isEvaluating, finalScore, handleEnd])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (hydrated && !token) {
      router.push("/login")
      return
    }

    if (!resumeId) {
      toast.error("No resume selected")
      router.push("/interview")
      return
    }

    const apiUrl = "/api"
    const wsUrl = ""
    
    const newSocket = io(wsUrl, {
      withCredentials: true,
      transports: ["websocket"]
    })

    setTimeout(() => {
      setSocket(newSocket)
    }, 0)

    newSocket.on("connect", () => {
      newSocket.emit("interview:join", { resumeId, duration: parseInt(durationParam) })
    })

    newSocket.on("interview:reply", ({ message }: { message: string }) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: message }])
      setIsTyping(false)
    })

    newSocket.on("interview:evaluating", () => {
      setIsEvaluating(true)
    })

    newSocket.on("interview:ended", ({ score }: { score: number }) => {
      setIsEvaluating(false)
      setFinalScore(score)
    })

    newSocket.on("interview:stream", ({ chunk }: { chunk: string }) => {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last && last.role === "agent" && last.isStreaming) {
          const updated = [...prev]
          updated[updated.length - 1] = { ...last, content: last.content + chunk }
          return updated
        } else {
          return [...prev, { id: Date.now().toString(), role: "agent", content: chunk, isStreaming: true }]
        }
      })
    })

    newSocket.on("interview:stream_end", ({ fullMessage }: { fullMessage: string }) => {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last && last.role === "agent") {
          const updated = [...prev]
          updated[updated.length - 1] = { ...last, content: fullMessage, isStreaming: false }
          return updated
        }
        return prev
      })
      setIsTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    })

    newSocket.on("interview:error", ({ message }: { message: string }) => {
      toast.error(message)
      setIsTyping(false)
      setIsEvaluating(false)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [resumeId, hydrated, token, router])

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isTyping || !socket) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userMsg }])
    setInput("")
    setIsTyping(true)
    socket.emit("interview:message", { message: userMsg })
  }

  if (!hydrated || !token) return <div className="min-h-screen bg-[#0A0A0A]" />

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#0A0A0A] font-mono relative overflow-hidden">
      {/* Background Ambient FX */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0 shadow-lg">
        <div className="flex items-center gap-5">
          <button onClick={() => router.push("/interview")} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40 rounded-full animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 text-emerald-400 flex items-center justify-center border border-emerald-500/30 relative z-10 shadow-inner">
                <Bot size={20} />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                DevForge Recruiter
                <Sparkles size={14} className="text-emerald-400" />
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400/80 uppercase tracking-wider font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Secure Uplink • {formatTime(timeLeft)} remaining
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => handleEnd(false)} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-all border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl backdrop-blur-md">
          <StopCircle size={14} />
          End Session
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center border border-white/10 relative z-10">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-emerald-400/80 text-sm tracking-widest uppercase font-semibold animate-pulse">Initializing Agent</p>
              <p className="text-xs text-white/30">Analyzing resume parameters and computing interview vectors...</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              
              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {msg.role === "agent" ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Bot size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <User size={16} />
                  </div>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-5 rounded-2xl text-[13px] md:text-sm leading-relaxed backdrop-blur-md shadow-xl ${
                msg.role === "user" 
                  ? "bg-blue-600/10 border border-blue-500/20 text-blue-50 rounded-tr-sm" 
                  : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
              }`}>
                {msg.content.split('\\n').map((line, i) => (
                  <p key={i} className={i !== 0 ? "mt-3" : ""}>{line}</p>
                ))}
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1.5 align-middle shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && messages.length > 0 && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-4 max-w-[80%] flex-row">
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Bot size={16} />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 z-20 shrink-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pt-10">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-2xl blur opacity-30 group-focus-within:opacity-60 transition duration-500"></div>
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isTyping ? "AI is processing..." : "Formulate your response..."}
              className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50 shadow-2xl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center disabled:opacity-0 disabled:scale-95 hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-emerald-500/30"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Evaluating Overlay */}
      {isEvaluating && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <Loader2 size={48} className="animate-spin text-emerald-500 mb-6" />
          <h2 className="text-xl font-bold tracking-widest uppercase text-emerald-400 mb-2">Generating Report</h2>
          <p className="text-sm text-white/50">Analyzing your responses and computing final score...</p>
        </div>
      )}

      {/* Score Overlay */}
      {finalScore !== null && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl font-black mb-8 shadow-[0_0_60px_rgba(16,185,129,0.2)] bg-[#0A0A0A] ${finalScore >= 80 ? 'border-[#10b981] text-[#10b981] shadow-[0_0_60px_rgba(16,185,129,0.2)]' : finalScore >= 60 ? 'border-[#eab308] text-[#eab308] shadow-[0_0_60px_rgba(234,179,8,0.2)]' : 'border-[#ef4444] text-[#ef4444] shadow-[0_0_60px_rgba(239,68,68,0.2)]'}`}>
            {finalScore}
          </div>
          <h2 className="text-2xl font-bold tracking-widest uppercase text-white mb-8">Session Complete</h2>
          <button 
            onClick={() => router.push("/interview")}
            className="px-8 py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white rounded-xl transition-all font-bold tracking-wide"
          >
            Return to Hub
          </button>
        </div>
      )}
    </div>
  )
}

export default function AIInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <AIInterviewContent />
    </Suspense>
  )
}

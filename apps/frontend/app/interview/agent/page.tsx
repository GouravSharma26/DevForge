"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Bot, Send, User, ChevronLeft, Loader2, StopCircle } from "lucide-react"
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

  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(true) // Start true while waiting for AI to speak first
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000"
    const newSocket = io(wsUrl, {
      withCredentials: true,
      transports: ["websocket"]
    })

    setSocket(newSocket)

    newSocket.on("connect", () => {
      newSocket.emit("interview:join", { resumeId })
    })

    newSocket.on("interview:reply", ({ message }: { message: string }) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "agent", content: message }])
      setIsTyping(false)
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

  const handleEnd = () => {
    if (confirm("Are you sure you want to end the interview?")) {
      router.push("/interview")
    }
  }

  if (!hydrated || !token) return <div className="min-h-screen bg-base" />

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-base font-mono relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 500px at 50% -20%, rgba(16, 185, 129, 0.15), transparent 70%)' }} />

      {/* Header */}
      <div className="h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/interview")} className="text-muted hover:text-primary transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary">DevForge AI Recruiter</h1>
              <div className="flex items-center gap-2 text-xs text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleEnd} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-lg">
          <StopCircle size={14} />
          End Interview
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 z-10 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted space-y-4 animate-pulse">
            <Bot size={48} className="text-emerald-500/50" />
            <p>The AI Recruiter is reviewing your resume...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {msg.role === "agent" ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                    <Bot size={18} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
                    <User size={18} />
                  </div>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-accent text-white rounded-tr-sm" 
                  : "bg-surface border border-border text-primary rounded-tl-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              }`}>
                {msg.content.split('\\n').map((line, i) => (
                  <p key={i} className={i !== 0 ? "mt-2" : ""}>{line}</p>
                ))}
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 align-middle"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 z-10 shrink-0">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "AI is typing..." : "Type your answer..."}
            className="w-full bg-surface border border-border rounded-xl py-4 pl-5 pr-14 text-sm text-primary placeholder-muted outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50 shadow-lg"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AIInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <AIInterviewContent />
    </Suspense>
  )
}

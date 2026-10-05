"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"
import { Shield, Mail, Lock, User as UserIcon, ArrowLeft, Loader2, Target, Swords, FileText, Bot } from "lucide-react"

const FRIENDLY_ERRORS: Record<string, string> = {
  "User already exists": "An account with this email or username already exists.",
  "Invalid credentials": "Incorrect email or password.",
}

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [form, setForm] = useState({ username: "", email: "", password: "" })

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError("")

    // Client-side validation
    if (isRegister && form.username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login"
      const payload = isRegister ? form : { email: form.email, password: form.password }
      const res = await api.post(endpoint, payload)
      setAuth(res.data.data.user)
      router.push("/dashboard")
    } catch (err: any) {
      const raw = err?.response?.data?.error
      let extractedMessage = "Something went wrong. Try again."

      if (typeof raw === "string") {
        extractedMessage = raw
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
            extractedMessage = parsed[0].message
          }
        } catch {}
      } else if (typeof raw === "object" && raw?.message) {
        extractedMessage = raw.message;
      }

      setError(FRIENDLY_ERRORS[extractedMessage] || extractedMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-accent/30 text-primary">
      
      {/* Background Ambient FX */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_80%)]" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-accent blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-2xl" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center border border-white/10 relative z-10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
              <Shield size={28} className="text-white relative z-10 drop-shadow-md" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-md">
              Dev<span className="text-accent">Forge</span>
            </h1>
            <p className="text-sm text-muted font-medium mt-1 uppercase tracking-widest">
              {isRegister ? "Initialize Your Account" : "Access Command Center"}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-surface-theme/40 backdrop-blur-2xl border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted font-mono ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    onFocus={() => setFocused("username")}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-card/50 border border-border focus:border-accent/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-4 focus:ring-accent/10 focus:bg-card shadow-inner"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-muted font-mono ml-1">Email Sequence</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-card/50 border border-border focus:border-accent/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-4 focus:ring-accent/10 focus:bg-card shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-muted font-mono ml-1">Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-card/50 border border-border focus:border-accent/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-4 focus:ring-accent/10 focus:bg-card shadow-inner"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 animate-in slide-in-from-top-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-xl border border-accent/50 bg-gradient-to-r from-accent to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : isRegister ? (
                "Initialize Account"
              ) : (
                "Establish Uplink"
              )}
            </button>

            <div className="flex items-center gap-4 my-2 opacity-50">
              <div className="h-px bg-border flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">OR</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError("") }}
              className="w-full py-3 rounded-xl border border-border bg-card/30 hover:bg-card/80 hover:border-accent/30 text-muted hover:text-white text-sm font-medium transition-all duration-200"
            >
              {isRegister ? "Already have access? Sign In" : "Need clearance? Create Account"}
            </button>
          </form>
        </div>

        {/* Feature Hints */}
        <div className="flex justify-center gap-6 flex-wrap opacity-70">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
            <Target size={14} className="text-accent" /> DSA Practice
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
            <Swords size={14} className="text-accent" /> PvP Arena
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
            <Bot size={14} className="text-accent" /> AI Scans
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button 
            onClick={() => router.push('/landing')}
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-accent transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Abort & Return to Landing
          </button>
        </div>

      </div>
    </main>
  )
}
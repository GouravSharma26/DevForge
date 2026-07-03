"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"

const mono = "JetBrains Mono, monospace"

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [form, setForm] = useState({ username: "", email: "", password: "" })

async function handleSubmit() {
  setError("")

  // Client-side validation first
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
    const payload = isRegister
      ? form
      : { email: form.email, password: form.password }
    const res = await api.post(endpoint, payload)
    setAuth(res.data.data.user, res.data.data.token)
    // Redirect to the news dashboard after login/register
    router.push("/news")
  } catch (err: any) {
    const raw = err?.response?.data?.error

    // If it's a Zod array, extract the first message
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed[0]?.message) {
          setError(parsed[0].message)
          return
        }
      } catch {}
    }

    // Common backend errors → friendly messages
    const friendly: Record<string, string> = {
      "User already exists": "An account with this email or username already exists",
      "Invalid credentials": "Incorrect email or password",
    }

    setError(friendly[raw] || raw || "Something went wrong. Try again.")
  } finally {
    setLoading(false)
  }
}

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: `1px solid ${focused === name ? "#7c3aed80" : "#1f1f45"}`,
    background: "#0d0d1a",
    color: "#f1f0ff",
    fontSize: 13,
    fontFamily: mono,
    outline: "none",
    boxShadow: focused === name ? "0 0 0 3px #7c3aed18" : "none",
    transition: "all 0.2s",
  })

  return (
    <main style={{
      minHeight: "calc(100vh - 56px)",
      background: "#0d0d1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500,
          background: "radial-gradient(circle, #7c3aed14, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "10%",
          width: 300, height: 300,
          background: "radial-gradient(circle, #6366f110, transparent 70%)",
          borderRadius: "50%",
        }} />
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 420, position: "relative",
        display: "flex", flexDirection: "column", gap: 24,
      }}>

        {/* Logo + header */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 24px #7c3aed40",
          }}>
            ⚔
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>
              Dev<span style={{ color: "#a855f7" }}>Forge</span>
            </h1>
            <p style={{ fontSize: 12, color: "#5a5780", fontFamily: mono, marginTop: 4 }}>
              {isRegister ? "Create your account" : "Welcome back"}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "#16163a",
          border: "1px solid #1f1f45",
          borderRadius: 20,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px #7c3aed10",
        }}>

          {isRegister && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, color: "#5a5780", fontFamily: mono }}>Username</label>
              <input
                type="text"
                placeholder="gourav"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
                style={inputStyle("username")}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#5a5780", fontFamily: mono }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={inputStyle("email")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#5a5780", fontFamily: mono }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle("password")}
            />
          </div>

          {error && (
            <div style={{
              background: "#ef444410",
              border: "1px solid #ef444430",
              borderRadius: 10,
              padding: "10px 14px",
            }}>
              <p style={{ fontSize: 12, color: "#ef4444", fontFamily: mono, margin: 0 }}>✗ {error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "#2a2a5a"
                : "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: loading ? "#5a5780" : "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: mono,
              boxShadow: loading ? "none" : "0 4px 20px #7c3aed40",
              transition: "all 0.2s",
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px #7c3aed60"
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px #7c3aed40"
            }}
          >
            {loading
              ? "Please wait..."
              : isRegister ? "Create Account" : "Sign In"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#1f1f45" }} />
            <span style={{ fontSize: 11, color: "#3a3760", fontFamily: mono }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1f1f45" }} />
          </div>

          {/* Toggle register/login */}
          <button
            onClick={() => { setIsRegister(!isRegister); setError("") }}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 12,
              border: "1px solid #2a2a5a",
              cursor: "pointer",
              background: "#1c1c45",
              color: "#a09dc0",
              fontSize: 13,
              fontFamily: mono,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed40"
              ;(e.currentTarget as HTMLButtonElement).style.color = "#f1f0ff"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a5a"
              ;(e.currentTarget as HTMLButtonElement).style.color = "#a09dc0"
            }}
          >
            {isRegister ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>

        {/* Features hint */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
        }}>
          {["DSA Practice", "PvP Arena", "AI Resume Scan"].map((f) => (
            <span key={f} style={{
              fontSize: 11, color: "#3a3760", fontFamily: mono,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ color: "#7c3aed" }}>✓</span> {f}
            </span>
          ))}
        </div>

        {/* Landing link */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#3a3760", fontFamily: mono }}>
          <a href="/" style={{ color: "#5a5780", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5780")}
          >
            ← Back to home
          </a>
        </p>

      </div>
    </main>
  )
}
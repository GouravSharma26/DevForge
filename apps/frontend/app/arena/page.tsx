"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useArena } from "@/hooks/useArena"
import { useAuthStore } from "@/store/auth.store"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const S: Record<string, React.CSSProperties> = {
  page: { background: "#171210", minHeight: "100%", display: "flex", flexDirection: "column" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 32, padding: "40px 24px" },
  card: { background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" },
  h1: { fontSize: 28, fontWeight: 800, color: "#fdf6f0", fontFamily: "JetBrains Mono, monospace", textAlign: "center" },
  sub: { fontSize: 13, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace", textAlign: "center" },
  btn: {
    width: "100%", padding: "14px 0", borderRadius: 14, fontSize: 14,
    fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "JetBrains Mono, monospace",
    background: "linear-gradient(135deg, #ea580c, #d97706)",
    color: "#fdf6f0", boxShadow: "0 4px 20px rgba(234,88,12,0.3)", transition: "all 0.2s",
  },
  ruleItem: { fontSize: 13, color: "#d4a373", fontFamily: "JetBrains Mono, monospace", display: "flex", gap: 8, alignItems: "center" },
}

export default function ArenaPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)
  const { state, joinQueue, sendCodeChange, submitCode, leaveMatch, reset } = useArena()
  const [code, setCode] = useState("")

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  useEffect(() => {
    if (state.problem) {
      setCode((state.problem.starterCode as any)?.javascript || "")
    }
  }, [state.problem])

  function handleCodeChange(val: string) {
    setCode(val)
    if (state.matchId) sendCodeChange(state.matchId, val)
  }

  if (!hydrated || !token) return null

  // IDLE
  if (state.status === "idle") return (
    <main style={S.page}>
      <div style={S.center}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
          <h1 style={S.h1}>PvP Arena</h1>
          <p style={{ ...S.sub, marginTop: 8 }}>Challenge another developer to a real-time coding battle</p>
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <div style={S.ruleItem}>🎯 You'll both get the same random problem</div>
            <div style={S.ruleItem}>⏱️ First to pass all test cases wins</div>
            <div style={S.ruleItem}>🏆 Winner earns 100 XP</div>
          </div>
          <button style={S.btn} onClick={joinQueue}>Find Match</button>
        </div>
        <button
          onClick={() => router.push("/problems")}
          style={{ fontSize: 12, color: "#8a7a6a", background: "none", border: "none", cursor: "pointer", fontFamily: "JetBrains Mono, monospace" }}
        >
          ← Back to Practice
        </button>
      </div>
    </main>
  )

  // SEARCHING / WAITING
  if (state.status === "searching" || state.status === "waiting") return (
    <main style={S.page}>
      <div style={S.center}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ fontSize: 48, animation: "pulse 2s infinite" }}>⚔️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fdf6f0", fontFamily: "JetBrains Mono, monospace" }}>
            {state.status === "searching" ? "Finding opponent..." : "Waiting for opponent..."}
          </h2>
          <p style={{ fontSize: 11, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>Match ID: {state.matchId}</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#ea580c",
                animation: `bounce 1s ease infinite ${i * 0.15}s`,
              }} />
            ))}
          </div>
          <button
            onClick={reset}
            style={{ fontSize: 12, color: "#8a7a6a", background: "none", border: "none", cursor: "pointer", fontFamily: "JetBrains Mono, monospace", marginTop: 8 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  )

  // WON / LOST
  if (state.status === "won" || state.status === "lost") {
    const won = state.status === "won"
    return (
      <main style={S.page}>
        <div style={S.center}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{won ? "🏆" : "💀"}</div>
            <h1 style={{ ...S.h1, color: won ? "#f59e0b" : "#ef4444" }}>{won ? "You Won!" : "You Lost"}</h1>
            <p style={{ ...S.sub, marginTop: 8 }}>
              {won ? "+100 XP earned" : `${state.winnerUsername} solved it first`}
            </p>
          </div>
          {state.results && (
            <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 8 }}>
              {state.results.map((r: any, i: number) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 10, fontSize: 12,
                  fontFamily: "JetBrains Mono, monospace",
                  background: r.passed ? "#10b98110" : "#ef444410",
                  border: `1px solid ${r.passed ? "#10b98130" : "#ef444430"}`,
                  color: r.passed ? "#10b981" : "#ef4444",
                }}>
                  Test {i + 1}: {r.passed ? "✅ Passed" : "❌ Failed"}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={reset} style={{ ...S.btn, width: "auto", padding: "12px 28px" }}>Play Again</button>
            <button
              onClick={() => router.push("/problems")}
              style={{ padding: "12px 28px", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "JetBrains Mono, monospace", background: "rgba(255,237,213,0.05)", border: "1px solid rgba(255,180,120,0.14)", color: "#8a7a6a" }}
            >
              Practice
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ACTIVE BATTLE
  return (
    <main style={{ background: "#171210", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Battle bar */}
      <div style={{
        borderBottom: "1px solid rgba(255,180,120,0.14)", background: "rgba(255,237,213,0.02)",
        padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fdf6f0", fontFamily: "JetBrains Mono, monospace" }}>⚔️ LIVE BATTLE</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
          <span style={{ fontSize: 11, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>{state.problem?.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c" }} />
            <span style={{ fontSize: 12, color: state.player1?.id === user?.id ? "#fdf6f0" : "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>
              {state.player1?.username}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>VS</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ fontSize: 12, color: state.player2?.id === user?.id ? "#fdf6f0" : "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>
              {state.player2?.username}
            </span>
            {state.opponentSubmitted && (
              <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "JetBrains Mono, monospace", animation: "pulse 1s infinite" }}>submitted!</span>
            )}
          </div>
        </div>
        <button
          onClick={() => state.matchId && submitCode(state.matchId, state.problem.id, code, "javascript")}
          style={{
            padding: "8px 20px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
            background: "rgba(217,119,6,0.18)", border: "1px solid rgba(253,186,116,0.45)", color: "#fed7aa", fontWeight: 700,
            boxShadow: "0 4px 20px rgba(234,88,12,0.1)",
          }}
        >
          ▶ Submit
        </button>
      </div>

      {state.opponentLeft && (
        <div style={{ background: "#f59e0b10", borderBottom: "1px solid #f59e0b30", padding: "8px 24px", fontSize: 12, color: "#f59e0b", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }}>
          Opponent disconnected — you win by default!
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Problem panel */}
        <div style={{ width: "35%", borderRight: "1px solid rgba(255,180,120,0.14)", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fdf6f0", fontFamily: "JetBrains Mono, monospace" }}>{state.problem?.title}</h2>
            <p style={{ fontSize: 11, color: "#8a7a6a", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>{state.problem?.category}</p>
          </div>
          <p style={{ fontSize: 12, color: "#d4a373", lineHeight: 1.8, fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap" }}>
            {state.problem?.description}
          </p>
          {state.problem?.examples && (state.problem.examples as any[]).map((ex: any, i: number) => (
            <div key={i} style={{ background: "rgba(255,237,213,0.05)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 10, padding: 12, fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
              <p style={{ color: "#8a7a6a" }}>Input: <code style={{ color: "#fdf6f0", background: "#1c1712", padding: "2px 6px", borderRadius: 4 }}>{ex.input}</code></p>
              <p style={{ color: "#8a7a6a", marginTop: 4 }}>Output: <code style={{ color: "#d4a373", background: "#1c1712", padding: "2px 6px", borderRadius: 4 }}>{ex.output}</code></p>
            </div>
          ))}
          {state.results && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 10, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: 1 }}>Your Results</p>
              {state.results.map((r: any, i: number) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 11,
                  background: r.passed ? "#10b98108" : "#ef444408",
                  border: `1px solid ${r.passed ? "#10b98130" : "#ef444430"}`,
                  color: r.passed ? "#10b981" : "#ef4444",
                  fontFamily: "JetBrains Mono, monospace",
                }}>
                  Test {i + 1}: {r.passed ? "✅" : "❌"} — Got: {r.output || "no output"}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "#171210", fontSize: 11, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a5780" }} />
            Your Code
          </div>
          <MonacoEditor
            height="calc(100% - 37px)"
            language="javascript"
            value={code}
            onChange={(val) => handleCodeChange(val || "")}
            theme="vs-dark"
            options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 } }}
          />
        </div>
      </div>
    </main>
  )
}
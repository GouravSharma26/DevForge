"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useInterview, useSubmitAnswer, useCompleteInterview, useStartGrandmaster, useRunGrandmasterCode } from "@/hooks/useResume"
import { useAuthStore } from "@/store/auth.store"
import Editor from "@monaco-editor/react"

const mono = "JetBrains Mono, monospace"

const ROUND_META: Record<number, { label: string; icon: string; color: string; desc: string }> = {
  1: { label: "Technical",  icon: "🔧", color: "#f59e0b", desc: "Questions based on your listed skills" },
  2: { label: "Projects",   icon: "🏗️", color: "#ea580c", desc: "Deep dive into your project experience" },
  3: { label: "Gap Analysis",icon: "🎯", color: "#d97706", desc: "Skills missing for your target role" },
  4: { label: "Grandmaster",icon: "🔥", color: "#ef4444", desc: "Advanced debug challenge in a sandbox" },
  5: { label: "Grandmaster",icon: "🔥", color: "#ef4444", desc: "Advanced debug challenge in a sandbox" },
}

export default function InterviewPage() {
  const router   = useRouter()
  const params   = useParams()
  const id       = params.id as string
  const token    = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: interview, isLoading } = useInterview(id)
  const submitAnswer     = useSubmitAnswer(id)
  const completeInterview = useCompleteInterview(id)
  const startGrandmaster  = useStartGrandmaster(id)

  const runGrandmasterCode = useRunGrandmasterCode(id)

  const [currentIdx, setCurrentIdx]         = useState(0)
  const [answer, setAnswer]                 = useState("")
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [submittedId, setSubmittedId]       = useState<string | null>(null)
  const [runOutput, setRunOutput]           = useState<{stdout: string, stderr: string} | null>(null)
  const [isRunningCode, setIsRunningCode]   = useState(false)
  const [submitCountdown, setSubmitCountdown] = useState<number | null>(null)
  const [showModal, setShowModal]           = useState(false)

  useEffect(() => {
    if (submitCountdown === null || submitCountdown === 0) return
    const t = setTimeout(() => setSubmitCountdown(prev => prev! - 1), 1000)
    return () => clearTimeout(t)
  }, [submitCountdown])

  useEffect(() => {
    const q = interview?.questions?.[currentIdx] as any
    if (q && q.isGrandmaster) {
      setAnswer(q.buggyCode || "")
    } else if (q) {
      setAnswer("")
    }
  }, [currentIdx])

  // Auto-advance to the correct question after refresh
  useEffect(() => {
    if (interview && interview.status === "IN_PROGRESS" && interview.questions) {
      const firstUnanswered = interview.questions.findIndex((q: any) => !q.userAnswer)
      if (firstUnanswered !== -1) {
        if (currentIdx !== firstUnanswered) setCurrentIdx(firstUnanswered)
      } else if (interview.questions.length > 0) {
        // All questions are answered, go to the last question
        const lastIdx = interview.questions.length - 1
        if (currentIdx !== lastIdx) setCurrentIdx(lastIdx)
        setSubmittedId(interview.questions[lastIdx].id)
      }
    }
  }, [interview?.status, interview?.questions?.length])

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token) return null

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🎙️</div>
        <p style={{ color: "rgb(var(--text-muted))", fontFamily: mono, fontSize: 13 }}>Loading your interview...</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#ea580c",
              animation: `bounce 1s ease infinite`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!interview) return null

  const questions    = interview.questions || []
  const currentQ     = questions[currentIdx] as any
  const isLastQ      = currentIdx === questions.length - 1
  const isCompleted  = interview.status === "COMPLETED"
  const answeredCount = questions.filter((q: any) => q.userAnswer).length
  const currentRound = ROUND_META[currentQ?.round] || ROUND_META[1]
  const latestQ      = questions[currentIdx]
  const hasFeedback  = latestQ?.feedback || submittedId === currentQ?.id

  // ── COMPLETED ────────────────────────────────────────────────────────────────
  if (isCompleted) {
    const score = interview.score || 0
    const scoreColor = score >= 70 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444"
    const scoreGrad  = score >= 70
      ? "linear-gradient(135deg, #10b981, #059669)"
      : score >= 50
      ? "linear-gradient(135deg, #eab308, #ca8a04)"
      : "linear-gradient(135deg, #ef4444, #dc2626)"

    const roundScores = [1, 2, 3].map(r => {
      const qs = questions.filter((q: any) => q.round === r && q.score !== null)
      const avg = qs.length > 0 ? Math.round(qs.reduce((s: number, q: any) => s + q.score, 0) / qs.length) : null
      return { round: r, avg, meta: ROUND_META[r] }
    })

    const grandmasterQ = questions.find((q: any) => q.isGrandmaster)
    const gmScore = grandmasterQ?.score

    return (
      <main style={{ minHeight: "calc(100vh - 56px)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Result hero */}
          <div style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 24, padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(234,88,12,0.12)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
              width: 400, height: 400,
              background: "radial-gradient(circle, rgba(234,88,12,0.15), transparent 70%)",
              borderRadius: "50%", pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎙️</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgb(var(--text-primary))", fontFamily: mono, marginBottom: 8 }}>
                Interview Complete
              </h1>
              <p style={{ fontSize: 13, color: "rgb(var(--text-muted))", fontFamily: mono, marginBottom: 32 }}>
                {score >= 70 ? "Great performance! You're interview-ready." : score >= 50 ? "Good start. Review the feedback below." : "Keep practising. Check each answer for tips."}
              </p>

              {/* Score display */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 32 }}>
                {/* Main Score circle */}
                <div style={{
                  width: 120, height: 120, borderRadius: "50%",
                  background: scoreGrad,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 40px ${scoreColor}40`,
                }}>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: mono, lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: mono }}>/100</div>
                  </div>
                </div>

                {/* Grandmaster Badge (if completed) */}
                {gmScore != null && (
                  <div style={{
                    background: "rgb(var(--bg-surface))", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "16px 20px",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 20px rgba(234,88,12,0.1)"
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
                    <div style={{ fontSize: 11, color: "#ea580c", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Grandmaster</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "rgb(var(--text-primary))", fontFamily: mono, lineHeight: 1 }}>{gmScore}<span style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>/100</span></div>
                  </div>
                )}
              </div>

              {/* Round breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
                {roundScores.map(({ round, avg, meta }) => (
                  <div key={round} style={{
                    background: "var(--glass-bg)", borderRadius: 14, padding: "16px 12px",
                    border: `1px solid var(--border-subtle)`,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{meta.icon}</div>
                    <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono, marginBottom: 4 }}>{meta.label}</div>
                    <div style={{
                      fontSize: 20, fontWeight: 800, fontFamily: mono,
                      color: avg === null ? "rgb(var(--text-muted))" : avg >= 70 ? "#10b981" : avg >= 50 ? "#eab308" : "#ef4444",
                    }}>
                      {avg === null ? "—" : `${avg}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grandmaster Optional Card */}
              {!grandmasterQ && (
                <div style={{
                  background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 24,
                  marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12
                }}>
                  <div style={{ fontSize: 28 }}>🔥</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono }}>Grandmaster Challenge (Optional)</h3>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgb(var(--text-secondary))", fontFamily: mono }}>Test your limits with a real-time advanced debugging challenge in a secure sandbox.</p>
                  </div>
                  
                  {startGrandmaster.isError && (
                    <div style={{ background: "#ef444420", color: "#ef4444", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontFamily: mono, marginTop: 8 }}>
                      Failed to generate challenge (API rate limit). Please wait a moment and try again.
                    </div>
                  )}

                  <button
                    onClick={() => startGrandmaster.mutate()}
                    disabled={startGrandmaster.isPending}
                    style={{
                      marginTop: 8, padding: "10px 24px", borderRadius: 8,
                      border: "1px solid rgba(253,186,116,0.45)", background: "rgba(217,119,6,0.18)",
                      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fed7aa",
                      fontFamily: mono, fontWeight: 700, fontSize: 13,
                      cursor: startGrandmaster.isPending ? "not-allowed" : "pointer",
                      opacity: startGrandmaster.isPending ? 0.7 : 1,
                    }}
                  >
                    {startGrandmaster.isPending ? "Generating..." : startGrandmaster.isError ? "Retry Generation" : "Start Challenge"}
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => router.push(interview.resumeId ? `/resume/${interview.resumeId}` : "/resume")}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid rgba(253,186,116,0.45)",
                    cursor: "pointer", fontFamily: mono, fontWeight: 700, fontSize: 13,
                    background: "rgba(217,119,6,0.18)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    color: "#fed7aa",
                  }}
                >
                  ← Back to Resume
                </button>
                <button
                  onClick={() => router.push("/problems")}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid var(--border-subtle)",
                    cursor: "pointer", fontFamily: mono, fontSize: 13,
                    background: "var(--glass-bg)", color: "rgb(var(--text-secondary))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)"
                  }}
                >
                  Practice DSA
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid #10b98150",
                    cursor: "pointer", fontFamily: mono, fontSize: 13,
                    background: "#10b98115", color: "#10b981",
                  }}
                >
                  📄 Export Report
                </button>
              </div>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body, main { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; min-height: auto !important; }
              .no-print { display: none !important; }
              * { box-shadow: none !important; text-shadow: none !important; }
              h1, h2, h3, p, span, div { color: black !important; }
              div { border-color: #ddd !important; }
            }
          `}} />

          {/* Question review */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, margin: 0 }}>
              Answer Review
            </h2>
            {questions.map((q: any, i: number) => {
              const meta = ROUND_META[q.round] || ROUND_META[1]
              const sc   = q.score
              const scColor = sc == null ? "rgb(var(--text-muted))" : sc >= 70 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444"
              return (
                <div key={q.id} style={{
                  background: "rgba(var(--glass-bg-rgb),0.02)", border: "1px solid var(--border-subtle)",
                  borderRadius: 16, overflow: "hidden",
                }}>
                  {/* Q header */}
                  <div style={{
                    padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                    background: "var(--glass-bg)",
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 6,
                        background: meta.color + "15", color: meta.color,
                        border: `1px solid ${meta.color}30`,
                        fontFamily: mono, flexShrink: 0, marginTop: 1,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                      <p style={{ fontSize: 13, color: "rgb(var(--text-primary))", fontFamily: mono, margin: 0, lineHeight: 1.6 }}>
                        {q.question}
                      </p>
                    </div>
                    {sc != null && (
                      <div style={{
                        flexShrink: 0, width: 44, height: 44, borderRadius: 10,
                        background: scColor + "15", border: `1px solid ${scColor}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column",
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: scColor, fontFamily: mono, lineHeight: 1 }}>{sc}</span>
                        <span style={{ fontSize: 9, color: scColor + "80", fontFamily: mono }}>/ 100</span>
                      </div>
                    )}
                  </div>

                  {/* Q body */}
                  {q.userAnswer && (
                    <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your answer</p>
                        <p style={{ fontSize: 12, color: "rgb(var(--text-secondary))", fontFamily: mono, lineHeight: 1.7, margin: 0, background: "rgb(var(--bg-base))", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(var(--border-subtle-rgb),0.08)" }}>
                          {q.userAnswer}
                        </p>
                      </div>
                      {q.feedback && (
                        <div style={{
                          background: scColor + "08", border: `1px solid ${scColor}20`,
                          borderRadius: 10, padding: "10px 14px",
                        }}>
                          <p style={{ fontSize: 10, color: scColor, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>AI Feedback</p>
                          <p style={{ fontSize: 12, color: "rgb(var(--text-secondary))", fontFamily: mono, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                            {q.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  // ── ACTIVE INTERVIEW ─────────────────────────────────────────────────────────
  async function handleRunCode() {
    if (!answer.trim() || !currentQ) return
    if ((currentQ.runAttempts || 0) >= 4) {
      await handleSubmitAnswer(true) // force auto-submit on 5th click
      return
    }
    setIsSubmitting(true)
    setIsRunningCode(true)
    try {
      const res = await runGrandmasterCode.mutateAsync({ questionId: currentQ.id, code: answer })
      setRunOutput({ stdout: res.stdout, stderr: res.stderr })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
      setIsRunningCode(false)
    }
  }

  async function handleSubmitAnswer(force = false) {
    if (!answer.trim() || !currentQ) return
    
    // Grandmaster explicit confirmation logic
    if (currentQ.isGrandmaster && !force && !showModal) {
      setShowModal(true)
      setSubmitCountdown(5)
      return
    }

    setIsSubmitting(true)
    setShowModal(false)
    setSubmitCountdown(null)
    
    try {
      await submitAnswer.mutateAsync({ questionId: currentQ.id, answer })
      
      if (currentQ.isGrandmaster) {
        setSubmittedId(currentQ.id)
      } else {
        if (isLastQ) {
          await completeInterview.mutateAsync().catch(err => {
            console.error(err)
            alert("Failed to complete interview. Please try again.")
          })
        } else {
          setCurrentIdx(i => i + 1)
          setSubmittedId(null)
          setAnswer("")
        }
      }
    } catch (err: any) {
      console.error(err)
      alert("Failed to submit answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleNext() {
    try {
      if (isLastQ) {
        await completeInterview.mutateAsync()
      } else {
        setCurrentIdx(i => i + 1)
        setSubmittedId(null)
        setAnswer("")
      }
    } catch (err: any) {
      console.error(err)
      alert("Failed to proceed. Please try again.")
    }
  }

  return (
    <main style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <div style={{
        borderBottom: "1px solid var(--border-subtle)", background: "rgba(23,18,16,0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        padding: "0 24px", height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(interview.resumeId ? `/resume/${interview.resumeId}` : "/resume")}
            style={{
              background: "var(--glass-bg)", border: "1px solid var(--border-subtle)", borderRadius: 8,
              padding: "5px 12px", cursor: "pointer", color: "rgb(var(--text-secondary))",
              fontSize: 11, fontFamily: mono, transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(234,88,12,0.4)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-primary))"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-secondary))"
            }}
          >
            ← Resume
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border-subtle)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono }}>
            Mock Interview
          </span>
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 99,
            background: "#ea580c15", color: "#f59e0b", border: "1px solid #ea580c30",
            fontFamily: mono,
          }}>
            🎙️ Live
          </span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono, marginRight: 4 }}>
            {answeredCount}/{questions.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {questions.map((_: any, i: number) => {
              const q = questions[i]
              const done = q?.userAnswer
              const current = i === currentIdx
              return (
                <div
                  key={i}
                  onClick={() => { if (done || i <= currentIdx) { setCurrentIdx(i); setSubmittedId(null); setAnswer("") } }}
                  style={{
                    width: current ? 20 : 8, height: 8, borderRadius: 99,
                    background: current ? "#ea580c" : done ? "#10b981" : "var(--border-subtle)",
                    cursor: done || i <= currentIdx ? "pointer" : "default",
                    transition: "all 0.3s",
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT — Round sidebar ── */}
        <div style={{
          width: 220, flexShrink: 0,
          borderRight: "1px solid var(--border-subtle)",
          background: "transparent",
          padding: "20px 0", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <p style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1.5, padding: "0 16px", marginBottom: 8 }}>
            Rounds
          </p>
          {[1, 2, 3].map(r => {
            const meta      = ROUND_META[r]
            const roundQs   = questions.filter((q: any) => q.round === r)
            const doneCount = roundQs.filter((q: any) => q.userAnswer).length
            const isActive  = currentQ?.round === r
            return (
              <div
                key={r}
                style={{
                  margin: "0 8px", borderRadius: 10, padding: "10px 12px",
                  background: isActive ? meta.color + "15" : "transparent",
                  border: `1px solid ${isActive ? meta.color + "30" : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? meta.color : "rgb(var(--text-muted))", fontFamily: mono }}>
                    {meta.label}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono, margin: "0 0 8px", lineHeight: 1.5 }}>
                  {meta.desc}
                </p>
                {/* Mini progress */}
                <div style={{ display: "flex", gap: 3 }}>
                  {roundQs.map((_: any, i: number) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: i < doneCount ? meta.color : "var(--border-subtle)",
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono, margin: "4px 0 0" }}>
                  {doneCount}/{roundQs.length} answered
                </p>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT — Question + Answer ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", maxWidth: currentQ?.isGrandmaster ? 1200 : 760, width: "100%", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", width: "100%" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Round badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 99, marginBottom: 20,
              background: currentRound.color + "15",
              border: `1px solid ${currentRound.color}30`,
            }}>
              <span style={{ fontSize: 13 }}>{currentRound.icon}</span>
              <span style={{ fontSize: 11, color: currentRound.color, fontFamily: mono, fontWeight: 600 }}>
                Round {currentQ?.round} — {currentRound.label}
              </span>
              <span style={{ fontSize: 10, color: currentRound.color + "80", fontFamily: mono }}>
                Q{currentIdx + 1} of {questions.length}
              </span>
            </div>

            {/* Question card */}
            <div style={{
              background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16, padding: "24px", marginBottom: 24,
              borderLeft: `3px solid ${currentRound.color}`,
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "rgb(var(--text-primary))", fontFamily: mono, lineHeight: 1.7, margin: 0 }}>
                {currentQ?.question}
              </p>
              {currentQ?.context && (
                <p style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono, margin: "10px 0 0", lineHeight: 1.6, fontStyle: "italic" }}>
                  💡 {currentQ.context}
                </p>
              )}
            </div>

            {/* Answer area or feedback */}
            {hasFeedback && latestQ?.feedback ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* User's answer */}
                <div style={{ background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 18 }}>
                  <p style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                    Your answer
                  </p>
                  <p style={{ fontSize: 13, color: "rgb(var(--text-secondary))", fontFamily: mono, lineHeight: 1.7, margin: 0 }}>
                    {latestQ.userAnswer}
                  </p>
                </div>

                {/* AI Feedback */}
                {(() => {
                  const sc = latestQ.score
                  const scColor = sc == null ? "rgb(var(--text-muted))" : sc >= 70 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444"
                  return (
                    <div style={{
                      background: scColor + "08",
                      border: `1px solid ${scColor}25`,
                      borderRadius: 14, overflow: "hidden",
                    }}>
                      <div style={{
                        padding: "12px 18px", borderBottom: `1px solid ${scColor}15`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: scColor + "10",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🤖</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scColor, fontFamily: mono }}>
                            AI Feedback
                          </span>
                        </div>
                        {sc != null && (
                          <div style={{
                            padding: "4px 14px", borderRadius: 99,
                            background: scColor + "20", border: `1px solid ${scColor}30`,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: scColor, fontFamily: mono }}>
                              {sc}/100
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "16px 18px" }}>
                        <p style={{
                          fontSize: 13, color: "rgb(var(--text-secondary))", fontFamily: mono,
                          lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap",
                        }}>
                          {latestQ.feedback}
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={completeInterview.isPending}
                  style={{
                    padding: "14px 0", borderRadius: 14, border: completeInterview.isPending ? "1px solid transparent" : "1px solid rgba(253,186,116,0.45)",
                    cursor: completeInterview.isPending ? "not-allowed" : "pointer",
                    background: completeInterview.isPending
                      ? "var(--glass-bg)"
                      : "rgba(217,119,6,0.18)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    color: completeInterview.isPending ? "rgb(var(--text-muted))" : "#fed7aa",
                    fontSize: 14, fontWeight: 700, fontFamily: mono,
                    boxShadow: completeInterview.isPending ? "none" : "0 4px 20px rgba(234,88,12,0.1)",
                    transition: "all 0.2s",
                  }}
                >
                  {completeInterview.isPending
                    ? "Calculating score..."
                    : isLastQ
                    ? "Finish Interview 🏁"
                    : "Next Question →"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {currentQ?.isGrandmaster ? (
                  <div>
                    <label style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono, display: "block", marginBottom: 8 }}>
                      Debug this code — fix the logical error
                    </label>
                    <div style={{ height: 400, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                      <Editor
                        height="100%"
                        language={currentQ.language || "javascript"}
                        theme="vs-dark"
                        value={answer}
                        onChange={(value) => setAnswer(value || "")}
                        options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: mono }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono, display: "block", marginBottom: 8 }}>
                      Your answer — be specific and technical
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={8}
                      style={{
                        width: "100%", padding: "14px 16px",
                        background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                        borderRadius: 14, color: "rgb(var(--text-primary))",
                        fontSize: 13, fontFamily: mono, lineHeight: 1.7,
                        resize: "vertical", outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(234,88,12,0.6)"
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(234,88,12,0.15)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-subtle)"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                )}

                {/* Tips */}
                <div style={{
                  background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", gap: 16, flexWrap: "wrap",
                }}>
                  {["Be specific", "Give examples", "Mention trade-offs", "Show depth"].map(tip => (
                    <span key={tip} style={{ fontSize: 10, color: "rgb(var(--text-muted))", fontFamily: mono }}>
                      <span style={{ color: "#ea580c" }}>✓</span> {tip}
                    </span>
                  ))}
                </div>

                {/* Grandmaster Modal */}
                {showModal && (
                  <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(23,18,16,0.8)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999
                  }}>
                    <div style={{
                      background: "rgb(var(--bg-surface))", border: "1px solid var(--border-subtle)",
                      borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                    }}>
                      <h3 style={{ margin: "0 0 12px 0", color: "#fed7aa", fontFamily: mono }}>Confirm Final Submission</h3>
                      <p style={{ margin: "0 0 24px 0", color: "rgb(var(--text-muted))", fontSize: 13, lineHeight: 1.5 }}>
                        Are you sure you want to submit your final answer? You won't be able to make further changes after this.
                      </p>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => { setShowModal(false); setSubmitCountdown(null); }}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: 8,
                            background: "transparent", border: "1px solid rgba(255,180,120,0.3)", color: "rgb(var(--text-secondary))",
                            cursor: "pointer", fontFamily: mono, fontWeight: 600
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitAnswer(true)}
                          disabled={submitCountdown !== 0}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: 8,
                            background: submitCountdown !== 0 ? "var(--glass-bg)" : "rgba(217,119,6,0.18)", 
                            border: submitCountdown !== 0 ? "1px solid transparent" : "1px solid rgba(253,186,116,0.45)",
                            color: submitCountdown !== 0 ? "rgb(var(--text-muted))" : "#fed7aa",
                            cursor: submitCountdown !== 0 ? "not-allowed" : "pointer", 
                            fontFamily: mono, fontWeight: 600, transition: "all 0.2s"
                          }}
                        >
                          {submitCountdown !== 0 ? `Wait (${submitCountdown}s)` : "Submit Answer"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grandmaster Buttons */}
                {currentQ?.isGrandmaster ? (
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <button
                      onClick={handleRunCode}
                      disabled={!answer.trim() || isSubmitting}
                      style={{
                        flex: 1, padding: "14px 0", borderRadius: 14, 
                        border: !answer.trim() || isSubmitting ? "1px solid transparent" : "1px solid rgba(253,186,116,0.45)",
                        cursor: !answer.trim() || isSubmitting ? "not-allowed" : "pointer",
                        background: !answer.trim() || isSubmitting ? "var(--glass-bg)" : "rgba(217,119,6,0.18)",
                        color: !answer.trim() || isSubmitting ? "rgb(var(--text-muted))" : "#fed7aa",
                        fontSize: 14, fontWeight: 700, fontFamily: mono, transition: "all 0.2s",
                      }}
                    >
                      {isRunningCode ? "Running..." : `Run Code (${currentQ.runAttempts || 0}/4 attempts)`}
                    </button>
                    <button
                      onClick={() => handleSubmitAnswer(false)}
                      disabled={!answer.trim() || isSubmitting}
                      style={{
                        flex: 1, padding: "14px 0", borderRadius: 14, 
                        border: !answer.trim() || isSubmitting ? "1px solid transparent" : "1px solid rgba(16,185,129,0.45)",
                        cursor: !answer.trim() || isSubmitting ? "not-allowed" : "pointer",
                        background: !answer.trim() || isSubmitting ? "var(--glass-bg)" : "rgba(16,185,129,0.1)",
                        color: !answer.trim() || isSubmitting ? "rgb(var(--text-muted))" : "#34d399",
                        fontSize: 14, fontWeight: 700, fontFamily: mono, transition: "all 0.2s",
                      }}
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubmitAnswer(false)}
                    disabled={!answer.trim() || isSubmitting}
                    style={{
                      padding: "14px 0", borderRadius: 14, border: !answer.trim() || isSubmitting ? "1px solid transparent" : "1px solid rgba(253,186,116,0.45)",
                      cursor: !answer.trim() || isSubmitting ? "not-allowed" : "pointer",
                      background: !answer.trim() || isSubmitting
                        ? "var(--glass-bg)"
                        : "rgba(217,119,6,0.18)",
                      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                      color: !answer.trim() || isSubmitting ? "rgb(var(--text-muted))" : "#fed7aa",
                      fontSize: 14, fontWeight: 700, fontFamily: mono,
                      boxShadow: !answer.trim() || isSubmitting ? "none" : "0 4px 20px rgba(234,88,12,0.1)",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSubmitting 
                      ? (isLastQ ? "Grading Interview..." : "Saving...") 
                      : (completeInterview.isError 
                          ? "Retry Grading" 
                          : (isLastQ 
                              ? "Submit & Finish" 
                              : (currentQ?.userAnswer ? "Update Answer" : "Submit Answer")))}
                  </button>
                )}
              </div>
            )}
            </div> {/* Close left column */}
            
            {/* Grandmaster Persistent Right Output Panel */}
            {currentQ?.isGrandmaster && !hasFeedback && (
              <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{
                  flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)",
                  borderRadius: 14, overflow: "hidden", fontFamily: mono, fontSize: 13,
                  display: "flex", flexDirection: "column"
                }}>
                  <div style={{ background: "rgba(255,237,213,0.03)", padding: "12px 16px", borderBottom: "1px solid rgba(255,180,120,0.1)", color: "rgb(var(--text-muted))", fontSize: 11, fontWeight: 600 }}>
                    EXECUTION OUTPUT
                  </div>
                  <div style={{ padding: 16, flex: 1, overflowY: "auto", minHeight: 400 }}>
                    {isRunningCode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgb(var(--text-muted))" }}>
                        <div
                          className="animate-spin"
                          style={{
                            width: 12, height: 12, borderRadius: "50%",
                            border: "2px solid #ea580c", borderTopColor: "transparent"
                          }}
                        />
                        Executing...
                      </div>
                    ) : runOutput ? (
                      <>
                        {runOutput.stdout && <pre style={{ margin: 0, color: "#d4d4d4", whiteSpace: "pre-wrap" }}>{runOutput.stdout}</pre>}
                        {runOutput.stderr && <pre style={{ margin: runOutput.stdout ? "12px 0 0 0" : 0, color: "#ef4444", whiteSpace: "pre-wrap" }}>{runOutput.stderr}</pre>}
                        {!runOutput.stdout && !runOutput.stderr && <span style={{ color: "rgb(var(--text-muted))" }}>Program finished with no output.</span>}
                      </>
                    ) : (
                      <span style={{ color: "rgb(var(--text-muted))", fontStyle: "italic" }}>Run your code to see output here.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            </div> {/* Close gap 32 wrapper */}
          </div>
        </div>
      </div>
    </main>
  )
}
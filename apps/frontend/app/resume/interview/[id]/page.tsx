"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useInterview, useSubmitAnswer, useCompleteInterview } from "@/hooks/useResume"
import { useAuthStore } from "@/store/auth.store"

const mono = "JetBrains Mono, monospace"

const ROUND_META: Record<number, { label: string; icon: string; color: string; desc: string }> = {
  1: { label: "Technical",  icon: "🔧", color: "#6366f1", desc: "Questions based on your listed skills" },
  2: { label: "Projects",   icon: "🏗️", color: "#7c3aed", desc: "Deep dive into your project experience" },
  3: { label: "Gap Analysis",icon: "🎯", color: "#a855f7", desc: "Skills missing for your target role" },
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

  const [currentIdx, setCurrentIdx]         = useState(0)
  const [answer, setAnswer]                 = useState("")
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [submittedId, setSubmittedId]       = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token) return null

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ background: "#0d0d1a", minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🎙️</div>
        <p style={{ color: "#5a5780", fontFamily: mono, fontSize: 13 }}>Loading your interview...</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#7c3aed",
              animation: `bounce 1s ease infinite`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!interview) return null

  const questions    = interview.questions
  const currentQ     = questions[currentIdx]
  const isLastQ      = currentIdx === questions.length - 1
  const isCompleted  = interview.status === "COMPLETED"
  const answeredCount = questions.filter((q: any) => q.userAnswer).length
  const currentRound = ROUND_META[currentQ?.round] || ROUND_META[1]
  const latestQ      = interview.questions[currentIdx]
  const hasFeedback  = latestQ?.feedback || submittedId === currentQ?.id

  // ── COMPLETED ────────────────────────────────────────────────────────────────
  if (isCompleted) {
    const score = interview.score || 0
    const scoreColor = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"
    const scoreGrad  = score >= 70
      ? "linear-gradient(135deg, #10b981, #059669)"
      : score >= 50
      ? "linear-gradient(135deg, #f59e0b, #d97706)"
      : "linear-gradient(135deg, #ef4444, #dc2626)"

    const roundScores = [1, 2, 3].map(r => {
      const qs = questions.filter((q: any) => q.round === r && q.score !== null)
      const avg = qs.length > 0 ? Math.round(qs.reduce((s: number, q: any) => s + q.score, 0) / qs.length) : null
      return { round: r, avg, meta: ROUND_META[r] }
    })

    return (
      <main style={{ background: "#0d0d1a", minHeight: "calc(100vh - 56px)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Result hero */}
          <div style={{
            background: "linear-gradient(135deg, #16163a, #1c1c45)",
            border: "1px solid #7c3aed30",
            borderRadius: 24, padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(124,58,237,0.12)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
              width: 400, height: 400,
              background: "radial-gradient(circle, #7c3aed15, transparent 70%)",
              borderRadius: "50%", pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎙️</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f0ff", fontFamily: mono, marginBottom: 8 }}>
                Interview Complete
              </h1>
              <p style={{ fontSize: 13, color: "#5a5780", fontFamily: mono, marginBottom: 32 }}>
                {score >= 70 ? "Great performance! You're interview-ready." : score >= 50 ? "Good start. Review the feedback below." : "Keep practising. Check each answer for tips."}
              </p>

              {/* Score circle */}
              <div style={{
                width: 120, height: 120, borderRadius: "50%", margin: "0 auto 32px",
                background: scoreGrad,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 40px ${scoreColor}40`,
              }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: mono, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: mono }}>/100</div>
                </div>
              </div>

              {/* Round breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
                {roundScores.map(({ round, avg, meta }) => (
                  <div key={round} style={{
                    background: "#0d0d1a", borderRadius: 14, padding: "16px 12px",
                    border: `1px solid ${meta.color}20`,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{meta.icon}</div>
                    <div style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, marginBottom: 4 }}>{meta.label}</div>
                    <div style={{
                      fontSize: 20, fontWeight: 800, fontFamily: mono,
                      color: avg === null ? "#3a3760" : avg >= 70 ? "#10b981" : avg >= 50 ? "#f59e0b" : "#ef4444",
                    }}>
                      {avg === null ? "—" : `${avg}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => router.push("/resume")}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "none",
                    cursor: "pointer", fontFamily: mono, fontWeight: 700, fontSize: 13,
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                    color: "#fff", boxShadow: "0 4px 20px #7c3aed40",
                  }}
                >
                  ← Back to Resume
                </button>
                <button
                  onClick={() => router.push("/problems")}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid #2a2a5a",
                    cursor: "pointer", fontFamily: mono, fontSize: 13,
                    background: "#16163a", color: "#a09dc0",
                  }}
                >
                  Practice DSA
                </button>
              </div>
            </div>
          </div>

          {/* Question review */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>
              Answer Review
            </h2>
            {questions.map((q: any, i: number) => {
              const meta = ROUND_META[q.round] || ROUND_META[1]
              const sc   = q.score
              const scColor = sc === null ? "#5a5780" : sc >= 70 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444"
              return (
                <div key={q.id} style={{
                  background: "#16163a", border: "1px solid #1f1f45",
                  borderRadius: 16, overflow: "hidden",
                }}>
                  {/* Q header */}
                  <div style={{
                    padding: "14px 18px", borderBottom: "1px solid #1f1f45",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                    background: "#1c1c45",
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 6,
                        background: meta.color + "20", color: meta.color,
                        border: `1px solid ${meta.color}30`,
                        fontFamily: mono, flexShrink: 0, marginTop: 1,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                      <p style={{ fontSize: 13, color: "#f1f0ff", fontFamily: mono, margin: 0, lineHeight: 1.6 }}>
                        {q.question}
                      </p>
                    </div>
                    {sc !== null && (
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
                        <p style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your answer</p>
                        <p style={{ fontSize: 12, color: "#a09dc0", fontFamily: mono, lineHeight: 1.7, margin: 0, background: "#0d0d1a", padding: "10px 14px", borderRadius: 8 }}>
                          {q.userAnswer}
                        </p>
                      </div>
                      {q.feedback && (
                        <div style={{
                          background: scColor + "08", border: `1px solid ${scColor}20`,
                          borderRadius: 10, padding: "10px 14px",
                        }}>
                          <p style={{ fontSize: 10, color: scColor, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>AI Feedback</p>
                          <p style={{ fontSize: 12, color: "#a09dc0", fontFamily: mono, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
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
  async function handleSubmitAnswer() {
    if (!answer.trim() || !currentQ) return
    setIsSubmitting(true)
    try {
      await submitAnswer.mutateAsync({ questionId: currentQ.id, answer })
      setSubmittedId(currentQ.id)
      setAnswer("")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleNext() {
    if (isLastQ) {
      await completeInterview.mutateAsync()
    } else {
      setCurrentIdx(i => i + 1)
      setSubmittedId(null)
      setAnswer("")
    }
  }

  return (
    <main style={{ background: "#0d0d1a", minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <div style={{
        borderBottom: "1px solid #1f1f45", background: "#12122b",
        padding: "0 24px", height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/resume")}
            style={{
              background: "#1c1c45", border: "1px solid #2a2a5a", borderRadius: 8,
              padding: "5px 12px", cursor: "pointer", color: "#a09dc0",
              fontSize: 11, fontFamily: mono, transition: "all 0.2s",
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
            ← Resume
          </button>
          <div style={{ width: 1, height: 20, background: "#1f1f45" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f0ff", fontFamily: mono }}>
            Mock Interview
          </span>
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 99,
            background: "#7c3aed15", color: "#a855f7", border: "1px solid #7c3aed30",
            fontFamily: mono,
          }}>
            🎙️ Live
          </span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, marginRight: 4 }}>
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
                    background: current ? "#7c3aed" : done ? "#10b981" : "#1f1f45",
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
          borderRight: "1px solid #1f1f45",
          background: "#0d0d1a",
          padding: "20px 0", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <p style={{ fontSize: 10, color: "#3a3760", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1.5, padding: "0 16px", marginBottom: 8 }}>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? meta.color : "#5a5780", fontFamily: mono }}>
                    {meta.label}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: "#3a3760", fontFamily: mono, margin: "0 0 8px", lineHeight: 1.5 }}>
                  {meta.desc}
                </p>
                {/* Mini progress */}
                <div style={{ display: "flex", gap: 3 }}>
                  {roundQs.map((_: any, i: number) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: i < doneCount ? meta.color : "#1f1f45",
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "#3a3760", fontFamily: mono, margin: "4px 0 0" }}>
                  {doneCount}/{roundQs.length} answered
                </p>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT — Question + Answer ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", maxWidth: 760, width: "100%" }}>

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
              background: "#16163a", border: "1px solid #1f1f45",
              borderRadius: 16, padding: "24px", marginBottom: 24,
              borderLeft: `3px solid ${currentRound.color}`,
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#f1f0ff", fontFamily: mono, lineHeight: 1.7, margin: 0 }}>
                {currentQ?.question}
              </p>
              {currentQ?.context && (
                <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, margin: "10px 0 0", lineHeight: 1.6, fontStyle: "italic" }}>
                  💡 {currentQ.context}
                </p>
              )}
            </div>

            {/* Answer area or feedback */}
            {hasFeedback && latestQ?.feedback ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* User's answer */}
                <div style={{ background: "#16163a", border: "1px solid #1f1f45", borderRadius: 14, padding: 18 }}>
                  <p style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                    Your answer
                  </p>
                  <p style={{ fontSize: 13, color: "#a09dc0", fontFamily: mono, lineHeight: 1.7, margin: 0 }}>
                    {latestQ.userAnswer}
                  </p>
                </div>

                {/* AI Feedback */}
                {(() => {
                  const sc = latestQ.score
                  const scColor = sc === null ? "#5a5780" : sc >= 70 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444"
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
                        {sc !== null && (
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
                          fontSize: 13, color: "#a09dc0", fontFamily: mono,
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
                    padding: "14px 0", borderRadius: 14, border: "none",
                    cursor: completeInterview.isPending ? "not-allowed" : "pointer",
                    background: completeInterview.isPending
                      ? "#2a2a5a"
                      : "linear-gradient(135deg, #7c3aed, #6366f1)",
                    color: completeInterview.isPending ? "#5a5780" : "#fff",
                    fontSize: 14, fontWeight: 700, fontFamily: mono,
                    boxShadow: completeInterview.isPending ? "none" : "0 4px 20px #7c3aed40",
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
                <div>
                  <label style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 8 }}>
                    Your answer — be specific and technical
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={8}
                    style={{
                      width: "100%", padding: "14px 16px",
                      background: "#16163a", border: "1px solid #1f1f45",
                      borderRadius: 14, color: "#f1f0ff",
                      fontSize: 13, fontFamily: mono, lineHeight: 1.7,
                      resize: "vertical", outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#7c3aed60"
                      e.currentTarget.style.boxShadow = "0 0 0 3px #7c3aed15"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#1f1f45"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>

                {/* Tips */}
                <div style={{
                  background: "#16163a", border: "1px solid #1f1f45",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", gap: 16, flexWrap: "wrap",
                }}>
                  {["Be specific", "Give examples", "Mention trade-offs", "Show depth"].map(tip => (
                    <span key={tip} style={{ fontSize: 10, color: "#5a5780", fontFamily: mono }}>
                      <span style={{ color: "#7c3aed" }}>✓</span> {tip}
                    </span>
                  ))}
                </div>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isSubmitting}
                  style={{
                    padding: "14px 0", borderRadius: 14, border: "none",
                    cursor: !answer.trim() || isSubmitting ? "not-allowed" : "pointer",
                    background: !answer.trim() || isSubmitting
                      ? "#2a2a5a"
                      : "linear-gradient(135deg, #10b981, #059669)",
                    color: !answer.trim() || isSubmitting ? "#5a5780" : "#fff",
                    fontSize: 14, fontWeight: 700, fontFamily: mono,
                    boxShadow: !answer.trim() || isSubmitting ? "none" : "0 4px 20px #10b98130",
                    transition: "all 0.2s",
                  }}
                >
                  {isSubmitting ? "Evaluating..." : "Submit Answer"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useProblem, useSubmit } from "@/hooks/useProblems"
import { useAuthStore } from "@/store/auth.store"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const mono = "JetBrains Mono, monospace"

const DIFF: Record<string, { color: string; bg: string; border: string }> = {
  EASY:   { color: "#10b981", bg: "#10b98112", border: "#10b98130" },
  MEDIUM: { color: "#f59e0b", bg: "#f59e0b12", border: "#f59e0b30" },
  HARD:   { color: "#ef4444", bg: "#ef444412", border: "#ef444430" },
}

export default function ProblemPage() {
  const router  = useRouter()
  const params  = useParams()
  const slug    = params.slug as string
  const token   = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: problem, isLoading } = useProblem(slug)
  const submit = useSubmit()

  const [language, setLanguage] = useState<"javascript" | "python">("javascript")
  const [code, setCode]         = useState("")
  const [results, setResults]   = useState<any[] | null>(null)
  const [allPassed, setAllPassed] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<"description" | "results">("description")

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  useEffect(() => {
    if (problem) {
      setCode((problem.starterCode as any)[language] || "")
      setResults(null)
      setAllPassed(null)
      setActiveTab("description")
    }
  }, [problem, language])

  async function handleSubmit() {
    if (!problem) return
    setResults(null)
    setAllPassed(null)
    try {
      const res = await submit.mutateAsync({ id: problem.id, code, language })
      setResults(res.data.data.results)
      setAllPassed(res.data.data.allPassed)
      setActiveTab("results")
    } catch (err) {
      console.error(err)
    }
  }

  if (!hydrated || !token) return null

  if (isLoading) return (
    <div style={{ background: "#0d0d1a", height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
        <p style={{ color: "#5a5780", fontFamily: mono, fontSize: 13 }}>Loading problem...</p>
      </div>
    </div>
  )

  if (!problem) return (
    <div style={{ background: "#0d0d1a", height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5a5780", fontFamily: mono }}>Problem not found</p>
    </div>
  )

  const diff = DIFF[problem.difficulty] || DIFF.EASY

  return (
    <div style={{ background: "#0d0d1a", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 48, flexShrink: 0,
        borderBottom: "1px solid #1f1f45",
        background: "#12122b",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px", gap: 12,
      }}>
        {/* Left — back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            onClick={() => router.push("/problems")}
            style={{
              background: "#1c1c45", border: "1px solid #2a2a5a",
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
              color: "#a09dc0", fontSize: 11, fontFamily: mono,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s", flexShrink: 0,
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
            ← Problems
          </button>

          <div style={{ width: 1, height: 20, background: "#1f1f45", flexShrink: 0 }} />

          <span style={{
            fontSize: 13, fontWeight: 700, color: "#f1f0ff",
            fontFamily: mono, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {problem.title}
          </span>

          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 99, flexShrink: 0,
            color: diff.color, background: diff.bg, border: `1px solid ${diff.border}`,
            fontFamily: mono, fontWeight: 600,
          }}>
            {problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Right — language + submit */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{
              background: "#1c1c45", border: "1px solid #2a2a5a",
              borderRadius: 8, padding: "5px 10px",
              color: "#a09dc0", fontSize: 11, fontFamily: mono,
              cursor: "pointer", outline: "none",
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>

          <button
            onClick={handleSubmit}
            disabled={submit.isPending}
            style={{
              padding: "6px 20px", borderRadius: 8, border: "none",
              cursor: submit.isPending ? "not-allowed" : "pointer",
              background: submit.isPending
                ? "#2a2a5a"
                : "linear-gradient(135deg, #10b981, #059669)",
              color: submit.isPending ? "#5a5780" : "#fff",
              fontSize: 12, fontWeight: 700, fontFamily: mono,
              boxShadow: submit.isPending ? "none" : "0 2px 12px #10b98130",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {submit.isPending ? (
              <>
                <span style={{ animation: "pulse 1s infinite" }}>⏳</span> Running...
              </>
            ) : (
              <>▶ Run & Submit</>
            )}
          </button>
        </div>
      </div>

      {/* ── Main split ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT panel ── */}
        <div style={{
          width: "38%", minWidth: 300, maxWidth: 520,
          borderRight: "1px solid #1f1f45",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", borderBottom: "1px solid #1f1f45",
            background: "#12122b", flexShrink: 0,
          }}>
            {(["description", "results"] as const).map((tab) => {
              const active = activeTab === tab
              const hasResults = tab === "results" && results !== null
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 18px", fontSize: 11, fontFamily: mono,
                    cursor: "pointer", border: "none",
                    background: "transparent",
                    color: active ? "#f1f0ff" : "#5a5780",
                    borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {tab === "description" ? "Description" : "Results"}
                  {hasResults && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: allPassed ? "#10b981" : "#ef4444",
                      display: "inline-block",
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

            {/* DESCRIPTION */}
            {activeTab === "description" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Title + meta */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <h1 style={{ fontSize: 17, fontWeight: 800, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>
                      {problem.title}
                    </h1>
                  </div>
                  <span style={{
                    fontSize: 11, color: "#5a5780", fontFamily: mono,
                    padding: "3px 10px", borderRadius: 6,
                    background: "#1c1c45", border: "1px solid #1f1f45",
                  }}>
                    {problem.category}
                  </span>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 13, color: "#a09dc0", lineHeight: 1.9,
                  fontFamily: mono, whiteSpace: "pre-wrap",
                }}>
                  {problem.description}
                </div>

                {/* Examples */}
                {(problem.examples as any[]).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{
                      fontSize: 10, color: "#5a5780", fontFamily: mono,
                      textTransform: "uppercase", letterSpacing: 1.5, margin: 0,
                    }}>
                      Examples
                    </p>
                    {(problem.examples as any[]).map((ex: any, i: number) => (
                      <div key={i} style={{
                        background: "#16163a", border: "1px solid #1f1f45",
                        borderRadius: 12, padding: 14,
                        display: "flex", flexDirection: "column", gap: 6,
                      }}>
                        <div style={{ fontSize: 12, fontFamily: mono }}>
                          <span style={{ color: "#5a5780" }}>Input: </span>
                          <code style={{
                            color: "#f1f0ff", background: "#0d0d1a",
                            padding: "2px 6px", borderRadius: 4, fontSize: 11,
                          }}>
                            {ex.input}
                          </code>
                        </div>
                        <div style={{ fontSize: 12, fontFamily: mono }}>
                          <span style={{ color: "#5a5780" }}>Output: </span>
                          <code style={{
                            color: "#a855f7", background: "#7c3aed10",
                            padding: "2px 6px", borderRadius: 4, fontSize: 11,
                          }}>
                            {ex.output}
                          </code>
                        </div>
                        {ex.explanation && (
                          <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, margin: 0 }}>
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {(problem.constraints as string[]).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{
                      fontSize: 10, color: "#5a5780", fontFamily: mono,
                      textTransform: "uppercase", letterSpacing: 1.5, margin: 0,
                    }}>
                      Constraints
                    </p>
                    <div style={{
                      background: "#16163a", border: "1px solid #1f1f45",
                      borderRadius: 12, padding: 14,
                      display: "flex", flexDirection: "column", gap: 6,
                    }}>
                      {(problem.constraints as string[]).map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: "#7c3aed", fontSize: 11, marginTop: 1, flexShrink: 0 }}>•</span>
                          <span style={{ fontSize: 12, color: "#a09dc0", fontFamily: mono, lineHeight: 1.6 }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RESULTS */}
            {activeTab === "results" && results && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Summary banner */}
                <div style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: allPassed ? "#10b98110" : "#ef444410",
                  border: `1px solid ${allPassed ? "#10b98130" : "#ef444430"}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{allPassed ? "✅" : "❌"}</span>
                  <div>
                    <p style={{
                      fontSize: 13, fontWeight: 700, fontFamily: mono, margin: 0,
                      color: allPassed ? "#10b981" : "#ef4444",
                    }}>
                      {allPassed ? "All tests passed!" : "Some tests failed"}
                    </p>
                    <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, margin: "2px 0 0" }}>
                      {results.filter(r => r.passed).length} / {results.length} test cases passed
                    </p>
                  </div>
                </div>

                {/* Individual test results */}
                {results.map((r: any, i: number) => (
                  <div key={i} style={{
                    background: "#16163a",
                    border: `1px solid ${r.passed ? "#10b98125" : "#ef444425"}`,
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    {/* Result header */}
                    <div style={{
                      padding: "10px 14px",
                      background: r.passed ? "#10b98108" : "#ef444408",
                      borderBottom: `1px solid ${r.passed ? "#10b98115" : "#ef444415"}`,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 13 }}>{r.passed ? "✅" : "❌"}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, fontFamily: mono,
                        color: r.passed ? "#10b981" : "#ef4444",
                      }}>
                        Test {i + 1}
                      </span>
                      {r.time && (
                        <span style={{
                          fontSize: 10, color: "#5a5780", fontFamily: mono,
                          marginLeft: "auto",
                        }}>
                          {r.time}s
                        </span>
                      )}
                    </div>

                    {/* Result body */}
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, color: "#5a5780", fontFamily: mono }}>Input</span>
                        <div style={{
                          marginTop: 4, background: "#0d0d1a", borderRadius: 6,
                          padding: "6px 10px", fontSize: 11, fontFamily: mono, color: "#a09dc0",
                        }}>
                          {r.input}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: "#5a5780", fontFamily: mono }}>Expected</span>
                          <div style={{
                            marginTop: 4, background: "#0d0d1a", borderRadius: 6,
                            padding: "6px 10px", fontSize: 11, fontFamily: mono, color: "#10b981",
                          }}>
                            {r.expected}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: "#5a5780", fontFamily: mono }}>Got</span>
                          <div style={{
                            marginTop: 4, background: "#0d0d1a", borderRadius: 6,
                            padding: "6px 10px", fontSize: 11, fontFamily: mono,
                            color: r.passed ? "#10b981" : "#ef4444",
                          }}>
                            {r.output || <span style={{ color: "#3a3760" }}>no output</span>}
                          </div>
                        </div>
                      </div>
                      {r.stderr && (
                        <div>
                          <span style={{ fontSize: 10, color: "#ef4444", fontFamily: mono }}>Error</span>
                          <div style={{
                            marginTop: 4, background: "#ef444408", borderRadius: 6,
                            padding: "6px 10px", fontSize: 11, fontFamily: mono, color: "#ef4444",
                            wordBreak: "break-all",
                          }}>
                            {r.stderr}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "results" && !results && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧪</div>
                <p style={{ color: "#5a5780", fontFamily: mono, fontSize: 13 }}>
                  Run your code to see results here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT panel — Editor ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Editor header */}
          <div style={{
            height: 36, flexShrink: 0,
            borderBottom: "1px solid #1f1f45",
            background: "#12122b",
            display: "flex", alignItems: "center",
            padding: "0 16px", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
            <span style={{ fontSize: 11, color: "#5a5780", fontFamily: mono }}>
              solution.{language === "javascript" ? "js" : "py"}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#3a3760", fontFamily: mono }}>
                {code.split("\n").length} lines
              </span>
            </div>
          </div>

          {/* Monaco */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <MonacoEditor
              height="100%"
              language={language === "javascript" ? "javascript" : "python"}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "line",
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                suggest: { showKeywords: true },
              }}
            />
          </div>

          {/* Status bar */}
          <div style={{
            height: 24, flexShrink: 0,
            borderTop: "1px solid #1f1f45",
            background: "#0d0d1a",
            display: "flex", alignItems: "center",
            padding: "0 16px", gap: 16,
          }}>
            <span style={{ fontSize: 10, color: "#3a3760", fontFamily: mono }}>
              {language === "javascript" ? "JavaScript (Node.js)" : "Python 3"}
            </span>
            <span style={{ fontSize: 10, color: "#3a3760", fontFamily: mono }}>
              UTF-8
            </span>
            {submit.isPending && (
              <span style={{ fontSize: 10, color: "#7c3aed", fontFamily: mono, marginLeft: "auto", animation: "pulse 1s infinite" }}>
                ● Executing...
              </span>
            )}
            {allPassed !== null && !submit.isPending && (
              <span style={{
                fontSize: 10, fontFamily: mono, marginLeft: "auto",
                color: allPassed ? "#10b981" : "#ef4444",
              }}>
                {allPassed ? "● All tests passed" : "● Tests failed"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const slug    = params.slug as string
  const mode    = searchParams.get("mode")
  const nodeId  = searchParams.get("nodeId")
  const token   = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: problem, isLoading } = useProblem(slug, mode)
  const submit = useSubmit()

  const [language, setLanguage] = useState<"javascript" | "python">("javascript")
  const [codeDrafts, setCodeDrafts] = useState<{ javascript?: string; python?: string }>({})
  const [results, setResults]   = useState<any[] | null>(null)
  const [allPassed, setAllPassed] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<"description" | "results">("description")

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (problem) {
        setCodeDrafts({
          javascript: (problem.starterCode as any).javascript || "",
          python: (problem.starterCode as any).python || "",
        })
        setResults(null)
        setAllPassed(null)
        setActiveTab("description")
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [problem])

  const code = codeDrafts[language] || ""

  async function handleSubmit() {
    if (!problem) return
    setResults(null)
    setAllPassed(null)
    try {
      const res = await submit.mutateAsync({ id: problem.id, code, language, nodeId })
      setResults(res.data.data.results)
      setAllPassed(res.data.data.allPassed)
      setActiveTab("results")
    } catch (err) {
      console.error(err)
    }
  }

  if (!hydrated || !token) return null

  if (isLoading) return (
    <div className="bg-base" style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Skeleton Top Bar */}
      <div style={{
        height: 48, borderBottom: "1px solid var(--border-subtle)",
        background: "var(--glass-bg)", display: "flex", alignItems: "center",
        padding: "0 16px", justifyContent: "space-between"
      }}>
        <div style={{ width: 120, height: 24, borderRadius: 8, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
        <div style={{ width: 80, height: 28, borderRadius: 8, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
      </div>

      {/* Skeleton Split Panes */}
      <div style={{ display: "flex", height: "calc(100vh - 56px - 48px)" }}>
        {/* Left Pane (Description) */}
        <div style={{ flex: 1, borderRight: "1px solid var(--border-subtle)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: "60%", height: 32, borderRadius: 8, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 60, height: 24, borderRadius: 12, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
            <div style={{ width: 80, height: 24, borderRadius: 12, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          </div>
          <div style={{ width: "100%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite", marginTop: 16 }} />
          <div style={{ width: "90%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          <div style={{ width: "95%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          <div style={{ width: "80%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
        </div>
        
        {/* Right Pane (Editor) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Editor Header */}
          <div style={{ height: 40, borderBottom: "1px solid var(--border-subtle)", background: "var(--glass-bg)", display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{ width: 100, height: 20, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          </div>
          {/* Editor Body */}
          <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ width: "40%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
            <div style={{ width: "50%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite", marginLeft: 24 }} />
            <div style={{ width: "60%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite", marginLeft: 24 }} />
            <div style={{ width: "30%", height: 16, borderRadius: 4, background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
          </div>
        </div>
      </div>
    </div>
  )

  if (!problem) return (
    <div style={{ background: "var(--bg-base)", height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)", fontFamily: mono }}>Problem not found</p>
    </div>
  )

  const diff = DIFF[problem.difficulty] || DIFF.EASY

  return (
    <div className="bg-base">

      {/* ── Top bar ── */}
      <div style={{
        height: 48, flexShrink: 0,
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px", gap: 12,
      }}>
        {/* Left — back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            onClick={() => router.push("/problems")}
            style={{
              background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 11, fontFamily: mono,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(234,88,12,0.5)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"
            }}
          >
            ← Problems
          </button>

          <div style={{ width: 1, height: 20, background: "var(--border-subtle)", flexShrink: 0 }} />

          <span style={{
            fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
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
              background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
              borderRadius: 8, padding: "5px 10px",
              color: "var(--text-muted)", fontSize: 11, fontFamily: mono,
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
              padding: "6px 20px", borderRadius: 8,
              cursor: submit.isPending ? "not-allowed" : "pointer",
              background: submit.isPending
                ? "var(--glass-bg)"
                : "rgba(217,119,6,0.18)",
              border: submit.isPending ? "1px solid transparent" : "1px solid rgba(253,186,116,0.45)",
              color: submit.isPending ? "var(--text-muted)" : "#fed7aa",
              fontSize: 12, fontWeight: 700, fontFamily: mono,
              boxShadow: submit.isPending ? "none" : "0 4px 20px rgba(234,88,12,0.1)",
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
          borderRight: "1px solid var(--border-subtle)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", borderBottom: "1px solid var(--border-subtle)",
            background: "rgba(var(--glass-bg-rgb),0.02)", flexShrink: 0,
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
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    borderBottom: active ? "2px solid #ea580c" : "2px solid transparent",
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
                    <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontFamily: mono, margin: 0 }}>
                      {problem.title}
                    </h1>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{
                      fontSize: 11, color: "var(--text-muted)", fontFamily: mono,
                      padding: "3px 10px", borderRadius: 6,
                      background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                    }}>
                      {problem.category}
                    </span>
                    {mode === 'anvil' && (
                      <span style={{
                        fontSize: 11, color: "#ff6b00", fontFamily: mono,
                        padding: "3px 10px", borderRadius: 6,
                        background: "rgba(255, 107, 0, 0.1)", border: "1px solid rgba(255, 107, 0, 0.3)",
                      }}>
                        🔨 ANVIL CHALLENGE
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {mode === 'anvil' && (
                  <div style={{
                    padding: 12, borderRadius: 8, background: "rgba(255, 107, 0, 0.05)",
                    borderLeft: "4px solid #ff6b00", color: "var(--text-secondary)",
                    fontFamily: mono, fontSize: 12, lineHeight: 1.6
                  }}>
                    <strong>Mission:</strong> This code is fundamentally broken. A junior developer tried to implement this but missed some critical edge cases.
                    <br/><br/>
                    Your task is to fix the <code>solution.{language === "javascript" ? "js" : "py"}</code> file so that it passes all test cases.
                  </div>
                )}
                
                <div style={{
                  fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.9,
                  fontFamily: mono, whiteSpace: "pre-wrap",
                }}>
                  {problem.description}
                </div>

                {/* Examples */}
                {(problem.examples as any[]).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{
                      fontSize: 10, color: "var(--text-muted)", fontFamily: mono,
                      textTransform: "uppercase", letterSpacing: 1.5, margin: 0,
                    }}>
                      Examples
                    </p>
                    {(problem.examples as any[]).map((ex: any, i: number) => (
                      <div key={i} style={{
                        background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                        borderRadius: 12, padding: 14,
                        display: "flex", flexDirection: "column", gap: 6,
                      }}>
                        <div style={{ fontSize: 12, fontFamily: mono }}>
                          <span style={{ color: "var(--text-muted)" }}>Input: </span>
                          <code style={{
                            color: "var(--text-primary)", background: "var(--bg-surface)",
                            padding: "2px 6px", borderRadius: 4, fontSize: 11,
                          }}>
                            {ex.input}
                          </code>
                        </div>
                        <div style={{ fontSize: 12, fontFamily: mono }}>
                          <span style={{ color: "var(--text-muted)" }}>Output: </span>
                          <code style={{
                            color: "var(--text-secondary)", background: "var(--bg-surface)",
                            padding: "2px 6px", borderRadius: 4, fontSize: 11,
                          }}>
                            {ex.output}
                          </code>
                        </div>
                        {ex.explanation && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: mono, margin: 0 }}>
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
                      fontSize: 10, color: "var(--text-muted)", fontFamily: mono,
                      textTransform: "uppercase", letterSpacing: 1.5, margin: 0,
                    }}>
                      Constraints
                    </p>
                    <div style={{
                      background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                      borderRadius: 12, padding: 14,
                      display: "flex", flexDirection: "column", gap: 6,
                    }}>
                      {(problem.constraints as string[]).map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: "#ea580c", fontSize: 11, marginTop: 1, flexShrink: 0 }}>•</span>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: mono, lineHeight: 1.6 }}>{c}</span>
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
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: mono, margin: "2px 0 0" }}>
                      {results.filter(r => r.passed).length} / {results.length} test cases passed
                    </p>
                  </div>
                </div>

                {/* Individual test results */}
                {results.map((r: any, i: number) => (
                  <div key={i} style={{
                    background: "var(--glass-bg)",
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
                          fontSize: 10, color: "var(--text-muted)", fontFamily: mono,
                          marginLeft: "auto",
                        }}>
                          {r.time}s
                        </span>
                      )}
                    </div>

                    {/* Result body */}
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>Input</span>
                        <div style={{
                          marginTop: 4, background: "var(--bg-surface)", borderRadius: 6,
                          padding: "6px 10px", fontSize: 11, fontFamily: mono, color: "var(--text-secondary)",
                        }}>
                          {r.input}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>Expected</span>
                          <div style={{
                            marginTop: 4, background: "var(--bg-surface)", borderRadius: 6,
                            padding: "6px 10px", fontSize: 11, fontFamily: mono, color: "#10b981",
                          }}>
                            {r.expected}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>Got</span>
                          <div style={{
                            marginTop: 4, background: "var(--bg-surface)", borderRadius: 6,
                            padding: "6px 10px", fontSize: 11, fontFamily: mono,
                            color: r.passed ? "#10b981" : "#ef4444",
                          }}>
                            {r.output || <span style={{ color: "var(--text-muted)" }}>no output</span>}
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
                <p style={{ color: "var(--text-muted)", fontFamily: mono, fontSize: 13 }}>
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
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "var(--bg-base)",
            display: "flex", alignItems: "center",
            padding: "0 16px", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: mono }}>
              solution.{language === "javascript" ? "js" : "py"}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>
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
              onChange={(val) => setCodeDrafts(prev => ({ ...prev, [language]: val || "" }))}
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
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "var(--bg-base)",
            display: "flex", alignItems: "center",
            padding: "0 16px", gap: 16,
          }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>
              {language === "javascript" ? "JavaScript (Node.js)" : "Python 3"}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono }}>
              UTF-8
            </span>
            {submit.isPending && (
              <span style={{ fontSize: 10, color: "#ea580c", fontFamily: mono, marginLeft: "auto", animation: "pulse 1s infinite" }}>
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
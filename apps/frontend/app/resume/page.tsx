"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useResume, useUploadResume, useStartInterview, useDeleteResume } from "@/hooks/useResume"
import { useResumeBuilder, useDeleteResumeBuilder } from "@/hooks/useResumeBuilder"
import { useAuthStore } from "@/store/auth.store"
import { api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { useUpdateResume } from "@/hooks/useResume"

const mono = "JetBrains Mono, monospace"
const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444"
const scoreGrad  = (s: number) => s >= 80
  ? "linear-gradient(90deg, #10b981, #059669)"
  : s >= 60
  ? "linear-gradient(90deg, #f59e0b, #d97706)"
  : "linear-gradient(90deg, #ef4444, #dc2626)"

export default function ResumePage() {
  const router    = useRouter()
  const qc        = useQueryClient()
  const token     = useAuthStore((s) => s.token)
  const hydrated  = useAuthStore((s) => s.hydrated)

  const { data: resume,      isLoading }      = useResume()
  const { data: builtResume, isLoading: builtLoading } = useResumeBuilder()
  const upload          = useUploadResume()
  const startInterview  = useStartInterview()
  const deleteResume    = useDeleteResume()
  const deleteBuilder   = useDeleteResumeBuilder()

  const fileRef   = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [expanded, setExpanded]   = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const updateResume = useUpdateResume()
  const [editing, setEditing]   = useState(false)
  const [editData, setEditData] = useState<any>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") return alert("Please upload a PDF file")
    await upload.mutateAsync(file)
    setExpanded(true)
  }

  async function handleStartInterview() {
    if (!resume) return
    const interview = await startInterview.mutateAsync(resume.id)
    router.push(`/resume/interview/${interview.id}`)
  }

  async function handleDeleteScanned() {
    if (!confirm("Delete your scanned resume analysis? This cannot be undone.")) return
    await deleteResume.mutateAsync()
  }

  async function handleDeleteBuilder() {
    if (!confirm("Delete your built resume? This cannot be undone.")) return
    await deleteBuilder.mutateAsync()
  }

  async function handleAnalyzeBuilt() {
    setAnalyzing(true)
    try {
      await api.post("/resume/analyze-builder")
      qc.invalidateQueries({ queryKey: ["resume"] })
      setExpanded(true)
    } catch (err: any) {
      alert(err?.response?.data?.error || "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  function handleExportBuilderPDF() {
    window.open("/resume/builder?print=true", "_blank")
  }

  if (!hydrated || !token) return null

  return (
    <main style={{ background: "#0d0d1a", minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>Resume Intelligence</h1>
            <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: mono }}>
              Upload your resume — AI analyzes it and builds a personalized mock interview
            </p>
          </div>
          <button
            onClick={() => router.push("/resume/builder")}
            style={{
              padding: "10px 18px", borderRadius: 12, border: "1px solid #7c3aed40",
              background: "#7c3aed15", color: "#a855f7", fontSize: 12,
              fontFamily: mono, cursor: "pointer", fontWeight: 600, flexShrink: 0,
            }}
          >
            ✏️ Resume Builder
          </button>
        </div>

        {/* ── Built Resume Card ── */}
        {!builtLoading && builtResume?.sections && (
          <div style={{
            background: "#16163a", border: "1px solid #1f1f45",
            borderRadius: 16, padding: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Thumbnail */}
              <div style={{
                width: 48, height: 64, borderRadius: 6, background: "#fff",
                flexShrink: 0, border: "1px solid #e0e0e0",
                display: "flex", flexDirection: "column", padding: 5, gap: 2, overflow: "hidden",
              }}>
                {[60, 40, 90, 70, 50, 80, 65].map((w, i) => (
                  <div key={i} style={{
                    height: i === 0 ? 5 : 3, borderRadius: 99,
                    background: i === 0 ? "#7c3aed" : "#e0e0e0", width: `${w}%`,
                  }} />
                ))}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>
                  {(() => {
                    const personal = builtResume.sections.find((s: any) => s.type === "personal")?.data
                    return personal?.name ? `${personal.name}'s Resume` : "My Built Resume"
                  })()}
                </p>
                <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, margin: "3px 0 0" }}>
                  Built with Resume Builder ·{" "}
                  {builtResume.sections.filter((s: any) => s.enabled).length} sections ·{" "}
                  Last updated {new Date(builtResume.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* Analyze built resume */}
              <button
                onClick={handleAnalyzeBuilt}
                disabled={analyzing}
                title="Analyze this resume with AI"
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 11,
                  fontFamily: mono, cursor: analyzing ? "not-allowed" : "pointer",
                  border: "1px solid #6366f140", background: "#6366f115", color: "#818cf8",
                  opacity: analyzing ? 0.6 : 1,
                }}
              >
                {analyzing ? "Analyzing..." : "🔍 Analyze"}
              </button>
              {/* Edit */}
              <button
                onClick={() => router.push("/resume/builder")}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 11,
                  fontFamily: mono, cursor: "pointer",
                  border: "1px solid #7c3aed40", background: "#7c3aed15", color: "#a855f7",
                }}
              >
                ✏️ Edit
              </button>
              {/* Download PDF */}
              <button
                onClick={handleExportBuilderPDF}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 11,
                  fontFamily: mono, cursor: "pointer", border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                  color: "#fff", boxShadow: "0 2px 10px #7c3aed30",
                }}
              >
                ↓ PDF
              </button>
              {/* Delete built resume */}
              <button
                onClick={handleDeleteBuilder}
                disabled={deleteBuilder.isPending}
                title="Delete built resume"
                style={{
                  padding: "7px 10px", borderRadius: 10, fontSize: 12,
                  cursor: "pointer", border: "1px solid #ef444430",
                  background: "#ef444410", color: "#ef4444",
                }}
              >
                🗑
              </button>
            </div>
          </div>
        )}

        {/* ── Upload Zone ── */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
          style={{
            border: `2px dashed ${dragOver ? "#7c3aed" : "#2a2a5a"}`,
            borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "#7c3aed08" : "#16163a", transition: "all 0.2s",
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {upload.isPending ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <p style={{ fontSize: 14, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>Analyzing your resume...</p>
              <p style={{ fontSize: 12, color: "#5a5780", fontFamily: mono, margin: 0 }}>AI is scanning skills, projects, and writing quality</p>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", animation: `bounce 1s ease infinite ${i*0.15}s` }} />)}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <p style={{ fontSize: 14, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>
                {resume ? "Drop a new resume to re-analyze" : "Drop your resume here"}
              </p>
              <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: mono }}>PDF only · Max 5MB</p>
            </>
          )}
        </div>

        {/* ── Scanned Resume Analysis ── */}
        {(isLoading || analyzing) && (
          <div style={{ height: 80, borderRadius: 16, background: "#16163a", border: "1px solid #1f1f45", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#5a5780", fontFamily: mono, fontSize: 12 }}>
              {analyzing ? "🔍 Analyzing your built resume..." : "Loading..."}
            </p>
          </div>
        )}

        {resume && !upload.isPending && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Accordion header */}
            <div style={{
              background: "#16163a", border: "1px solid #1f1f45", borderRadius: 16,
              padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }} onClick={() => setExpanded(!expanded)}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f0ff", fontFamily: mono }}>Resume Analysis</span>
                <span style={{
                  fontSize: 10, padding: "3px 10px", borderRadius: 99, fontFamily: mono,
                  background: "#7c3aed15", color: "#a855f7", border: "1px solid #7c3aed30",
                }}>
                  {resume.experienceLevel}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(resume.score), fontFamily: mono }}>
                  {resume.score}<span style={{ fontSize: 13, color: "#3a3760" }}>/100</span>
                </span>
                {/* Delete scanned */}
                <button
                  onClick={handleDeleteScanned}
                  disabled={deleteResume.isPending}
                  title="Delete resume analysis"
                  style={{
                    padding: "5px 8px", borderRadius: 8, border: "1px solid #ef444430",
                    background: "#ef444410", color: "#ef4444", cursor: "pointer", fontSize: 12,
                  }}
                >
                  🗑
                </button>
                <span onClick={() => setExpanded(!expanded)} style={{ fontSize: 12, color: "#5a5780", fontFamily: mono, cursor: "pointer" }}>
                  {expanded ? "▲ Collapse" : "▼ Expand"}
                </span>
              </div>
            </div>

            {expanded && (
              <>
                {/* Score breakdown */}
                <div style={{ background: "#16163a", border: "1px solid #1f1f45", borderRadius: 16, padding: 24 }}>
                  <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20, margin: "0 0 20px" }}>
                    Score Breakdown · {resume.targetRole || "Developer"}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Skills Relevance",  score: resume.skillsScore },
                      { label: "Project Impact",     score: resume.projectsScore },
                      { label: "Writing Quality",    score: resume.writingScore },
                      { label: "ATS Compatibility",  score: resume.atsScore },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "#a09dc0", fontFamily: mono }}>{item.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(item.score), fontFamily: mono }}>{item.score}%</span>
                        </div>
                        <div style={{ height: 6, background: "#1c1c45", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: scoreGrad(item.score), width: `${item.score}%`, transition: "width 0.7s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div style={{ background: "#16163a", border: "1px solid #1f1f45", borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>Skills Detected</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {resume.skills.map((skill: string) => (
                      <span key={skill} style={{
                        padding: "5px 12px", borderRadius: 99, fontSize: 11, fontFamily: mono,
                        background: "#7c3aed15", color: "#a855f7", border: "1px solid #7c3aed30",
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                {resume.gaps?.length > 0 && (
                  <div style={{ background: "#16163a", border: "1px solid #1f1f45", borderRadius: 16, padding: 20 }}>
                    <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>Skill Gaps</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {resume.gaps.map((gap: string) => (
                        <span key={gap} style={{
                          padding: "5px 12px", borderRadius: 99, fontSize: 11, fontFamily: mono,
                          background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430",
                        }}>
                          + {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {resume.suggestions && (resume.suggestions as any[]).length > 0 && (
                  <div style={{ background: "#16163a", border: "1px solid #1f1f45", borderRadius: 16, padding: 20 }}>
                    <p style={{ fontSize: 11, color: "#5a5780", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>Improvement Suggestions</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(resume.suggestions as any[]).map((s: any, i: number) => (
                        <div key={i} style={{ background: "#1c1c45", border: "1px solid #1f1f45", borderRadius: 12, padding: 14 }}>
                          <span style={{
                            fontSize: 10, padding: "2px 8px", borderRadius: 6, fontFamily: mono,
                            background: "#2a2a5a", color: "#5a5780", display: "inline-block", marginBottom: 8,
                          }}>
                            {s.section}
                          </span>
                          <p style={{ fontSize: 12, color: "#a09dc0", fontFamily: mono, marginBottom: 6, margin: "0 0 6px" }}>{s.issue}</p>
                          <p style={{ fontSize: 12, color: "#10b981", fontFamily: mono, margin: 0 }}>→ {s.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview CTA */}
                <div style={{
                  background: "linear-gradient(135deg, #7c3aed15, #6366f115)",
                  border: "1px solid #7c3aed30", borderRadius: 16, padding: "20px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
                }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>Ready for your Mock Interview?</p>
                    <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: mono, margin: "4px 0 0" }}>
                      AI will ask 9 questions based specifically on your resume
                    </p>
                  </div>
                  <button
                    onClick={handleStartInterview}
                    disabled={startInterview.isPending}
                    style={{
                      padding: "12px 24px", borderRadius: 12, fontSize: 13, cursor: "pointer",
                      fontFamily: mono, fontWeight: 700, border: "none", whiteSpace: "nowrap",
                      background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                      color: "#fff", boxShadow: "0 4px 20px #7c3aed40",
                      opacity: startInterview.isPending ? 0.5 : 1,
                    }}
                  >
                    {startInterview.isPending ? "Generating..." : "Start Interview →"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
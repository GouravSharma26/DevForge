"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useResumes, useInterviews, useStartInterview, useDeleteInterview, useUploadResume } from "@/hooks/useResume"
import { Plus } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import type { Interview, Resume } from "@devforge/shared-types"

const mono = "JetBrains Mono, monospace"

export default function InterviewHubPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: interviews, isLoading } = useInterviews()
  const { data: resumes, isLoading: resumesLoading } = useResumes()
  const startInterview = useStartInterview()
  const deleteInterview = useDeleteInterview()
  const uploadResume = useUploadResume()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Auto-select the first resume if none selected
  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id)
    }
  }, [resumes, selectedResumeId])

  async function handleStart() {
    if (!selectedResumeId) return alert("Please select a resume first")
    // NOTE: This calls the existing useStartInterview() hook with the selectedResumeId.
    const interview = await startInterview.mutateAsync(selectedResumeId)
    router.push(`/resume/interview/${interview.id}`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      return alert("Only PDF files are supported at this time.")
    }
    
    try {
      const newResume = await uploadResume.mutateAsync({ file, skipAI: false })
      if (newResume && newResume.id) {
        setSelectedResumeId(newResume.id)
      }
    } catch (err: any) {
      // Errors handled by global interceptor or mutation
      console.error(err)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!hydrated || !token) return null

  return (
    <main style={{ minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, margin: 0 }}>Interview Hub</h1>
            <p style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginTop: 4, fontFamily: mono }}>
              Practice mock interviews based on your specific resumes
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--glass-bg)", padding: "8px 12px", borderRadius: 12, border: "1px solid var(--border-subtle)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <span style={{ fontSize: 12, color: "rgb(var(--text-secondary))", fontFamily: mono }}>Target Resume:</span>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              disabled={resumesLoading || startInterview.isPending}
              style={{
                background: "rgb(var(--bg-surface))",
                border: "1px solid var(--border-subtle)",
                color: "rgb(var(--text-primary))",
                padding: "6px 12px",
                borderRadius: 8,
                fontFamily: mono,
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
                minWidth: 200
              }}
            >
              <option value="" disabled>Select a profile...</option>
              {resumes?.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.profileName} {res.targetRole ? `(${res.targetRole})` : ""}
                </option>
              ))}
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadResume.isPending}
              title="Upload New Resume"
              style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-subtle)",
                background: uploadResume.isPending ? "var(--glass-bg)" : "rgb(var(--bg-surface))",
                color: uploadResume.isPending ? "rgb(var(--text-muted))" : "#ea580c",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: uploadResume.isPending ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              <Plus size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* ── Interview Types ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 10 }}>
          
          {/* Standard Mock */}
          <div style={{
            background: "rgba(var(--glass-bg-rgb),0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              height: 140,
              background: "linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(217,119,6,0.05) 100%)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden"
            }}>
              <img src="/images/interview_standard_banner.png" alt="Standard Mock" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, marginBottom: 8 }}>Standard Mock</h3>
                <p style={{ fontSize: 12, color: "rgb(var(--text-muted))", fontFamily: mono, lineHeight: 1.5, marginBottom: 20 }}>
                  A rigorous 10-question gauntlet: 9 advanced multiple-choice questions followed by 1 interactive Grandmaster coding challenge.
                </p>
              </div>
              <button
                onClick={handleStart}
                disabled={startInterview.isPending || !selectedResumeId}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10, border: "none",
                  background: (startInterview.isPending || !selectedResumeId) ? "var(--glass-bg)" : "linear-gradient(135deg, #ea580c, #d97706)",
                  color: (startInterview.isPending || !selectedResumeId) ? "rgb(var(--text-muted))" : "rgb(var(--text-primary))", fontSize: 13,
                  fontFamily: mono, cursor: (startInterview.isPending || !selectedResumeId) ? "not-allowed" : "pointer", fontWeight: 700,
                  boxShadow: (startInterview.isPending || !selectedResumeId) ? "none" : "0 4px 16px rgba(234,88,12,0.3)",
                  transition: "all 0.2s"
                }}
              >
                {startInterview.isPending ? "Starting..." : !selectedResumeId ? "Select Resume First" : "Start Standard"}
              </button>
            </div>
          </div>

          {/* AI Agent Mock */}
          <div style={{
            background: "rgba(var(--glass-bg-rgb),0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              height: 140,
              background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden"
            }}>
              <img src="/images/interview_ai_banner.png" alt="AI Agent" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, marginBottom: 8 }}>1-on-1 AI Agent</h3>
                <p style={{ fontSize: 12, color: "rgb(var(--text-muted))", fontFamily: mono, lineHeight: 1.5, marginBottom: 20 }}>
                  A completely immersive verbal and collaborative technical interview with an autonomous AI recruiter.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10, border: "1px solid var(--border-subtle)",
                  background: "var(--glass-bg)", color: "rgb(var(--text-primary))", fontSize: 13,
                  fontFamily: mono, cursor: "pointer", fontWeight: 700, transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(var(--glass-bg-rgb),0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg)"
                }}
              >
                Start AI Agent
              </button>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, marginTop: 24, marginBottom: -4, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
          Past Interviews
        </h2>

        {/* ── Saved Interviews Grid ── */}
        {isLoading ? (
          <p style={{ color: "rgb(var(--text-muted))", fontFamily: mono, fontSize: 12, textAlign: "center", marginTop: 40 }}>Loading your sessions...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
            {interviews?.length === 0 && (
              <p style={{ color: "rgb(var(--text-muted))", fontFamily: mono, fontSize: 12, gridColumn: "1 / -1", textAlign: "center", marginTop: 40 }}>
                No past interviews found. Select a resume and start one!
              </p>
            )}
            {interviews?.map((interview: Interview) => (
              <div
                key={interview.id}
                onClick={() => router.push(`/resume/interview/${interview.id}`)}
                style={{
                  background: "var(--glass-bg)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, padding: 20,
                  cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(234,88,12,0.5)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, margin: "0 0 4px" }}>
                      {interview.resume?.profileName || "Deleted Profile"}
                    </h3>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgb(var(--bg-surface))", color: "rgb(var(--text-secondary))", fontFamily: mono }}>
                      {interview.resume?.targetRole || "General Target"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {interview.status === "COMPLETED" && interview.score != null ? (
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(var(--border-subtle-rgb),0.08)",
                        color: interview.score >= 80 ? "#10b981" : interview.score >= 60 ? "#eab308" : "#ef4444",
                        border: "1px solid rgba(var(--border-subtle-rgb),0.18)",
                        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                        fontFamily: mono, fontWeight: 800, fontSize: 13
                      }}>
                        {interview.score}
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#eab30815", color: "#eab308", border: "1px solid #eab30830", fontFamily: mono }}>
                        IN PROGRESS
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Delete this interview?")) deleteInterview.mutate(interview.id)
                      }}
                      disabled={deleteInterview.isPending}
                      style={{
                        background: "none", border: "none", color: "#ef4444", cursor: "pointer",
                        padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0.6, transition: "opacity 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                      title="Delete Interview"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 11, color: "#5a5780", margin: 0, fontFamily: mono }}>
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </p>
                  <span style={{ fontSize: 11, color: "#a09dc0", fontFamily: mono }}>
                    {(interview.questions || []).filter((q: any) => q.score != null).length} / {(interview.questions || []).length} Ans
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(23, 18, 16, 0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div className="bg-base">
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(234,88,12,0.1)",
              color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 24, border: "1px solid rgba(234,88,12,0.2)"
            }}>
              🚧
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "rgb(var(--text-primary))", fontFamily: mono, marginBottom: 8 }}>
              Coming Soon
            </h3>
            <p style={{ fontSize: 13, color: "rgb(var(--text-muted))", fontFamily: mono, lineHeight: 1.5, marginBottom: 24 }}>
              The 1-on-1 AI autonomous voice recruiter is currently in active development. Check back soon!
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 12, fontSize: 13,
                fontFamily: mono, cursor: "pointer", fontWeight: 600,
                background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                color: "rgb(var(--text-primary))", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(var(--glass-bg-rgb),0.1)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--glass-bg)"
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

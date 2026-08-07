"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useResumes, useInterviews, useStartInterview, useDeleteInterview } from "@/hooks/useResume"
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

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")

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

  if (!hydrated || !token) return null

  return (
    <main style={{ minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fdf6f0", fontFamily: mono, margin: 0 }}>Interview Hub</h1>
            <p style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4, fontFamily: mono }}>
              Practice mock interviews based on your specific resumes
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,237,213,0.05)", padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,180,120,0.14)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <span style={{ fontSize: 12, color: "#d4a373", fontFamily: mono }}>Target Resume:</span>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              disabled={resumesLoading || startInterview.isPending}
              style={{
                background: "#1c1712",
                border: "1px solid rgba(255,180,120,0.14)",
                color: "#fdf6f0",
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
              onClick={handleStart}
              disabled={startInterview.isPending || !selectedResumeId}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(253,186,116,0.45)",
                background: "rgba(217,119,6,0.18)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fed7aa", fontSize: 12,
                fontFamily: mono, cursor: "pointer", fontWeight: 600, flexShrink: 0,
              }}
            >
              {startInterview.isPending ? "Starting..." : "Start Interview"}
            </button>
          </div>
        </div>

        {/* ── Saved Interviews Grid ── */}
        {isLoading ? (
          <p style={{ color: "#8a7a6a", fontFamily: mono, fontSize: 12, textAlign: "center", marginTop: 40 }}>Loading your sessions...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
            {interviews?.length === 0 && (
              <p style={{ color: "#8a7a6a", fontFamily: mono, fontSize: 12, gridColumn: "1 / -1", textAlign: "center", marginTop: 40 }}>
                No past interviews found. Select a resume and start one!
              </p>
            )}
            {interviews?.map((interview: Interview) => (
              <div
                key={interview.id}
                onClick={() => router.push(`/resume/interview/${interview.id}`)}
                style={{
                  background: "rgba(255,237,213,0.05)", border: "1px solid rgba(255,180,120,0.14)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, padding: 20,
                  cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(234,88,12,0.5)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,180,120,0.14)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fdf6f0", fontFamily: mono, margin: "0 0 4px" }}>
                      {interview.resume?.profileName || "Deleted Profile"}
                    </h3>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#1c1712", color: "#d4a373", fontFamily: mono }}>
                      {interview.resume?.targetRole || "General Target"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {interview.status === "COMPLETED" && interview.score != null ? (
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(255,180,120,0.08)",
                        color: interview.score >= 80 ? "#10b981" : interview.score >= 60 ? "#eab308" : "#ef4444",
                        border: "1px solid rgba(255,180,120,0.18)",
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
                    {interview.questions.filter(q => q.score != null).length} / {interview.questions.length} Ans
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

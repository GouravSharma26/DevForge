"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useResume, useStartInterview, useDeleteResume, useForkResume, useJDMatches, useCreateJDMatch, useUploadJDMatch } from "@/hooks/useResume"

const mono = "JetBrains Mono, monospace"
const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#eab308" : "#ef4444"
const scoreGrad  = (s: number) => s >= 80 ? "linear-gradient(90deg, #10b981, #059669)" : s >= 60 ? "linear-gradient(90deg, #eab308, #ca8a04)" : "linear-gradient(90deg, #ef4444, #dc2626)"

export default function ResumeDetailView() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: resume, isLoading } = useResume(id)
  const { data: jdMatches = [], isLoading: jdMatchesLoading } = useJDMatches(id)

  const startInterview = useStartInterview()
  const deleteResume = useDeleteResume()
  const forkResume = useForkResume()
  const createJDMatch = useCreateJDMatch()
  const uploadJDMatch = useUploadJDMatch()

  const [jdModalOpen, setJdModalOpen] = useState(false)
  const [jdTab, setJdTab] = useState<"text" | "pdf">("text")
  const [jdText, setJdText] = useState("")
  const [jdFile, setJdFile] = useState<File | null>(null)

  async function handleRunJDMatch() {
    if (jdTab === "text") {
      if (!jdText.trim()) return alert("Please paste a job description first")
      try {
        await createJDMatch.mutateAsync({ resumeId: id, jdText: jdText.trim() })
        setJdModalOpen(false)
        setJdText("")
      } catch (err: any) {
        alert("JD Match failed: " + err.message)
      }
    } else {
      if (!jdFile) return alert("Please select a PDF file first")
      try {
        const formData = new FormData()
        formData.append("file", jdFile)
        await uploadJDMatch.mutateAsync({ resumeId: id, formData })
        setJdModalOpen(false)
        setJdFile(null)
      } catch (err: any) {
        alert("JD Match Upload failed: " + err.message)
      }
    }
  }

  async function handleStartInterview() {
    if (!resume) return
    const interview = await startInterview.mutateAsync(resume.id)
    router.push(`/resume/interview/${interview.id}`)
  }

  async function handleDelete() {
    if (!confirm("Delete this resume profile? This cannot be undone.")) return
    await deleteResume.mutateAsync(id)
    router.push("/resume")
  }

  async function handleFork() {
    if (!resume) return
    const defaultName = `${resume.profileName} (Copy)`
    const newName = prompt("Enter new profile name:", defaultName)
    if (!newName || !newName.trim()) {
      if (newName !== null) alert("Profile name is required.")
      return
    }
    const forked = await forkResume.mutateAsync({ id, profileName: newName.trim() })
    router.push(`/resume/${forked.id}`)
  }

  if (isLoading) return <div style={{ minHeight: "100vh", padding: 40, color: "#fdf6f0", fontFamily: mono }}>Loading profile...</div>
  if (!resume) return <div style={{ minHeight: "100vh", padding: 40, color: "#fdf6f0", fontFamily: mono }}>Resume profile not found.</div>

  return (
    <main style={{ minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Navigation */}
        <button onClick={() => router.push("/resume")} style={{ background: "none", border: "none", color: "#8a7a6a", fontFamily: mono, cursor: "pointer", textAlign: "left", fontSize: 13, padding: 0 }}>
          ← Back to Hub
        </button>

        {/* Profile Header */}
        <div style={{ background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 20, color: "#fdf6f0", fontFamily: mono, margin: "0 0 8px" }}>{resume.profileName}</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#ea580c15", color: "#f59e0b", border: "1px solid #ea580c30", fontFamily: mono }}>
                {resume.experienceLevel}
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#1c1712", color: "#d4a373", fontFamily: mono }}>
                {resume.targetRole || "General"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: scoreColor(resume.score), fontFamily: mono }}>
              {resume.score}<span style={{ fontSize: 14, color: "#8a7a6a" }}>/100</span>
            </span>
            <button onClick={handleFork} disabled={forkResume.isPending} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(253,186,116,0.45)", background: "rgba(217,119,6,0.18)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fed7aa", cursor: "pointer", fontFamily: mono, fontSize: 13 }}>
              Fork
            </button>
            <button onClick={handleDelete} disabled={deleteResume.isPending} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ef444430", background: "rgba(239,68,68,0.1)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#ef4444", cursor: "pointer" }}>
              🗑
            </button>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{ background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 11, color: "#8a7a6a", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Score Breakdown</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Skills Relevance",  score: resume.skillsScore },
              { label: "Project Impact",     score: resume.projectsScore },
              { label: "Writing Quality",    score: resume.writingScore },
              { label: "ATS Compatibility",  score: resume.atsScore },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#8a7a6a", fontFamily: mono }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(item.score), fontFamily: mono }}>{item.score}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,237,213,0.05)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: scoreGrad(item.score), width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── NEW: JD Matching Section ─── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, color: "#fdf6f0", fontFamily: mono, margin: 0 }}>Job Description Matches</h2>
            <button 
              onClick={() => setJdModalOpen(true)}
              style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(217,119,6,0.18)", border: "1px solid rgba(253,186,116,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fed7aa", cursor: "pointer", fontFamily: mono, fontSize: 12, fontWeight: 600 }}
            >
              + New Match
            </button>
          </div>

          {jdMatchesLoading ? (
            <div style={{ color: "#d4a373", fontSize: 13, fontFamily: mono }}>Loading history...</div>
          ) : jdMatches.length === 0 ? (
            <div style={{ color: "#8a7a6a", fontSize: 13, fontFamily: mono, padding: "20px 0" }}>No matches yet. Run your first match to see how this resume performs!</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {jdMatches.map((m: any) => (
                <div key={m.id} style={{ background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 15, color: "#fdf6f0", fontFamily: mono }}>{m.jobTitle}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#d4a373", fontFamily: mono }}>{m.companyName}</p>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(m.matchScore), fontFamily: mono }}>
                      {m.matchScore}%
                    </span>
                  </div>
                  
                  {m.matchedKeywords.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: "#10b981", fontFamily: mono, display: "block", marginBottom: 6 }}>MATCHED SKILLS</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.matchedKeywords.map((k: string, i: number) => (
                          <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#10b98115", color: "#10b981", borderRadius: 4, border: "1px solid #10b98130" }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.missingKeywords.length > 0 && (
                    <div style={{ marginBottom: m.cultureFlags?.length > 0 ? 10 : 0 }}>
                      <span style={{ fontSize: 11, color: "#ef4444", fontFamily: mono, display: "block", marginBottom: 6 }}>MISSING SKILLS</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.missingKeywords.map((k: string, i: number) => (
                          <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#ef444415", color: "#ef4444", borderRadius: 4, border: "1px solid #ef444430" }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.cultureFlags && m.cultureFlags.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,180,120,0.14)" }}>
                      <span style={{ fontSize: 11, color: "#d4a373", fontFamily: mono, display: "block", marginBottom: 8 }}>CULTURE / VIBE CHECK</span>
                      <div style={{ display: "grid", gap: 8 }}>
                        {m.cultureFlags.map((flag: any, i: number) => {
                          const color = flag.severity === "high" ? "#ef4444" : flag.severity === "medium" ? "#eab308" : "#d4a373"
                          return (
                            <div key={i} style={{ background: "#1c1712", border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "8px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#fdf6f0", fontFamily: "sans-serif" }}>{flag.flag}</span>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${color}15`, color, fontFamily: mono, textTransform: "uppercase" }}>{flag.severity}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: "#8a7a6a", fontStyle: "italic", lineHeight: 1.4 }}>"{flag.quote}"</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ... (Keep the rest of the Skills/Suggestions/CTA code provided in the previous turn here) */}
      </div>

      {/* JD Modal */}
      {jdModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(23,18,16,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 600 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#fdf6f0", fontFamily: mono }}>Run Job Description Match</h2>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button 
                onClick={() => setJdTab("text")}
                style={{ padding: "6px 12px", borderRadius: 6, background: jdTab === "text" ? "#ea580c" : "transparent", color: jdTab === "text" ? "#fff" : "#d4a373", border: jdTab === "text" ? "none" : "1px solid rgba(255,180,120,0.14)", cursor: "pointer", fontFamily: mono, fontSize: 13 }}
              >
                Paste Text
              </button>
              <button 
                onClick={() => setJdTab("pdf")}
                style={{ padding: "6px 12px", borderRadius: 6, background: jdTab === "pdf" ? "#ea580c" : "transparent", color: jdTab === "pdf" ? "#fff" : "#d4a373", border: jdTab === "pdf" ? "none" : "1px solid rgba(255,180,120,0.14)", cursor: "pointer", fontFamily: mono, fontSize: 13 }}
              >
                Upload PDF
              </button>
            </div>

            {jdTab === "text" ? (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the raw text of the job description here..."
                style={{ width: "100%", height: 300, background: "#171210", border: "1px solid rgba(255,180,120,0.14)", borderRadius: 8, padding: 12, color: "#fdf6f0", fontFamily: "sans-serif", fontSize: 14, resize: "none", marginBottom: 16 }}
              />
            ) : (
              <div style={{ width: "100%", height: 300, background: "#171210", border: "1px dashed rgba(255,180,120,0.14)", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  style={{ color: "#fdf6f0", fontFamily: mono, fontSize: 13 }}
                />
                {jdFile && <p style={{ color: "#10b981", fontFamily: mono, fontSize: 12, marginTop: 12 }}>Selected: {jdFile.name}</p>}
                <p style={{ color: "#8a7a6a", fontFamily: mono, fontSize: 12, marginTop: 8 }}>Max size: 5MB</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setJdModalOpen(false)} disabled={createJDMatch.isPending || uploadJDMatch.isPending} style={{ padding: "8px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(255,180,120,0.14)", color: "#d4a373", cursor: "pointer", fontFamily: mono }}>
                Cancel
              </button>
              <button onClick={handleRunJDMatch} disabled={createJDMatch.isPending || uploadJDMatch.isPending} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(217,119,6,0.18)", border: "1px solid rgba(253,186,116,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#fed7aa", cursor: "pointer", fontFamily: mono, fontWeight: 600 }}>
                {createJDMatch.isPending || uploadJDMatch.isPending ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
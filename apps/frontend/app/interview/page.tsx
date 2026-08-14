"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useResumes, useInterviews, useStartInterview, useDeleteInterview, useUploadResume } from "@/hooks/useResume"
import { Plus, ChevronDown, Bot, Code2, Trash2 } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import type { Interview, Resume } from "@devforge/shared-types"

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
  const [showResumeSelectModal, setShowResumeSelectModal] = useState(false)

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
      console.error(err)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!hydrated || !token) return null

  return (
    <main className="min-h-[calc(100vh-56px)] font-mono text-[var(--color-text-primary)] relative">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 500px at 50% 0%, var(--glass-border), transparent 70%)' }} />

      <div className="max-w-[860px] mx-auto py-8 px-6 flex flex-col gap-6 relative z-10">

        {/* ── Header ── */}
        <div className="flex justify-between items-end flex-wrap gap-4 fade-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h1 className="text-[24px] font-extrabold m-0 text-[var(--color-text-primary)]">Interview Hub</h1>
            <p className="text-[13px] text-[var(--color-muted)] mt-1">
              Practice mock interviews based on your specific resumes
            </p>
          </div>
          
          <div className="flex items-center gap-3 glass-panel px-3 py-2 rounded-[14px]">
            <span className="text-[12px] text-[var(--color-text-secondary)] font-semibold ml-1">Target:</span>
            
            <button
              onClick={() => setShowResumeSelectModal(true)}
              disabled={resumesLoading || startInterview.isPending}
              className="flex items-center justify-between gap-3 bg-[var(--color-surface-theme)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-[8px] text-[12px] outline-none cursor-pointer min-w-[240px] hover:border-[var(--color-accent)] transition-colors disabled:opacity-50 text-left line-clamp-1"
            >
              <span className="truncate flex-1">
                {resumes?.find((r) => r.id === selectedResumeId)
                  ? `${resumes.find((r) => r.id === selectedResumeId)?.profileName} ${resumes.find((r) => r.id === selectedResumeId)?.targetRole ? `(${resumes.find((r) => r.id === selectedResumeId)?.targetRole})` : ""}`
                  : "Select a profile..."}
              </span>
              <ChevronDown size={14} className="text-[var(--color-muted)] shrink-0" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadResume.isPending}
              title="Upload New Resume"
              className="w-8 h-8 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-theme)] text-[var(--color-accent)] flex items-center justify-center cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-card)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              className="hidden"
            />
          </div>
        </div>

        {/* ── Interview Types ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 fade-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Standard Mock */}
          <div className="glass-panel rounded-[16px] overflow-hidden flex flex-col group transition-all hover:border-[var(--color-accent)] hover:-translate-y-1">
            <div className="h-[140px] border-b border-[var(--color-border)] flex items-center justify-center overflow-hidden relative">
              <img src="/images/interview_standard_banner.png" alt="Standard Mock" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] mb-2">Standard Mock</h3>
                <p className="text-[12px] text-[var(--color-muted)] leading-relaxed mb-5">
                  A rigorous 10-question gauntlet: 9 advanced multiple-choice questions followed by 1 interactive Grandmaster coding challenge.
                </p>
              </div>
              <button
                onClick={handleStart}
                disabled={startInterview.isPending || !selectedResumeId}
                className="w-full py-2.5 rounded-[10px] font-bold text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:hover:shadow-none"
              >
                {startInterview.isPending ? "Starting..." : !selectedResumeId ? "Select Resume First" : "Start Standard"}
              </button>
            </div>
          </div>

          {/* AI Agent Mock */}
          <div className="glass-panel rounded-[16px] overflow-hidden flex flex-col group transition-all hover:border-[var(--color-border)] hover:-translate-y-1">
            <div className="h-[140px] border-b border-[var(--color-border)] flex items-center justify-center overflow-hidden relative">
              <img src="/images/interview_ai_banner.png" alt="AI Agent" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] mb-2">1-on-1 AI Agent</h3>
                <p className="text-[12px] text-[var(--color-muted)] leading-relaxed mb-5">
                  A completely immersive verbal and collaborative technical interview with an autonomous AI recruiter.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2.5 rounded-[10px] font-bold text-[13px] transition-all border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] hover:border-[#10b981] hover:text-[#10b981]"
              >
                Start AI Agent
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] mt-6 -mb-1 border-b border-[var(--color-border)] pb-3 fade-up" style={{ animationDelay: '0.3s' }}>
          Past Interviews
        </h2>

        {/* ── Saved Interviews Grid ── */}
        {isLoading ? (
          <p className="text-[var(--color-muted)] text-[12px] text-center mt-10">Loading your sessions...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 fade-up" style={{ animationDelay: '0.4s' }}>
            {interviews?.length === 0 && (
              <p className="text-[var(--color-muted)] text-[12px] col-span-full text-center mt-10">
                No past interviews found. Select a resume and start one!
              </p>
            )}
            {interviews?.map((interview: Interview) => (
              <div
                key={interview.id}
                onClick={() => router.push(`/resume/interview/${interview.id}`)}
                className="glass-panel rounded-[16px] p-5 cursor-pointer flex flex-col justify-between transition-all hover:border-[var(--color-accent)] hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] m-0 mb-1 line-clamp-1">
                      {interview.resume?.profileName || "Deleted Profile"}
                    </h3>
                    <span className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--color-surface-theme)] text-[var(--color-text-secondary)] border border-[var(--color-border)] inline-block">
                      {interview.resume?.targetRole || "General Target"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {interview.status === "COMPLETED" && interview.score != null ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[13px] border border-[var(--color-border)] bg-[var(--color-card)] ${interview.score >= 80 ? 'text-[#10b981]' : interview.score >= 60 ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                        {interview.score}
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-[6px] bg-[#eab30815] text-[#eab308] border border-[#eab30830]">
                        IN PROGRESS
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Delete this interview?")) deleteInterview.mutate(interview.id)
                      }}
                      disabled={deleteInterview.isPending}
                      className="text-[#ef4444] opacity-40 hover:opacity-100 transition-opacity p-1"
                      title="Delete Interview"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[11px] text-[var(--color-muted)] m-0">
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-[11px] text-[var(--color-muted)] font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel bg-[var(--color-surface-theme)] border-[var(--color-accent)] rounded-[20px] p-8 max-w-[400px] w-full text-center shadow-[0_0_40px_rgba(234,88,12,0.15)] animate-fade-in-up">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-card)] text-[var(--color-accent)] border border-[var(--color-accent)] flex items-center justify-center mb-5 text-[24px]">
              🚧
            </div>
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] mb-2">
              Coming Soon
            </h3>
            <p className="text-[13px] text-[var(--color-muted)] leading-relaxed mb-6">
              The 1-on-1 AI autonomous voice recruiter is currently in active development. Check back soon!
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-[12px] text-[13px] font-bold cursor-pointer transition-all border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Resume Select Modal */}
      {showResumeSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowResumeSelectModal(false)}>
          <div className="glass-panel bg-[var(--color-surface-theme)] border-[var(--color-border)] rounded-[20px] p-6 max-w-[500px] w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-[var(--color-text-primary)]">Select Resume</h3>
              <button onClick={() => setShowResumeSelectModal(false)} className="text-[var(--color-muted)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {resumes?.map((res) => (
                <div 
                  key={res.id}
                  onClick={() => {
                    setSelectedResumeId(res.id)
                    setShowResumeSelectModal(false)
                  }}
                  className={`p-4 rounded-[12px] border cursor-pointer transition-all flex justify-between items-center group ${selectedResumeId === res.id ? 'border-[var(--color-accent)] bg-[rgba(234,88,12,0.05)]' : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]'}`}
                >
                  <div>
                    <div className="text-[14px] font-bold text-[var(--color-text-primary)] mb-1">{res.profileName}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">{res.targetRole || "General"}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {res.atsScore != null && (
                      <div className={`text-[12px] font-bold px-2.5 py-1 rounded-[6px] border ${res.atsScore >= 80 ? 'text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10' : res.atsScore >= 60 ? 'text-[#eab308] border-[#eab308]/30 bg-[#eab308]/10' : 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10'}`}>
                        ATS: {res.atsScore}
                      </div>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedResumeId === res.id ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'}`}>
                      {selectedResumeId === res.id && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {resumes?.length === 0 && (
                <div className="text-[12px] text-[var(--color-muted)] text-center py-6">
                  No resumes found. Upload one to get started.
                </div>
              )}
            </div>
            
            <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => {
                  setShowResumeSelectModal(false)
                  fileInputRef.current?.click()
                }}
                className="py-2 px-4 rounded-[8px] text-[12px] font-bold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
              >
                + Upload New
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

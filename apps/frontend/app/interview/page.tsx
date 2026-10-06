"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useResumes, useInterviews, useStartInterview, useDeleteInterview, useUploadResume, useRenameInterview } from "@/hooks/useResume"
import { Plus, ChevronDown, Bot, Code2, Trash2, Edit2, Download, Clock, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAuthStore } from "@/store/auth.store"
import { toast } from "sonner"
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
  const [showDurationModal, setShowDurationModal] = useState(false)
  
  const renameInterview = useRenameInterview()

  const handleDownload = (interview: any) => {
    const data = JSON.stringify(interview, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interview-report-${interview.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Auto-select the first resume if none selected
  useEffect(() => {
    const timer = setTimeout(() => {
      if (resumes && resumes.length > 0 && !selectedResumeId) {
        setSelectedResumeId(resumes[0].id)
      }
    }, 0)
    return () => clearTimeout(timer)
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
      return toast.error("Only PDF files are supported at this time.")
    }
    
    const toastId = toast.loading("Uploading & Scoring Resume...", { 
      description: "We are analyzing your resume to tailor the interview. This may take a few seconds." 
    })
    
    try {
      const newResume = await uploadResume.mutateAsync({ file, skipAI: false })
      if (newResume && newResume.id) {
        setSelectedResumeId(newResume.id)
        toast.success("Resume scored successfully!", { id: toastId })
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to upload resume. Please try again.", { id: toastId })
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
              {uploadResume.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
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
                onClick={() => {
                  if (!selectedResumeId) return alert("Please select a resume first")
                  setShowDurationModal(true)
                }}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {[1,2,3].map(i => (
               <Skeleton key={i} className="h-32 rounded-[16px]" />
            ))}
          </div>
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
                className="glass-panel rounded-[16px] p-5 cursor-pointer flex flex-col justify-between transition-all duration-300 hover:border-[var(--color-accent)] hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgba(234,88,12,0.12)] group bg-gradient-to-br from-[var(--color-surface-theme)] to-transparent relative overflow-hidden"
              >
                {/* Subtle gradient orb in background */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--color-accent)] opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full pointer-events-none" />

                <div className="flex justify-between items-start mb-4 gap-2 relative z-10">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-extrabold text-[var(--color-text-primary)] m-0 mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                      {interview.title || interview.resume?.profileName || "Untitled Interview"}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--color-surface-theme)] text-[var(--color-text-secondary)] border border-[var(--color-border)] inline-block whitespace-nowrap truncate max-w-[120px] shadow-sm" title={interview.resume?.targetRole || "General Target"}>
                        {interview.resume?.targetRole || "General Target"}
                      </span>
                      {interview.type === "AI_AGENT" ? (
                        <span className="text-[10px] px-2 py-1 rounded-[6px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold">
                          <Bot size={10} />
                          1-on-1 AI
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-[6px] bg-blue-500/10 text-blue-500 border border-blue-500/20 inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold">
                          <Code2 size={10} />
                          Standard Mock
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                    {interview.status === "COMPLETED" && interview.score != null ? (
                      <div 
                        title={`Score: ${interview.score}/100`}
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[12px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm ${interview.score >= 80 ? 'text-[#10b981] border-[#10b981]/30 shadow-[#10b981]/20' : interview.score >= 60 ? 'text-[#eab308] border-[#eab308]/30 shadow-[#eab308]/20' : 'text-[#ef4444] border-[#ef4444]/30 shadow-[#ef4444]/20'}`}
                      >
                        {interview.score}
                      </div>
                    ) : (
                      <div title="In Progress" className="w-9 h-9 rounded-full flex items-center justify-center border border-[#eab30840] bg-[#eab30815] text-[#eab308] shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        <Clock size={16} className="animate-[spin_4s_linear_infinite]" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 ml-1 bg-[var(--color-surface-theme)] rounded-lg p-0.5 border border-transparent group-hover:border-[var(--color-border)] transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newTitle = prompt("Enter new title:", interview.title || interview.resume?.profileName)
                          if (newTitle) renameInterview.mutate({ id: interview.id, title: newTitle })
                        }}
                        disabled={renameInterview.isPending}
                        className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-accent)] hover:bg-[var(--color-card)] rounded-md transition-all p-1.5"
                        title="Rename Interview"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(interview)
                        }}
                        className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 hover:text-blue-400 hover:bg-[var(--color-card)] rounded-md transition-all p-1.5"
                        title="Download Report"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm("Delete this interview?")) deleteInterview.mutate(interview.id)
                        }}
                        disabled={deleteInterview.isPending}
                        className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-md transition-all p-1.5"
                        title="Delete Interview"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]/50 relative z-10">
                  <p className="text-[11px] text-[var(--color-muted)] font-medium m-0 flex items-center gap-1.5">
                    <Clock size={12} className="opacity-50" />
                    {new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-semibold bg-[var(--color-surface-theme)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                    {(interview.questions || []).filter((q: any) => q.score != null).length} / {(interview.questions || []).length} Ans
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duration Select Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowDurationModal(false)}>
          <div className="glass-panel bg-[var(--color-surface-theme)] border-[var(--color-border)] rounded-[20px] p-6 max-w-[400px] w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-[var(--color-text-primary)]">Interview Duration</h3>
              <button onClick={() => setShowDurationModal(false)} className="text-[var(--color-muted)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <p className="text-[13px] text-[var(--color-muted)] mb-6">Select how long you want your 1-on-1 AI agent mock interview to last.</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push(`/interview/agent?resumeId=${selectedResumeId}&duration=5`)}
                className="py-4 rounded-[12px] font-bold border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[#10b981] hover:text-[#10b981] transition-all"
              >
                5 Minutes
              </button>
              <button
                onClick={() => router.push(`/interview/agent?resumeId=${selectedResumeId}&duration=10`)}
                className="py-4 rounded-[12px] font-bold border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[#10b981] hover:text-[#10b981] transition-all"
              >
                10 Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
          <div className="glass-panel bg-[#121316] border border-accent/20 rounded-3xl p-8 max-w-[420px] w-full text-center shadow-[0_0_50px_rgba(234,88,12,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-highlight background-animate" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-accent/20 blur-3xl pointer-events-none" />
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-theme border border-border flex items-center justify-center mb-6 shadow-xl group">
                <Bot size={28} className="text-accent group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 font-mono">
                System Offline
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-8">
                The AI Agent voice protocol is currently receiving critical security updates. It will be re-enabled in a future patch.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all border border-border bg-surface-theme text-primary hover:bg-card hover:text-white"
                >
                  Understood
                </button>
              </div>
            </div>
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

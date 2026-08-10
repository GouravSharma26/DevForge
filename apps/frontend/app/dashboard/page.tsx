"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, Crown, Mic, Puzzle, Zap, FileText, Route } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { useResumes, useInterviews } from "@/hooks/useResume"

export default function DashboardPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)

  const { data: resumes, isLoading: resumesLoading } = useResumes()
  const { data: interviews, isLoading: interviewsLoading } = useInterviews()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token || !mounted) return null

  // Process data from existing backend hooks
  const completedInterviews = interviews?.filter((i: any) => i.status === "COMPLETED") || []
  
  // Same calculation logic the old dashboard used for the raw average score:
  const avgScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc: number, i: any) => acc + (i.score || 0), 0) / completedInterviews.length)
    : 0
    
  // Use avgScore as readiness percentage
  const readinessScore = avgScore
  const lastInterviewScore = completedInterviews.length > 0 ? completedInterviews[0].score : 0
  const activeResumesCount = resumes?.length || 0
  const interviewsCount = interviews?.length || 0
  
  // Format dates for log
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[d.getMonth()]} ${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // Calculate gauge SVG dash offset based on percentage
  const circumference = 452.4 // 2 * pi * 72
  const dashOffset = circumference - (readinessScore / 100) * circumference

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 500px at 80% -10%, rgba(234,88,12,0.08), transparent 60%)' }} />
      
      <main className="relative z-10 px-10 pt-8 pb-16 max-w-[1180px] font-mono text-[#fdf6f0] selection:bg-[#ea580c]/30">
        
        <div className="flex justify-between items-start mb-7">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.01em] mb-1">Welcome back, {user?.username || "Developer"}</h1>
            <p className="text-[13px] text-[#8a7a6a]">Your forge has been idle for 2 days — the readiness score is still holding.</p>
          </div>
          <div className="flex items-center gap-2 bg-[rgba(255,237,213,0.05)] border border-[rgba(255,180,120,0.14)] px-3.5 py-2 rounded-[10px] text-[12px]">
            <Flame size={14} className="text-[#ea580c]" /> {user?.streak || 0}-day streak
          </div>
        </div>

        {/* ── Signature element: Forge Heat Gauge ── */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0 bg-[rgba(255,237,213,0.05)] backdrop-blur-[16px] border border-[rgba(255,180,120,0.14)] rounded-[18px] overflow-hidden mb-6">
          <div className="p-7.5 flex flex-col items-center justify-center border-r border-[rgba(255,180,120,0.14)] relative p-8">
            <div className="text-[11px] text-[#8a7a6a] uppercase tracking-[0.06em] mb-3.5">Interview Readiness</div>
            <div className="relative w-[168px] h-[168px]">
              <svg width="168" height="168" viewBox="0 0 168 168">
                <circle cx="84" cy="84" r="72" fill="none" stroke="rgba(255,180,120,0.1)" strokeWidth="10"/>
                <circle cx="84" cy="84" r="72" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  transform="rotate(-90 84 84)"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c"/>
                    <stop offset="100%" stopColor="#f59e0b"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[34px] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#ea580c] to-[#f59e0b] leading-none">
                  {readinessScore}%
                </div>
                <div className="text-[10.5px] text-[#8a7a6a] mt-1">
                  {readinessScore > 80 ? "Hot enough to interview" : "Requires practice"}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-4.5">
              <div className="text-[9.5px] px-2 py-0.5 rounded-full border border-[rgba(234,88,12,0.4)] text-[#f59e0b]">↑ Based on {completedInterviews.length} sessions</div>
            </div>
          </div>

          <div className="p-6 md:p-[26px_30px]">
            <div className="flex justify-between items-baseline mb-4.5">
              <h2 className="text-[15px] font-bold">Next up in the forge</h2>
              <a href="/paths" className="text-[11.5px] text-[#ea580c] hover:underline">View full plan →</a>
            </div>
            <div className="flex flex-col gap-2">
              
              <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[rgba(255,180,120,0.14)] bg-[rgba(0,0,0,0.1)]">
                <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(234,88,12,0.1)] flex items-center justify-center shrink-0">
                  <Crown size={14} className="text-[#ea580c]" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold mb-0.5">Finish Grandmaster: Off-by-one hunt</div>
                  <div className="text-[11px] text-[#8a7a6a]">2 of 4 run attempts used — pick it back up</div>
                </div>
                <button onClick={() => router.push('/interview')} className="text-[11px] text-[#ea580c] font-bold">Resume →</button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[rgba(255,180,120,0.14)] bg-[rgba(0,0,0,0.1)]">
                <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(234,88,12,0.1)] flex items-center justify-center shrink-0">
                  <Mic size={14} className="text-[#ea580c]" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold mb-0.5">Round 3 mock interview — Senior Frontend</div>
                  <div className="text-[11px] text-[#8a7a6a]">Generated from your latest resume match</div>
                </div>
                <button onClick={() => router.push('/interview')} className="text-[11px] text-[#ea580c] font-bold">Start →</button>
              </div>

              {/* Explicitly flagged as missing backend endpoint */}
              <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[rgba(255,180,120,0.14)] bg-[rgba(0,0,0,0.1)] opacity-70">
                <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(234,88,12,0.1)] flex items-center justify-center shrink-0">
                  <Puzzle size={14} className="text-[#ea580c]" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold mb-0.5">Recommended DSA problems</div>
                  <div className="text-[11px] text-[#8a7a6a]">Feature unavailable: Recommendation engine endpoint missing</div>
                </div>
                <div className="text-[11px] text-[#8a7a6a]">Pending</div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Tools + Forge Log ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          <div className="bg-[rgba(255,237,213,0.05)] backdrop-blur-[16px] border border-[rgba(255,180,120,0.14)] rounded-[16px] p-[22px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13.5px] font-bold">Quick launch</h3>
              <span className="text-[11px] text-[#8a7a6a]">6 tools</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              <button onClick={() => router.push('/arena')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><Zap size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">PvP Arena</div>
                <div className="text-[10px] text-[#8a7a6a]">Live battles</div>
              </button>
              
              <button onClick={() => router.push('/resume')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><FileText size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Resumes</div>
                <div className="text-[10px] text-[#8a7a6a]">{resumesLoading ? "..." : activeResumesCount} profiles</div>
              </button>
              
              <button onClick={() => router.push('/interview')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><Crown size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Grandmaster</div>
                <div className="text-[10px] text-[#8a7a6a]">Sandbox mode</div>
              </button>
              
              <button onClick={() => router.push('/problems')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><Puzzle size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Problems</div>
                <div className="text-[10px] text-[#8a7a6a]">DSA Editor</div>
              </button>
              
              <button onClick={() => router.push('/interview')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><Mic size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Interview</div>
                <div className="text-[10px] text-[#8a7a6a]">{interviewsLoading ? "..." : interviewsCount} total</div>
              </button>
              
              <button onClick={() => router.push('/paths')} className="p-3 border border-[rgba(255,180,120,0.14)] rounded-[12px] text-center transition-all hover:border-[rgba(234,88,12,0.4)] hover:-translate-y-0.5 group">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[#ea580c] transition-all"><Route size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Paths</div>
                <div className="text-[10px] text-[#8a7a6a]">Tracks</div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="bg-[rgba(255,237,213,0.05)] border border-[rgba(255,180,120,0.14)] rounded-[14px] p-4">
                <div className="text-[10.5px] text-[#8a7a6a] uppercase tracking-[0.05em] mb-2.5">Resume match</div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-gradient-to-r from-[#ea580c] to-[#f59e0b] rounded-full" style={{ width: '0%' }}></div>
                </div>
                <div className="text-[20px] font-extrabold text-[#8a7a6a]">N/A <span className="text-[11px] font-medium opacity-70">/ 100</span></div>
                <div className="text-[9px] text-[#8a7a6a] mt-1 leading-tight">Global score API missing</div>
              </div>
              
              <div className="bg-[rgba(255,237,213,0.05)] border border-[rgba(255,180,120,0.14)] rounded-[14px] p-4">
                <div className="text-[10.5px] text-[#8a7a6a] uppercase tracking-[0.05em] mb-2.5">Last interview</div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-gradient-to-r from-[#ea580c] to-[#f59e0b] rounded-full" style={{ width: `${lastInterviewScore}%` }}></div>
                </div>
                <div className="text-[20px] font-extrabold">{lastInterviewScore} <span className="text-[11px] text-[#8a7a6a] font-medium">/ 100</span></div>
              </div>
              
              <div className="bg-[rgba(255,237,213,0.05)] border border-[rgba(255,180,120,0.14)] rounded-[14px] p-4">
                <div className="text-[10.5px] text-[#8a7a6a] uppercase tracking-[0.05em] mb-2.5">Arena rating</div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-gradient-to-r from-[#ea580c] to-[#f59e0b] rounded-full" style={{ width: '0%' }}></div>
                </div>
                <div className="text-[20px] font-extrabold text-[#8a7a6a]">--- <span className="text-[11px] font-medium opacity-70">ELO</span></div>
                <div className="text-[9px] text-[#8a7a6a] mt-1 leading-tight">ELO API missing</div>
              </div>
            </div>
          </div>

          <div className="bg-[rgba(255,237,213,0.05)] backdrop-blur-[16px] border border-[rgba(255,180,120,0.14)] rounded-[16px] p-[22px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13.5px] font-bold">Forge log</h3>
              <span className="text-[11px] text-[#8a7a6a]">Recent Activity</span>
            </div>
            
            <div className="flex flex-col">
              {completedInterviews.length > 0 ? (
                // Only populated with real data (interviews)
                completedInterviews.slice(0, 5).map((interview: any) => (
                  <div key={interview.id} className="flex gap-2.5 py-2.5 border-b border-[rgba(255,180,120,0.14)] last:border-0 text-[11.5px]">
                    <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${interview.score > 80 ? 'bg-[#10b981]' : interview.score > 60 ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`}></div>
                    <div>
                      <div className="font-semibold text-white">Mock Interview Protocol Graded — {interview.score}/100</div>
                      <div className="text-[#8a7a6a] text-[10.5px] mt-0.5">{interview.jobTitle || 'General Software Engineer'} · {formatDate(interview.createdAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[11.5px] text-[#8a7a6a] italic py-2">
                  No mock interviews completed yet.
                </div>
              )}
              
              {/* Visible fallback for missing unified activity log */}
              <div className="flex gap-2.5 py-2.5 border-t border-[rgba(255,180,120,0.14)] mt-2 text-[11.5px] opacity-60 bg-[rgba(0,0,0,0.2)] rounded px-2">
                <div className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 bg-[#8a7a6a]"></div>
                <div>
                  <div className="font-semibold text-[#8a7a6a]">System Note</div>
                  <div className="text-[#8a7a6a] text-[10.5px] mt-0.5">Resume edits and Arena battles are not yet tracked in the activity feed (API missing).</div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </main>
    </>
  )
}

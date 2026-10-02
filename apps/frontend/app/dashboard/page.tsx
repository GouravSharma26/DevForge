"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, Crown, Mic, Puzzle, Zap, FileText, Route } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { useResumes, useInterviews } from "@/hooks/useResume"
import { useMatchHistory } from "@/hooks/useArena"
import { useMe } from "@/hooks/useUser"
import { useRecommendedProblems } from "@/hooks/useProblems"

export default function DashboardPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const authUser = useAuthStore((s) => s.user)

  const { data: dbUser } = useMe()
  const user = dbUser || authUser

  const { data: resumes, isLoading: resumesLoading } = useResumes()
  const { data: interviews, isLoading: interviewsLoading } = useInterviews()
  const { data: matches, isLoading: matchesLoading } = useMatchHistory()
  const { data: recommendedProblems, isLoading: recommendedLoading } = useRecommendedProblems()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token || !mounted) return null

  // Process data from existing backend hooks
  const completedInterviews = interviews?.filter((i: any) => i.status === "COMPLETED") || []
  const completedMatches = matches || []
  const matchesPlayed = completedMatches.length
  const matchesWon = completedMatches.filter((m: any) => m.winnerId === user?.id).length
  const arenaWinRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0
  
  const avgScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc: number, i: any) => acc + (i.score || 0), 0) / completedInterviews.length)
    : 0
    
  const readinessScore = avgScore
  const lastInterviewScore = completedInterviews.length > 0 ? completedInterviews[0].score : 0
  const activeResumesCount = resumes?.length || 0
  const interviewsCount = interviews?.length || 0
  
  const avgResumeScore = resumes && resumes.length > 0 
    ? Math.round(resumes.reduce((acc: number, r: any) => acc + (r.atsScore || r.score || 0), 0) / resumes.length)
    : 0
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[d.getMonth()]} ${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const forgeLogActivities = [
    ...completedInterviews.map((i: any) => ({ ...i, type: 'INTERVIEW', date: new Date(i.createdAt) })),
    ...completedMatches.map((m: any) => ({ ...m, type: 'MATCH', date: new Date(m.endedAt || m.createdAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8)

  const circumference = 452.4
  const dashOffset = circumference - (readinessScore / 100) * circumference

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 500px at 80% -10%, var(--glass-border), transparent 60%)' }} />
      
      <main className="relative z-10 px-10 pt-8 pb-16 max-w-[1180px] font-mono text-[var(--color-text-primary)]">
        
        <div className="flex justify-between items-start mb-7 fade-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.01em] mb-1 text-[var(--color-text-primary)]">Welcome back, {user?.username || "Developer"}</h1>
            <p className="text-[13px] text-[var(--color-muted)]">Your forge has been idle for 2 days — the readiness score is still holding.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 glass-panel px-3.5 py-2 rounded-[10px] text-[12px]">
              <span className="font-bold text-[var(--color-text-primary)]">{user?.xp || 0}</span> <span className="text-[var(--color-muted)]">XP</span>
            </div>
            <div className="flex items-center gap-2 glass-panel px-3.5 py-2 rounded-[10px] text-[12px] text-[var(--color-text-primary)]">
              <Flame size={14} className="text-[var(--color-accent)]" /> {user?.streak || 0}-day streak
            </div>
          </div>
        </div>

        {/* ── Signature element: Forge Heat Gauge ── */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0 glass-panel rounded-[18px] overflow-hidden mb-6 fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-7.5 flex flex-col items-center justify-center border-r border-[var(--color-border)] relative p-8">
            <div className="text-[11px] text-[var(--color-muted)] uppercase tracking-[0.06em] mb-3.5">Interview Readiness</div>
            <div className="relative w-[168px] h-[168px]">
              <svg width="168" height="168" viewBox="0 0 168 168">
                <circle cx="84" cy="84" r="72" fill="none" stroke="var(--color-border)" strokeWidth="10"/>
                <circle cx="84" cy="84" r="72" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  transform="rotate(-90 84 84)"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-accent)"/>
                    <stop offset="100%" stopColor="var(--color-highlight)"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[34px] font-extrabold text-[var(--color-accent)] text-glow leading-none">
                  {readinessScore}%
                </div>
                <div className="text-[10.5px] text-[var(--color-muted)] mt-1">
                  {readinessScore > 80 ? "Hot enough to interview" : "Requires practice"}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-4.5">
              <div className="text-[9.5px] px-2 py-0.5 rounded-full border border-[var(--color-accent)] text-[var(--color-highlight)]">↑ Based on {completedInterviews.length} sessions</div>
            </div>
          </div>

          <div className="p-6 md:p-[26px_30px]">
            <div className="flex justify-between items-baseline mb-4.5">
              <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Next up in the forge</h2>
              <a href="/paths" className="text-[11.5px] text-[var(--color-accent)] hover:underline">View full plan →</a>
            </div>
            <div className="flex flex-col gap-2">
              
              <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all cursor-pointer" onClick={() => router.push('/interview')}>
                <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-surface-theme)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <Crown size={14} className="text-[var(--color-accent)]" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold mb-0.5 text-[var(--color-text-primary)]">Finish Grandmaster: Off-by-one hunt</div>
                  <div className="text-[11px] text-[var(--color-muted)]">2 of 4 run attempts used — pick it back up</div>
                </div>
                <button className="text-[11px] text-[var(--color-accent)] font-bold">Resume →</button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all cursor-pointer" onClick={() => router.push('/interview')}>
                <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-surface-theme)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <Mic size={14} className="text-[var(--color-accent)]" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold mb-0.5 text-[var(--color-text-primary)]">Round 3 mock interview — Senior Frontend</div>
                  <div className="text-[11px] text-[var(--color-muted)]">Generated from your latest resume match</div>
                </div>
                <button className="text-[11px] text-[var(--color-accent)] font-bold">Start →</button>
              </div>

              {/* Dynamic Recommended Problems */}
              {recommendedLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] opacity-70">
                  <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-surface-theme)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <Puzzle size={14} className="text-[var(--color-accent)] animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold mb-0.5 text-[var(--color-text-primary)]">Loading Recommendations...</div>
                    <div className="text-[11px] text-[var(--color-muted)]">Fetching from your forge history</div>
                  </div>
                </div>
              ) : recommendedProblems?.length > 0 ? (
                recommendedProblems.map((prob: any) => (
                  <div key={prob.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all cursor-pointer" onClick={() => router.push(`/problems/${prob.slug}`)}>
                    <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-surface-theme)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                      <Puzzle size={14} className="text-[var(--color-accent)]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold mb-0.5 text-[var(--color-text-primary)]">{prob.title}</div>
                      <div className="text-[11px] text-[var(--color-muted)]">Recommended DSA Problem • {prob.difficulty}</div>
                    </div>
                    <div className="text-[11px] text-[var(--color-accent)] font-bold">Solve →</div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] opacity-70">
                  <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-surface-theme)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <Crown size={14} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold mb-0.5 text-[var(--color-text-primary)]">All Recommended Problems Solved!</div>
                    <div className="text-[11px] text-[var(--color-muted)]">You're a true Grandmaster.</div>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)]">Completed</div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Tools + Forge Log ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          <div className="glass-panel rounded-[16px] p-[22px] fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13.5px] font-bold text-[var(--color-text-primary)]">Quick launch</h3>
              <span className="text-[11px] text-[var(--color-muted)]">6 tools</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              <button onClick={() => router.push('/arena')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><Zap size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">PvP Arena</div>
                <div className="text-[10px] text-[var(--color-muted)]">Live battles</div>
              </button>
              
              <button onClick={() => router.push('/resume')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><FileText size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Resumes</div>
                <div className="text-[10px] text-[var(--color-muted)]">{resumesLoading ? "..." : activeResumesCount} profiles</div>
              </button>
              
              <button onClick={() => router.push('/interview')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><Crown size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Grandmaster</div>
                <div className="text-[10px] text-[var(--color-muted)]">Sandbox mode</div>
              </button>
              
              <button onClick={() => router.push('/problems')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><Puzzle size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Problems</div>
                <div className="text-[10px] text-[var(--color-muted)]">DSA Editor</div>
              </button>
              
              <button onClick={() => router.push('/interview')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><Mic size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Interview</div>
                <div className="text-[10px] text-[var(--color-muted)]">{interviewsLoading ? "..." : interviewsCount} total</div>
              </button>
              
              <button onClick={() => router.push('/paths')} className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[12px] text-center transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 group text-[var(--color-text-primary)]">
                <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-accent)] transition-all"><Route size={20} /></div>
                <div className="text-[11.5px] font-bold mb-0.5">Paths</div>
                <div className="text-[10px] text-[var(--color-muted)]">Tracks</div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="glass-panel rounded-[14px] p-4">
                <div className="text-[10.5px] text-[var(--color-muted)] uppercase tracking-[0.05em] mb-2.5">Resume match</div>
                <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000" style={{ width: `${avgResumeScore}%` }}></div>
                </div>
                <div className="text-[20px] font-extrabold text-[var(--color-text-primary)]">{avgResumeScore || 'N/A'} <span className="text-[11px] font-medium opacity-70">/ 100</span></div>
                <div className="text-[9px] text-[var(--color-muted)] mt-1 leading-tight">Avg across {activeResumesCount} profile{activeResumesCount !== 1 ? 's' : ''}</div>
              </div>
              
              <div className="glass-panel rounded-[14px] p-4">
                <div className="text-[10.5px] text-[var(--color-muted)] uppercase tracking-[0.05em] mb-2.5">Last interview</div>
                <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${lastInterviewScore}%` }}></div>
                </div>
                <div className="text-[20px] font-extrabold text-[var(--color-text-primary)]">{lastInterviewScore} <span className="text-[11px] text-[var(--color-muted)] font-medium">/ 100</span></div>
              </div>
              
              <div className="glass-panel rounded-[14px] p-4 flex flex-col justify-between">
                <div>
                  <div className="text-[10.5px] text-[var(--color-muted)] uppercase tracking-[0.05em] mb-2.5">Arena Win Rate</div>
                  <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden mb-2.5">
                    <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${arenaWinRate}%` }}></div>
                  </div>
                  <div className="text-[20px] font-extrabold text-[var(--color-text-primary)]">{arenaWinRate}% <span className="text-[11px] font-medium opacity-70 text-[var(--color-muted)]">W/R</span></div>
                </div>
                <div className="text-[10px] text-[var(--color-muted)] leading-tight">Total Matches: {matchesPlayed}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[16px] p-[22px] fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13.5px] font-bold text-[var(--color-text-primary)]">Forge log</h3>
              <span className="text-[11px] text-[var(--color-muted)]">Recent Activity</span>
            </div>
            
            <div className="flex flex-col">
              {forgeLogActivities.length > 0 ? (
                forgeLogActivities.map((activity: any) => {
                  if (activity.type === 'INTERVIEW') {
                    return (
                      <div key={`int-${activity.id}`} className="flex gap-2.5 py-2.5 border-b border-[var(--color-border)] last:border-0 text-[11.5px]">
                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${activity.score > 80 ? 'bg-[#10b981]' : activity.score > 60 ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`}></div>
                        <div>
                          <div className="font-semibold text-[var(--color-text-primary)]">Mock Interview Protocol Graded — {activity.score}/100</div>
                          <div className="text-[var(--color-muted)] text-[10.5px] mt-0.5">{activity.jobTitle || 'General Software Engineer'} · {formatDate(activity.createdAt)}</div>
                        </div>
                      </div>
                    )
                  } else if (activity.type === 'MATCH') {
                    const isWinner = activity.winnerId === user?.id
                    const opponent = activity.player1Id === user?.id ? activity.player2 : activity.player1
                    return (
                      <div key={`match-${activity.id}`} className="flex gap-2.5 py-2.5 border-b border-[var(--color-border)] last:border-0 text-[11.5px]">
                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${isWinner ? 'bg-[var(--color-highlight)]' : 'bg-[#ef4444]'}`}></div>
                        <div>
                          <div className="font-semibold text-[var(--color-text-primary)]">
                            {isWinner ? "🏆 Won" : "💀 Lost"} PvP Battle vs {opponent?.username || "Unknown"}
                          </div>
                          <div className="text-[var(--color-muted)] text-[10.5px] mt-0.5">
                            {activity.problem?.title || "Problem"} {isWinner ? "· +100 XP" : ""} · {formatDate(activity.endedAt || activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })
              ) : (
                <div className="text-[11.5px] text-[var(--color-muted)] italic py-2">
                  No activity tracked yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </>
  )
}

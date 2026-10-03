"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Flame, Crown, Mic, Puzzle, Zap, FileText, Route, Swords } from "lucide-react"
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

  const isDataLoading = resumesLoading || interviewsLoading || matchesLoading || recommendedLoading;

  if (isDataLoading) {
    return (
      <main className="relative z-10 px-10 pt-8 pb-16 max-w-[1180px] w-full font-sans">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div className="flex flex-col gap-3">
            <div className="h-9 w-72 bg-[var(--color-border)] rounded-md opacity-20"></div>
            <div className="h-4 w-96 bg-[var(--color-border)] rounded-md opacity-20"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-[var(--color-border)] rounded-md opacity-20"></div>
            <div className="h-10 w-32 bg-[var(--color-border)] rounded-md opacity-20"></div>
          </div>
        </div>

        {/* Core Diagnostics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-5 mb-5">
          <div className="glass-panel rounded-2xl p-6 h-[260px] animate-pulse bg-[var(--bg-surface)] border-none"></div>
          <div className="glass-panel rounded-2xl p-6 h-[260px] animate-pulse bg-[var(--bg-surface)] border-none"></div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-5">
          <div className="glass-panel rounded-2xl p-6 h-[220px] animate-pulse bg-[var(--bg-surface)] border-none"></div>
          <div className="glass-panel rounded-2xl p-6 h-[220px] animate-pulse bg-[var(--bg-surface)] border-none"></div>
        </div>
      </main>
    )
  }

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
  
  // Deterministically derive sub-scores based on readinessScore
  const dsaScore = Math.min(100, Math.max(0, readinessScore > 0 ? readinessScore + 7 : 0));
  const sysArchScore = Math.min(100, Math.max(0, readinessScore > 0 ? readinessScore - 12 : 0));
  const behavioralScore = Math.min(100, Math.max(0, readinessScore > 0 ? readinessScore + 20 : 0));
  const liveCodingScore = Math.min(100, Math.max(0, readinessScore > 0 ? readinessScore - 4 : 0));
  
  const lastInterviewScore = completedInterviews.length > 0 ? completedInterviews[0].score : 0
  const activeResumesCount = resumes?.length || 0
  const interviewsCount = interviews?.length || 0

  const activeInterviews = interviews?.filter((i: any) => i.status === "IN_PROGRESS") || []
  
  const targetRole = user?.targetRole || resumes?.[0]?.targetRole || "Software Engineer"
  
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
      
      <main className="relative z-10 px-10 pt-8 pb-16 max-w-[1180px] font-sans text-[var(--color-text-primary)]">
        
        {/* TOP NAVBAR / HEADER */}
        <div className="flex justify-between items-center mb-8 fade-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-[32px] font-display font-bold tracking-[-0.01em] text-[var(--color-text-primary)] flex items-center gap-3">
                Welcome back, <span className="text-[var(--color-accent)]">{user?.username || "Developer"}</span> <Swords className="text-[var(--color-muted)]" size={28} />
              </h1>
            </div>
            <p className="text-[13px] text-[var(--color-muted)] font-mono">
              Forge status: <span className="text-[var(--color-success)] font-semibold">Primed & Ready</span> — 2 critical interview recommendations pending for target:
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/resume')} className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-md text-[12px] font-bold text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-colors">
              Sync Resumes
            </button>
            <button onClick={() => router.push('/arena')} className="px-4 py-2 bg-[var(--color-accent)] text-[#0c0d0e] border border-[var(--color-accent)] rounded-md text-[12px] font-bold hover:shadow-[0_0_16px_rgba(255,107,0,0.4)] transition-all">
              Enter PvP Matchmaking
            </button>
          </div>
        </div>

        {/* ── CORE DIAGNOSTICS & NEXT UP ── */}
        <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-5 mb-5 fade-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Readiness Index */}
          <div className="glass-panel rounded-2xl p-6 relative flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-shadow duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] text-[var(--color-success)] uppercase tracking-widest font-bold mb-1">Diagnostic Telemetry</div>
                <h2 className="text-[20px] font-display font-bold">Interview Readiness Index</h2>
              </div>
              <div className="px-2 py-1 bg-[rgba(16,185,129,0.15)] text-[var(--color-success)] text-[10px] font-bold rounded-sm border border-[rgba(16,185,129,0.3)]">
                +14% this week
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-between gap-6 mb-6">
              <div className="relative w-[140px] h-[140px] shrink-0">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-border)" strokeWidth="8"/>
                  <circle cx="70" cy="70" r="60" fill="none" stroke="url(#gaugeGrad)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={376.99} strokeDashoffset={376.99 - (readinessScore / 100) * 376.99}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-accent)"/>
                      <stop offset="100%" stopColor="var(--color-success)"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-[28px] font-display font-bold text-[var(--color-text-primary)] leading-none mb-1 text-glow">
                    {readinessScore}%
                  </div>
                  <div className="text-[9px] text-[var(--color-muted)] font-bold uppercase tracking-wide leading-tight mt-1">
                    {user?.experienceLevel === 'SENIOR' ? 'L5/L6' : user?.experienceLevel === 'MID' ? 'L4' : 'L3'} Benchmark<br/>Tier {readinessScore >= 80 ? '1' : readinessScore >= 50 ? '2' : '3'} Target
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-3.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5"><span className="text-[var(--color-text-secondary)]">DSA & Algorithms</span><span className="font-bold">{dsaScore}%</span></div>
                  <div className="h-1 bg-[var(--bg-base)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)]" style={{width: `${dsaScore}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5"><span className="text-[var(--color-text-secondary)]">System Architecture</span><span className="font-bold">{sysArchScore}%</span></div>
                  <div className="h-1 bg-[var(--bg-base)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-warning)]" style={{width: `${sysArchScore}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5"><span className="text-[var(--color-text-secondary)]">Behavioral & Leadership</span><span className="font-bold">{behavioralScore}%</span></div>
                  <div className="h-1 bg-[var(--bg-base)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-success)]" style={{width: `${behavioralScore}%`}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5"><span className="text-[var(--color-text-secondary)]">Live Coding Velocity</span><span className="font-bold">{liveCodingScore}%</span></div>
                  <div className="h-1 bg-[var(--bg-base)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)]" style={{width: `${liveCodingScore}%`}}></div></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              <div className="text-[11px] text-[var(--color-muted)] truncate max-w-[200px]">
                Target: <span className="text-[var(--color-text-primary)]">{targetRole}</span>
              </div>
              <button onClick={() => router.push('/interview/agent')} className="text-[11px] font-bold text-[var(--color-accent)] hover:text-[var(--color-highlight)] transition-colors">
                Run Full Diagnostic →
              </button>
            </div>
          </div>

          {/* Next Up in the Forge */}
          <div className="glass-panel rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-shadow duration-500">
            <div className="flex justify-between items-baseline mb-5">
              <div>
                <div className="text-[10px] text-[var(--color-warning)] uppercase tracking-widest font-bold mb-1">Priority Protocol</div>
                <h2 className="text-[20px] font-display font-bold text-[var(--color-text-primary)]">Next up in the Forge</h2>
              </div>
              <a href="/paths" className="text-[11.5px] font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)]">View Adaptive Plan →</a>
            </div>
            
            <div className="flex flex-col gap-2.5">
              
              {activeInterviews.slice(0, 2).map((intv: any) => (
                <div key={intv.id} className={`group flex items-start gap-4 p-4 rounded-xl border ${intv.type === 'AI_AGENT' ? 'border-[var(--color-accent)] bg-[rgba(255,107,0,0.05)] glow-active' : 'border-[var(--color-border)] bg-[var(--bg-card)] hover:border-[var(--color-warning)]'} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer`} onClick={() => router.push(intv.type === 'AI_AGENT' ? `/interview/agent` : `/interview`)}>
                  <div className="mt-0.5 transition-transform group-hover:scale-110 duration-300">
                    {intv.type === 'AI_AGENT' ? <Mic size={16} className="text-[var(--color-accent)]" /> : <Crown size={16} className="text-[var(--color-warning)]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[14px] font-bold text-[var(--color-text-primary)]">{intv.title || (intv.type === 'AI_AGENT' ? 'Mock Interview: AI Agent' : 'Standard Mock Interview')}</div>
                      {intv.type === 'AI_AGENT' ? (
                        <span className="text-[9px] px-1.5 py-0.5 border border-[var(--color-accent)] text-[var(--color-accent)] rounded uppercase bg-[rgba(255,107,0,0.1)]">AI Voice</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 border border-[var(--color-warning)] text-[var(--color-warning)] rounded uppercase">Active</span>
                      )}
                    </div>
                    <div className="text-[12px] text-[var(--color-muted)]">
                      {intv.type === 'AI_AGENT' ? 'Simulate live discussion' : 'Continue pending challenge'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {intv.type === 'AI_AGENT' && <span className="text-[9px] text-[var(--color-accent)] font-bold uppercase tracking-wider">Recommended Now</span>}
                    <button className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all duration-300 ${intv.type === 'AI_AGENT' ? 'bg-[var(--color-accent)] text-[#0c0d0e] shadow-[0_0_10px_rgba(255,107,0,0.3)] hover:opacity-90 group-hover:shadow-[0_0_20px_rgba(255,107,0,0.5)]' : 'border border-[var(--color-border)] hover:border-[var(--color-text-primary)] group-hover:bg-[var(--bg-surface)]'}`}>
                      {intv.type === 'AI_AGENT' ? 'Start Mock →' : 'Resume →'}
                    </button>
                  </div>
                </div>
              ))}

              {activeInterviews.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[var(--color-border)] rounded-lg text-center mb-2">
                  <div className="text-[var(--color-muted)] text-[12px] mb-2">No active mock interviews pending.</div>
                  <button onClick={() => router.push('/interview')} className="text-[11px] font-bold text-[var(--color-accent)] hover:underline">Start a new Mock Protocol →</button>
                </div>
              )}

              {recommendedLoading ? (
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--bg-card)] opacity-50 flex items-center justify-center">
                  <div className="text-[12px] font-bold animate-pulse text-[var(--color-accent)]">Analyzing telemetry for recommendations...</div>
                </div>
              ) : recommendedProblems?.length > 0 ? (
                recommendedProblems.slice(0, 2).map((prob: any) => (
                  <div key={prob.id} className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-card)] hover:border-[var(--color-success)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer" onClick={() => router.push(`/problems/${prob.slug}`)}>
                    <div className="mt-0.5 transition-transform group-hover:scale-110 duration-300"><Puzzle size={16} className="text-[var(--color-success)]" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-[14px] font-bold text-[var(--color-text-primary)]">{prob.title}</div>
                        <span className={`text-[9px] px-1.5 py-0.5 border rounded uppercase ${prob.difficulty === 'EASY' ? 'border-[var(--color-success)] text-[var(--color-success)]' : prob.difficulty === 'MEDIUM' ? 'border-[var(--color-warning)] text-[var(--color-warning)]' : 'border-[#ef4444] text-[#ef4444]'}`}>{prob.difficulty}</span>
                        <span className="text-[9px] text-[var(--color-muted)]">+{prob.difficulty === 'EASY' ? '100' : prob.difficulty === 'MEDIUM' ? '250' : '500'} XP</span>
                      </div>
                      <div className="text-[12px] text-[var(--color-muted)]">Algorithmic priority targeted for your upcoming interviews</div>
                    </div>
                    <button className="px-3 py-1.5 border border-[var(--color-border)] rounded text-[11px] font-bold transition-all duration-300 group-hover:border-[var(--color-text-primary)] group-hover:bg-[var(--bg-surface)]">
                      Solve →
                    </button>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: TOOLS & LOG ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-5 fade-up" style={{ animationDelay: '0.3s' }}>
          
          {/* Quick Launch Arena */}
          <div className="glass-panel rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-shadow duration-500">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[14px] font-display font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Quick Launch Arena</h3>
              <span className="text-[11px] text-[var(--color-success)] font-bold">5 modules active</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="p-4 border border-[var(--color-border)] bg-[var(--bg-card)] rounded-xl flex flex-col justify-between hover:border-[var(--color-accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,0,0.15)] group cursor-pointer" onClick={() => router.push('/arena')}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-[var(--color-accent)] transition-transform group-hover:scale-110 duration-300" />
                    <span className="text-[13px] font-bold">PvP Arena</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] mb-3">Live 1v1 Ranked Duel</div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--color-success)] font-bold">Queue: ~4s</span>
                  <span className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Match →</span>
                </div>
              </div>
              
              <div className="p-4 border border-[var(--color-border)] bg-[var(--bg-card)] rounded-xl flex flex-col justify-between hover:border-[var(--color-accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,0,0.15)] group cursor-pointer" onClick={() => router.push('/resume')}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-[var(--color-warning)] transition-transform group-hover:scale-110 duration-300" />
                    <span className="text-[13px] font-bold">ATS Matcher</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] mb-3">{activeResumesCount} PROFILE TUNED</div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[var(--color-warning)]">{avgResumeScore}/100 Score</span>
                  <span className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Edit →</span>
                </div>
              </div>
              
              <div className="p-4 border border-[var(--color-border)] bg-[var(--bg-card)] rounded-xl flex flex-col justify-between hover:border-[var(--color-accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,0,0.15)] group cursor-pointer" onClick={() => router.push('/interview')}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={14} className="text-[var(--color-violet)] transition-transform group-hover:scale-110 duration-300" />
                    <span className="text-[13px] font-bold">Grandmaster</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)] mb-3">Sandbox Debugging</div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--color-muted)]">Custom Testcases</span>
                  <span className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Launch →</span>
                </div>
              </div>
            </div>

            {/* Bottom telemetry bar */}
            <div className="flex items-center justify-between p-3 border-t border-[var(--color-border)] text-[11px]">
              <div className="flex items-center gap-3">
                <span className="font-bold uppercase tracking-wider text-[var(--color-muted)]">Overall Readiness</span>
                <span className="font-bold text-[var(--color-text-primary)]">{readinessScore}% READY</span>
              </div>
              <div className="flex-1 max-w-[200px] h-1.5 bg-[var(--bg-base)] rounded-full mx-4 overflow-hidden flex">
                <div className="h-full bg-[var(--color-success)] transition-all duration-1000" style={{width: `${readinessScore}%`}}></div>
              </div>
              <div className="font-bold text-[var(--color-muted)]">Level {Math.floor((user?.xp || 0) / 1000) + 1} Dev</div>
            </div>
          </div>
          
          {/* Forge Live Feed (Log) */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col max-h-[290px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-shadow duration-500">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h3 className="text-[14px] font-display font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Forge Live Feed</h3>
              <span className="text-[11px] text-[var(--color-muted)]">Recent Activity</span>
            </div>
            
            <div className="flex flex-col overflow-y-auto pr-2 custom-scrollbar gap-3 flex-1">
              {forgeLogActivities.length > 0 ? (
                forgeLogActivities.map((activity: any) => {
                  if (activity.type === 'INTERVIEW') {
                    return (
                      <div key={`int-${activity.id}`} className="p-3 border border-[var(--color-border)] bg-[var(--bg-card)] rounded-lg text-[11px] shrink-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <span className="text-[14px]">🎙️</span> Mock Protocol Graded — {activity.score}/100
                          </div>
                          <button className="text-[9px] uppercase font-bold text-[var(--color-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">View</button>
                        </div>
                        <div className="text-[var(--color-text-secondary)] pl-6">
                          {activity.jobTitle || 'General Software Engineer'}
                        </div>
                        <div className="text-[var(--color-muted)] text-[9px] pl-6 mt-1">
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    )
                  } else if (activity.type === 'MATCH') {
                    const isWinner = activity.winnerId === user?.id
                    const opponent = activity.player1Id === user?.id ? activity.player2 : activity.player1
                    return (
                      <div key={`match-${activity.id}`} className="p-3 border border-[var(--color-border)] bg-[var(--bg-card)] rounded-lg text-[11px] shrink-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <span className="text-[14px]">{isWinner ? "🏆" : "💀"}</span> {isWinner ? "Victory" : "Defeat"} vs {opponent?.username || "Unknown"}
                          </div>
                          <button className="text-[9px] uppercase font-bold text-[var(--color-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">{isWinner ? "Diff Code" : "Revenge X"}</button>
                        </div>
                        <div className="text-[var(--color-text-secondary)] pl-6">
                          {activity.problem?.title || "Problem"} {isWinner ? "· +100 XP" : ""}
                        </div>
                        <div className="text-[var(--color-muted)] text-[9px] pl-6 mt-1">
                          {formatDate(activity.endedAt || activity.createdAt)}
                        </div>
                      </div>
                    )
                  }
                  return null
                })
              ) : (
                <div className="text-[11px] text-[var(--color-muted)] italic p-4 text-center border border-[var(--color-border)] rounded-lg border-dashed">
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

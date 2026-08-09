"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { useResumes, useInterviews } from "@/hooks/useResume"

const mono = "JetBrains Mono, monospace"

export default function DashboardPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: resumes, isLoading: resumesLoading } = useResumes()
  const { data: interviews, isLoading: interviewsLoading } = useInterviews()

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token) return null

  // Calculate stats
  const completedInterviews = interviews?.filter((i: any) => i.status === "COMPLETED") || []
  const avgScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc: number, i: any) => acc + (i.score || 0), 0) / completedInterviews.length)
    : 0

  return (
    <main style={{ minHeight: "calc(100vh - 56px)" }} className="p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-on-surface font-mono tracking-tight">Command Center</h1>
          <p className="text-sm text-code-gray mt-2 font-mono">
            Welcome back, Operator. System status is nominal.
          </p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">⚔</span>
            </div>
            <span className="text-xs text-code-gray font-mono uppercase tracking-widest">Arena Rating</span>
            <div className="text-3xl font-bold font-mono text-glow text-white">1450</div>
            <span className="text-xs text-[var(--color-ember)] font-mono">Grandmaster Tier</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">🎙️</span>
            </div>
            <span className="text-xs text-code-gray font-mono uppercase tracking-widest">Mock Interviews</span>
            <div className="text-3xl font-bold font-mono text-white">
              {interviewsLoading ? "..." : completedInterviews.length}
            </div>
            <span className="text-xs text-[var(--color-ember)] font-mono">Completed Sessions</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">📈</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-code-gray font-mono uppercase tracking-widest">Avg Score</span>
              <span className="text-xs text-[var(--color-ember-light)] font-mono">Proficiency</span>
            </div>
            
            <div className="flex items-end gap-4 mt-2">
              <div className="text-3xl font-bold font-mono text-white">
                {interviewsLoading ? "..." : `${avgScore}%`}
              </div>
              
              {/* SVG Sparkline Graph */}
              <div className="flex-1 h-10 ml-2 relative">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(var(--color-ember-light-rgb), 0.4)" />
                      <stop offset="100%" stopColor="rgba(var(--color-ember-light-rgb), 0)" />
                    </linearGradient>
                  </defs>
                  {/* Fill */}
                  <path d="M0,40 L0,30 L20,35 L40,20 L60,25 L80,10 L100,15 L100,40 Z" fill="url(#sparkline-gradient)" />
                  {/* Line */}
                  <polyline points="0,30 20,35 40,20 60,25 80,10 100,15" fill="none" stroke="var(--color-ember-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* End Dot */}
                  <circle cx="100" cy="15" r="3" fill="var(--color-ember-light)" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">📄</span>
            </div>
            <span className="text-xs text-code-gray font-mono uppercase tracking-widest">Active Resumes</span>
            <div className="text-3xl font-bold font-mono text-white">
              {resumesLoading ? "..." : resumes?.length || 0}
            </div>
            <span className="text-xs text-code-gray font-mono">Targeted Profiles</span>
          </div>

        </div>

        {/* Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Quick Launch & Feed */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Quick Launch */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-sm text-code-gray font-mono uppercase tracking-widest mb-4">Quick Launch</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => router.push('/interview')}
                  className="p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-[rgba(var(--color-ember-rgb),0.3)] bg-[rgba(var(--color-ember-rgb),0.1)] hover:bg-[rgba(var(--color-ember-rgb),0.2)] hover:border-[rgba(var(--color-ember-rgb),0.5)] transition-all shadow-[0_0_15px_rgba(var(--color-ember-rgb),0.1)] hover:shadow-[0_0_25px_rgba(var(--color-ember-rgb),0.2)]"
                >
                  <span className="text-2xl mb-1">🤖</span>
                  <span className="text-sm font-bold font-mono text-white">Mock Interview</span>
                </button>
                <button 
                  onClick={() => router.push('/arena')}
                  className="p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-[rgba(var(--color-ember-light-rgb),0.3)] bg-[rgba(var(--color-ember-light-rgb),0.1)] hover:bg-[rgba(var(--color-ember-light-rgb),0.2)] hover:border-[rgba(var(--color-ember-light-rgb),0.5)] transition-all shadow-[0_0_15px_rgba(var(--color-ember-light-rgb),0.1)] hover:shadow-[0_0_25px_rgba(var(--color-ember-light-rgb),0.2)]"
                >
                  <span className="text-2xl mb-1">⚔</span>
                  <span className="text-sm font-bold font-mono text-white">Live Arena</span>
                </button>
                <button 
                  onClick={() => router.push('/problems')}
                  className="p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <span className="text-2xl mb-1">💻</span>
                  <span className="text-sm font-bold font-mono text-white">DSA Practice</span>
                </button>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="glass-panel rounded-2xl p-6 flex-1">
              <h2 className="text-sm text-code-gray font-mono uppercase tracking-widest mb-6">Activity Stream</h2>
              <div className="flex flex-col gap-6 font-mono text-sm">
                
                {completedInterviews.slice(0, 3).map((interview: any) => (
                  <div key={interview.id} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-ember)]/10 border border-[var(--color-ember)]/30 flex items-center justify-center text-[var(--color-ember)] shrink-0 mt-0.5">
                      🎙️
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-white">
                        Completed mock interview <span className="text-[var(--color-ember-light)]">({interview.resume?.targetRole || "General"})</span>
                      </div>
                      <div className="text-xs text-code-gray flex items-center gap-3">
                        <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                        <span className="text-[var(--color-ember)]">Score: {interview.score}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {completedInterviews.length === 0 && (
                  <div className="text-code-gray/50 italic">No recent activity found. Initialize a module from Quick Launch.</div>
                )}
                
              </div>
            </div>

          </div>

          {/* Right Column: Proficiency Radar */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
            <h2 className="text-sm text-code-gray font-mono uppercase tracking-widest">Skill Proficiency</h2>
            
            <div className="flex flex-col gap-5 mt-2">
              {[
                { skill: "Data Structures", value: 85, color: "#ea580c" },
                { skill: "System Design", value: 65, color: "#f59e0b" },
                { skill: "Communication", value: 92, color: "#10b981" },
                { skill: "Concurrency", value: 45, color: "#ef4444" },
                { skill: "Debugging", value: 78, color: "#ea580c" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end font-mono text-xs">
                    <span className="text-white">{stat.skill}</span>
                    <span className="text-code-gray">{stat.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${stat.value}%`, 
                        backgroundColor: stat.color,
                        boxShadow: `0 0 10px ${stat.color}`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-xs font-mono text-code-gray">
                <span className="w-2 h-2 rounded-full bg-[var(--color-ember)] animate-pulse" />
                <span>AI Recruiter analysis active</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </main>
  )
}

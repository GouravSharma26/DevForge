"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePaths, useEnroll } from "@/hooks/usePaths"
import { useAuthStore } from "@/store/auth.store"

const LEVEL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  BEGINNER: { color: "#10b981", bg: "#10b98115", border: "#10b98130" },
  MID:      { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  SENIOR:   { color: "#ef4444", bg: "#ef444415", border: "#ef444430" },
}

export default function PathsPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const { data: paths, isLoading } = usePaths()
  const enroll = useEnroll()

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token) return null

  return (
    <main className="bg-base">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
            Learning Paths
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
            Structured tracks to take you from beginner to job-ready
          </p>
        </div>

        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 220, borderRadius: 20, background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }} />
            ))}
          </div>
        )}

        {paths && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {paths.map((path: any) => {
              const lvl = LEVEL_STYLE[path.level] || LEVEL_STYLE.BEGINNER
              return (
                  <div
                    key={path.id}
                    className="group relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(234,88,12,0.15)] hover:border-[#ea580c]/30 flex flex-col gap-5 overflow-hidden"
                  >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ea580c]/0 to-[#ea580c]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Header */}
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-4xl drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] group-hover:scale-110 transition-transform duration-500">{path.icon}</span>
                    <span className="text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider" style={{
                      color: lvl.color, background: lvl.bg, border: `1px solid ${lvl.border}`
                    }}>
                      {path.level}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="relative z-10 flex-1">
                    <h3 className="text-base font-bold text-white font-mono group-hover:text-[#ea580c] transition-colors">
                      {path.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed line-clamp-3">
                      {path.description}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="relative z-10">
                    {path.isEnrolled ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[var(--text-muted)]">{path.completedTopics} / {path.totalTopics} topics</span>
                          <span className="text-[#ea580c] font-bold">{path.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#ea580c] to-[#d97706]"
                            style={{ width: `${path.progressPercent}%` }} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {path.totalTopics} topics
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => path.isEnrolled ? router.push(`/paths/${path.id}`) : enroll.mutate(path.id)}
                    className={`
                      relative z-10 w-full py-3 rounded-xl text-sm font-bold font-mono transition-all duration-300
                      ${path.isEnrolled 
                        ? 'bg-gradient-to-r from-[#ea580c] to-[#d97706] text-black shadow-[0_5px_15px_rgba(234,88,12,0.3)] hover:shadow-[0_8px_25px_rgba(234,88,12,0.5)] hover:scale-[1.02]' 
                        : 'bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-white hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    {path.isEnrolled ? "Continue →" : "Enroll"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
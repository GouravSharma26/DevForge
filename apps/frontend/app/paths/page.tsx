"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePaths, useEnroll } from "@/hooks/usePaths"
import { useAuthStore } from "@/store/auth.store"
import { Anvil } from "lucide-react"

const LEVEL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  BEGINNER: { color: "#10b981", bg: "#10b98115", border: "#10b98130" },
  MID:      { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  SENIOR:   { color: "#ef4444", bg: "#ef444415", border: "#ef444430" },
}

export default function PathsPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const { data: paths, isLoading } = usePaths()
  const enroll = useEnroll()
  const [systemDesignTreeId, setSystemDesignTreeId] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Fetch the skill tree ID for System Design
  useEffect(() => {
    async function loadTreeId() {
      try {
        const { api } = await import('@/lib/api')
        const response = await api.get('/learn/trees')
        if (response.data.success) {
          const sysDesignTree = response.data.data.find((t: any) => t.title === 'Cloud-Scale Distributed System Design')
          if (sysDesignTree) {
            setSystemDesignTreeId(sysDesignTree.id)
          }
        }
      } catch (err) {
        console.error("Failed to load skill trees", err)
      }
    }
    loadTreeId()
  }, [])

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
                  style={{
                    background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                    borderRadius: 20, padding: 24,
                    transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 16,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(234,88,12,0.5)"
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(234,88,12,0.12)"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border-subtle)"
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 32 }}>{path.icon}</span>
                    <span style={{
                      fontSize: 10, padding: "3px 10px", borderRadius: 99,
                      color: lvl.color, background: lvl.bg, border: `1px solid ${lvl.border}`,
                      fontFamily: "JetBrains Mono, monospace",
                    }}>
                      {path.level}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
                      {path.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.6, fontFamily: "JetBrains Mono, monospace" }}>
                      {path.description}
                    </p>
                  </div>

                  {/* Progress */}
                  {path.isEnrolled ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        <span style={{ color: "var(--text-muted)" }}>{path.completedTopics} / {path.totalTopics} topics</span>
                        <span style={{ color: "#ea580c" }}>{path.progressPercent}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 99, transition: "width 0.5s",
                          background: "linear-gradient(90deg, #ea580c, #d97706)",
                          width: `${path.progressPercent}%`,
                        }} />
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                      {path.totalTopics} topics
                    </p>
                  )}

                  <button
                    onClick={() => {
                      if (!path.isEnrolled) {
                        enroll.mutate(path.id)
                      } else {
                        if (path.title === 'System Design' && systemDesignTreeId) {
                          router.push(`/learn/${systemDesignTreeId}`)
                        } else {
                          setShowModal(true)
                        }
                      }
                    }}
                    style={{
                      padding: "10px 0", borderRadius: 12, fontSize: 13,
                      fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
                      fontWeight: 600, transition: "all 0.2s",
                      background: path.isEnrolled ? "linear-gradient(135deg, #ea580c, #d97706)" : "var(--glass-bg)",
                      border: path.isEnrolled ? "none" : "1px solid var(--border-subtle)",
                      color: path.isEnrolled ? "var(--text-primary)" : "var(--text-muted)",
                      boxShadow: path.isEnrolled ? "0 4px 16px rgba(234,88,12,0.3)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (path.isEnrolled) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(234,88,12,0.5)"
                    }}
                    onMouseLeave={(e) => {
                      if (path.isEnrolled) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(234,88,12,0.3)"
                    }}
                  >
                    {path.isEnrolled ? "Continue →" : "Enroll"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-surface-theme border border-accent/20 rounded-2xl p-6 shadow-[0_0_40px_rgba(234,88,12,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-highlight" />
            
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
              <Anvil size={28} className="text-accent" />
            </div>
            
            <h3 className="text-xl font-bold font-mono text-primary mb-2">
              Currently in the Forge
            </h3>
            
            <p className="text-sm font-mono text-muted mb-6 leading-relaxed">
              The interactive curriculum for this path is currently being hammered out. Check back soon to continue your journey!
            </p>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl font-mono text-sm font-bold bg-card border border-border text-primary hover:bg-accent/10 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_20px_rgba(234,88,12,0.2)] transition-all duration-200"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
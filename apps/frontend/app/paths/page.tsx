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
  const [showModal, setShowModal] = useState(false)
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
                    onClick={() => path.isEnrolled ? setShowModal(true) : enroll.mutate(path.id)}
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

      {/* Coming Soon Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(23, 18, 16, 0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div className="bg-base">
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(234,88,12,0.1)",
              color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 24, border: "1px solid rgba(234,88,12,0.2)"
            }}>
              🚧
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
              Coming Soon
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5, marginBottom: 24 }}>
              The interactive curriculum for this path is currently being forged. Check back in a few days!
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 12, fontSize: 13,
                fontFamily: "JetBrains Mono, monospace", cursor: "pointer", fontWeight: 600,
                background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(var(--glass-bg-rgb),0.1)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--glass-bg)"
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
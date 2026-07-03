"use client"

import { useEffect } from "react"
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
    <main style={{ background: "#0d0d1a", minHeight: "100%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f0ff", fontFamily: "JetBrains Mono, monospace" }}>
            Learning Paths
          </h1>
          <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
            Structured tracks to take you from beginner to job-ready
          </p>
        </div>

        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 220, borderRadius: 20, background: "#16163a", border: "1px solid #1f1f45" }} />
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
                    background: "#16163a", border: "1px solid #1f1f45",
                    borderRadius: 20, padding: 24,
                    transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 16,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid #7c3aed40"
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.12)"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid #1f1f45"
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
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f0ff", fontFamily: "JetBrains Mono, monospace" }}>
                      {path.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "#5a5780", marginTop: 6, lineHeight: 1.6, fontFamily: "JetBrains Mono, monospace" }}>
                      {path.description}
                    </p>
                  </div>

                  {/* Progress */}
                  {path.isEnrolled ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        <span style={{ color: "#5a5780" }}>{path.completedTopics} / {path.totalTopics} topics</span>
                        <span style={{ color: "#a855f7" }}>{path.progressPercent}%</span>
                      </div>
                      <div style={{ height: 4, background: "#1f1f45", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 99, transition: "width 0.5s",
                          background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                          width: `${path.progressPercent}%`,
                        }} />
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: "#3a3760", fontFamily: "JetBrains Mono, monospace" }}>
                      {path.totalTopics} topics
                    </p>
                  )}

                  {/* Button */}
                  <button
                    onClick={() => path.isEnrolled ? router.push(`/paths/${path.id}`) : enroll.mutate(path.id)}
                    style={{
                      padding: "10px 0", borderRadius: 12, fontSize: 13,
                      fontFamily: "JetBrains Mono, monospace", cursor: "pointer",
                      fontWeight: 600, transition: "all 0.2s",
                      background: path.isEnrolled ? "linear-gradient(135deg, #7c3aed, #6366f1)" : "#1c1c45",
                      border: path.isEnrolled ? "none" : "1px solid #2a2a5a",
                      color: path.isEnrolled ? "#fff" : "#a09dc0",
                      boxShadow: path.isEnrolled ? "0 4px 16px #7c3aed30" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (path.isEnrolled) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px #7c3aed50"
                    }}
                    onMouseLeave={(e) => {
                      if (path.isEnrolled) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px #7c3aed30"
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
    </main>
  )
}
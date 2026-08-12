"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProblems } from "@/hooks/useProblems"
import { useAuthStore } from "@/store/auth.store"

const DIFFICULTIES = [
  { label: "All",    value: undefined },
  { label: "Easy",   value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard",   value: "HARD" },
]

const DIFF_COLOR: Record<string, string> = {
  EASY:   "#10b981",
  MEDIUM: "#f59e0b",
  HARD:   "#ef4444",
}

export default function ProblemsPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProblems(difficulty, page)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  if (!hydrated || !token) return null

  return (
    <main className="bg-base">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f0ff", fontFamily: "JetBrains Mono, monospace" }}>
            DSA Practice
          </h1>
          <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
            Solve problems, run real code, level up
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.value
            return (
              <button
                key={d.label}
                onClick={() => { setDifficulty(d.value); setPage(1) }}
                style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace", transition: "all 0.2s",
                  background: active ? "rgba(217,119,6,0.18)" : "var(--glass-bg)",
                  backdropFilter: active ? "blur(8px)" : "blur(16px)", WebkitBackdropFilter: active ? "blur(8px)" : "blur(16px)",
                  border: active ? "1px solid rgba(253,186,116,0.45)" : "1px solid var(--border-subtle)",
                  color: active ? "#fed7aa" : "var(--text-muted)",
                  boxShadow: active ? "0 4px 20px rgba(234,88,12,0.1)" : "none",
                }}
              >
                {d.label}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div style={{
          background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["#", "Title", "Category", "Difficulty"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 20px",
                    fontSize: 11, color: "#5a5780", fontWeight: 500,
                    fontFamily: "JetBrains Mono, monospace",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(var(--border-subtle-rgb),0.08)" }}>
                  {[40, 200, 120, 80].map((w, j) => (
                    <td key={j} style={{ padding: "14px 20px" }}>
                      <div style={{ height: 12, width: w, borderRadius: 6, background: "rgba(255,180,120,0.1)" }} />
                    </td>
                  ))}
                </tr>
              ))}
              {data?.problems.map((problem: any) => (
                <tr
                  key={problem.id}
                  onClick={() => router.push(`/problems/${problem.slug}`)}
                  style={{
                    borderBottom: "1px solid rgba(var(--border-subtle-rgb),0.08)", cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(var(--border-subtle-rgb),0.08)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                    {problem.order}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-primary)", fontWeight: 500, fontFamily: "JetBrains Mono, monospace" }}>
                    {problem.title}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                    {problem.category}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: DIFF_COLOR[problem.difficulty] }}>
                    {problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <p style={{ fontSize: 12, color: "#5a5780", fontFamily: "JetBrains Mono, monospace" }}>
              {data.pagination.total} problems total
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "← Prev", disabled: page === 1, onClick: () => setPage(p => Math.max(1, p - 1)) },
                { label: "Next →", disabled: page === data.pagination.totalPages, onClick: () => setPage(p => p + 1) },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    padding: "6px 16px", borderRadius: 10, fontSize: 12, cursor: btn.disabled ? "not-allowed" : "pointer",
                    background: "var(--glass-bg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid var(--border-subtle)",
                    color: btn.disabled ? "var(--text-muted)" : "var(--text-secondary)", opacity: btn.disabled ? 0.4 : 1,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
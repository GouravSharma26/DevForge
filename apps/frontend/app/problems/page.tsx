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
    <main style={{ background: "#0d0d1a", minHeight: "100%" }}>
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
                  background: active ? "#7c3aed20" : "#16163a",
                  border: active ? "1px solid #7c3aed60" : "1px solid #1f1f45",
                  color: active ? "#a855f7" : "#5a5780",
                }}
              >
                {d.label}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div style={{
          background: "#16163a", border: "1px solid #1f1f45",
          borderRadius: 16, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f1f45" }}>
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
                <tr key={i} style={{ borderBottom: "1px solid #1a1a3a" }}>
                  {[40, 200, 120, 80].map((w, j) => (
                    <td key={j} style={{ padding: "14px 20px" }}>
                      <div style={{ height: 12, width: w, borderRadius: 6, background: "#1c1c45" }} />
                    </td>
                  ))}
                </tr>
              ))}
              {data?.problems.map((problem: any) => (
                <tr
                  key={problem.id}
                  onClick={() => router.push(`/problems/${problem.slug}`)}
                  style={{
                    borderBottom: "1px solid #1a1a3a", cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#1c1c45"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#3a3760", fontFamily: "JetBrains Mono, monospace" }}>
                    {problem.order}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#f1f0ff", fontWeight: 500, fontFamily: "JetBrains Mono, monospace" }}>
                    {problem.title}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#5a5780", fontFamily: "JetBrains Mono, monospace" }}>
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
                    background: "#16163a", border: "1px solid #1f1f45",
                    color: btn.disabled ? "#2a2a5a" : "#a09dc0", opacity: btn.disabled ? 0.4 : 1,
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
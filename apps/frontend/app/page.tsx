"use client"

import { useState } from "react"
import { useNews } from "@/hooks/useNews"

const CATEGORIES = [
  { label: "All",        value: undefined },
  { label: "Technology", value: "technology" },
  { label: "Science",    value: "science" },
  { label: "Business",   value: "business" },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useNews(activeCategory, page)

  function handleCategory(value: string | undefined) {
    setActiveCategory(value)
    setPage(1)
  }

  return (
    <main style={{ background: "#0d0d1a", minHeight: "100%" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f0ff", fontFamily: "JetBrains Mono, monospace" }}>
            Today in Tech
          </h1>
          <p style={{ fontSize: 12, color: "#5a5780", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
            Curated articles updated every 6 hours
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => handleCategory(cat.value)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                  border: active ? "1px solid #7c3aed60" : "1px solid #1f1f45",
                  background: active ? "#7c3aed20" : "#16163a",
                  color: active ? "#a855f7" : "#5a5780",
                  transition: "all 0.2s",
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                height: 280, borderRadius: 16,
                background: "#16163a", border: "1px solid #1f1f45",
                animation: "pulse 2s infinite"
              }} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{
            textAlign: "center", padding: "80px 0",
            color: "#5a5780", fontFamily: "JetBrains Mono, monospace", fontSize: 13
          }}>
            Failed to load articles. Is the backend running?
          </div>
        )}

        {/* Articles Grid */}
        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {data.articles.map((article: any) => (
                <a
                  key={article.id}  
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#16163a",
                    border: "1px solid #1f1f45",
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    height: "100%",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = "1px solid #7c3aed40"
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.15)"
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = "1px solid #1f1f45"
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                    }}
                  >
                    {article.imageUrl && (
                      <div style={{ height: 160, overflow: "hidden" }}>
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{
                          fontSize: 10, padding: "3px 10px", borderRadius: 99,
                          background: "#7c3aed15", color: "#a855f7",
                          border: "1px solid #7c3aed30",
                          fontFamily: "JetBrains Mono, monospace",
                          textTransform: "capitalize",
                        }}>
                          {article.category}
                        </span>
                        <span style={{ fontSize: 10, color: "#5a5780", fontFamily: "JetBrains Mono, monospace" }}>
                          {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: 13, fontWeight: 600, color: "#f1f0ff",
                        lineHeight: 1.5, marginBottom: 8,
                        fontFamily: "JetBrains Mono, monospace",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {article.title}
                      </h3>
                      {article.description && (
                        <p style={{
                          fontSize: 11, color: "#5a5780", lineHeight: 1.5,
                          fontFamily: "JetBrains Mono, monospace",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {article.description}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: "#3a3760", marginTop: 10, fontFamily: "JetBrains Mono, monospace" }}>
                        {article.source}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 32, paddingTop: 24, borderTop: "1px solid #1f1f45"
            }}>
              <p style={{ fontSize: 12, color: "#5a5780", fontFamily: "JetBrains Mono, monospace" }}>
                Page {data.pagination.page} of {data.pagination.totalPages} — {data.pagination.total} articles
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "← Prev", disabled: page === 1, onClick: () => setPage(p => Math.max(1, p - 1)) },
                  { label: "Next →", disabled: page === data.pagination.totalPages, onClick: () => setPage(p => p + 1) },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    style={{
                      padding: "6px 16px", borderRadius: 10, fontSize: 12,
                      fontFamily: "JetBrains Mono, monospace", cursor: btn.disabled ? "not-allowed" : "pointer",
                      background: "#16163a", border: "1px solid #1f1f45",
                      color: btn.disabled ? "#2a2a5a" : "#a09dc0",
                      opacity: btn.disabled ? 0.4 : 1, transition: "all 0.2s",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
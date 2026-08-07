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
    <main style={{ background: "#171210", minHeight: "100%" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fdf6f0", fontFamily: "JetBrains Mono, monospace" }}>
            Today in Tech
          </h1>
          <p style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
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
                  border: active ? "1px solid rgba(234,88,12,0.4)" : "1px solid rgba(255,180,120,0.14)",
                  background: active ? "rgba(234,88,12,0.1)" : "rgba(255,237,213,0.05)",
                  color: active ? "#ea580c" : "#8a7a6a",
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
                background: "rgba(255,237,213,0.03)", border: "1px solid rgba(255,180,120,0.14)",
                animation: "pulse 2s infinite"
              }} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{
            textAlign: "center", padding: "80px 0",
            color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace", fontSize: 13
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
                    background: "rgba(255,237,213,0.02)",
                    border: "1px solid rgba(255,180,120,0.14)",
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    height: "100%",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(234,88,12,0.4)"
                      ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(234,88,12,0.15)"
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,180,120,0.14)"
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
                          background: "rgba(234,88,12,0.1)", color: "#ea580c",
                          border: "1px solid rgba(234,88,12,0.2)",
                          fontFamily: "JetBrains Mono, monospace",
                          textTransform: "capitalize",
                        }}>
                          {article.category}
                        </span>
                        <span style={{ fontSize: 10, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>
                          {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: 13, fontWeight: 600, color: "#fdf6f0",
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
                          fontSize: 11, color: "#8a7a6a", lineHeight: 1.5,
                          fontFamily: "JetBrains Mono, monospace",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {article.description}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: "rgba(253,246,240,0.3)", marginTop: 10, fontFamily: "JetBrains Mono, monospace" }}>
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
              marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,180,120,0.14)"
            }}>
              <p style={{ fontSize: 12, color: "#8a7a6a", fontFamily: "JetBrains Mono, monospace" }}>
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
                      background: "rgba(255,237,213,0.05)", border: "1px solid rgba(255,180,120,0.14)",
                      color: btn.disabled ? "rgba(253,246,240,0.2)" : "#8a7a6a",
                      opacity: btn.disabled ? 0.4 : 1, transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!btn.disabled) {
                        e.currentTarget.style.color = "#ea580c"
                        e.currentTarget.style.borderColor = "rgba(234,88,12,0.4)"
                        e.currentTarget.style.background = "rgba(234,88,12,0.1)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!btn.disabled) {
                        e.currentTarget.style.color = "#8a7a6a"
                        e.currentTarget.style.borderColor = "rgba(255,180,120,0.14)"
                        e.currentTarget.style.background = "rgba(255,237,213,0.05)"
                      }
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
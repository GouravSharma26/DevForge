"use client"

import { useState } from "react"
import { useNews } from "@/hooks/useNews"
import { useBookmarkStore } from "@/store/bookmark.store"
import Link from "next/link"

const CATEGORIES = [
  { label: "All",        value: undefined },
  { label: "Technology", value: "technology" },
  { label: "Science",    value: "science" },
  { label: "Business",   value: "business" },
  { label: "Security",   value: "security" },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useNews(activeCategory, page)
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarkCount = Object.keys(bookmarks).length

  function handleCategory(value: string | undefined) {
    setActiveCategory(value)
    setPage(1)
  }

  return (
    <main className="px-4 md:px-8 py-8 max-w-[1600px] mx-auto min-h-full">
      {/* Header Section */}
      <section className="mb-12 fade-up">
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface mb-2">
          Good morning, Engineer
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 opacity-80">
          Your daily digest of critical technology news and developments.
        </p>
        
        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 font-mono-code text-mono-code">
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary glow-active"></span>
            <span className="text-primary font-semibold">32</span>
            <span className="text-on-surface-variant">New Articles</span>
          </div>
          <Link href="/news/bookmarks" className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 hover:border-tertiary transition-colors cursor-pointer group">
            <span className="text-tertiary text-sm group-hover:scale-110 transition-transform">★</span>
            <span className="text-tertiary font-semibold">{bookmarkCount}</span>
            <span className="text-on-surface-variant">Bookmarked</span>
          </Link>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mb-8 overflow-x-auto pb-4 fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-3 min-w-max">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => handleCategory(cat.value)}
                className={`px-5 py-2 rounded-full font-mono-label text-mono-label transition-all ${
                  active
                    ? "text-primary bg-primary/10 border border-primary glow-active"
                    : "text-on-surface-variant bg-surface-container border border-transparent hover:border-white/10 hover:bg-surface-container-high"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max fade-up">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`glass-panel rounded-xl h-[360px] animate-pulse ${i === 0 ? 'lg:col-span-2' : ''}`} />
          ))}
        </section>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-20 text-on-surface-variant font-mono-code fade-up">
          Failed to load telemetry. Is the backend running?
        </div>
      )}

      {/* News Grid */}
      {data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max fade-up" style={{ animationDelay: '0.2s' }}>
            {data.articles.map((article: any, index: number) => {
              const isFeatured = index === 0;
              const hasImage = !!article.imageUrl;

              return (
                <article 
                  key={article.id} 
                  onClick={() => window.open(article.url, '_blank')}
                  className={`glass-panel rounded-xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-[1.01] hover:border-primary/50 flex flex-col relative ${isFeatured ? 'lg:col-span-2' : ''}`}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article);
                    }}
                    className={`absolute top-4 right-4 z-30 p-2 rounded-full glass-panel hover:bg-surface-container-high transition-colors ${isBookmarked(article.id) ? 'text-tertiary' : 'text-on-surface-variant'}`}
                    aria-label="Bookmark"
                  >
                    ★
                  </button>
                  {isFeatured && <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none"></div>}
                  
                  {hasImage && (
                    <div className={`${isFeatured ? 'h-64 md:h-80' : 'h-48'} w-full overflow-hidden shrink-0`}>
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}

                  <div className={`p-6 flex flex-col flex-1 relative z-20 ${isFeatured && hasImage ? '-mt-32 md:-mt-40' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-mono-label text-mono-label border border-primary/20 uppercase">
                        {article.category || 'Tech'}
                      </span>
                      <span className="text-on-surface-variant font-mono-code text-[11px] uppercase">
                        {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    
                    <h3 className={`${isFeatured ? 'font-headline-lg text-headline-lg' : 'font-headline-lg-mobile text-headline-lg-mobile'} font-bold text-on-surface mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-3`}>
                      {article.title}
                    </h3>
                    
                    {article.description && (
                      <p className="font-body-md text-body-md text-on-surface-variant opacity-90 line-clamp-2 md:line-clamp-3 mt-auto">
                        {article.description}
                      </p>
                    )}

                    <p className="font-mono-code text-[10px] text-code-gray mt-4 opacity-50">
                      {article.source}
                    </p>
                  </div>
                </article>
              )
            })}
          </section>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/10 font-mono-code fade-up">
            <p className="text-on-surface-variant text-[12px]">
              Page {data.pagination.page} of {data.pagination.totalPages} — {data.pagination.total} signals found
            </p>
            <div className="flex gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:hover:text-on-surface-variant disabled:hover:border-white/10 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:hover:text-on-surface-variant disabled:hover:border-white/10 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
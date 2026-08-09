"use client"

import { useBookmarkStore } from "@/store/bookmark.store"
import Link from "next/link"

export default function BookmarksPage() {
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarkStore()
  
  const bookmarkedArticles = Object.values(bookmarks).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return (
    <main className="px-4 md:px-8 py-8 max-w-[1600px] mx-auto min-h-full">
      {/* Header Section */}
      <section className="mb-12 fade-up">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/news" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-mono-code">
            ← Back to News
          </Link>
        </div>
        <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface mb-2">
          Saved Intelligence
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 opacity-80">
          Your personal repository of critical technology updates.
        </p>
        
        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 font-mono-code text-mono-code">
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-tertiary text-sm">★</span>
            <span className="text-tertiary font-semibold">{bookmarkedArticles.length}</span>
            <span className="text-on-surface-variant">Bookmarked</span>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {bookmarkedArticles.length === 0 && (
        <div className="text-center py-20 text-on-surface-variant font-mono-code fade-up">
          No articles bookmarked yet. <br />
          <Link href="/news" className="text-primary hover:underline mt-4 inline-block">
            Discover breaking news →
          </Link>
        </div>
      )}

      {/* News Grid */}
      {bookmarkedArticles.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max fade-up" style={{ animationDelay: '0.1s' }}>
          {bookmarkedArticles.map((article, index) => {
            const hasImage = !!article.imageUrl;

            return (
              <article 
                key={article.id} 
                onClick={() => window.open(article.url, '_blank')}
                className="glass-panel rounded-xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:scale-[1.01] hover:border-tertiary/50 flex flex-col relative"
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
                
                {hasImage && (
                  <div className="h-48 w-full overflow-hidden shrink-0">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1 relative z-20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 rounded bg-tertiary/10 text-tertiary font-mono-label text-mono-label border border-tertiary/20 uppercase">
                      {article.category || 'Tech'}
                    </span>
                    <span className="text-on-surface-variant font-mono-code text-[11px] uppercase">
                      {new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface mb-3 group-hover:text-tertiary transition-colors duration-300 line-clamp-3">
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
      )}
    </main>
  )
}

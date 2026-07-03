interface Article {
  id: string
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  source: string
  category: string
  publishedAt: string
}

export function NewsCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/40"
    >
      {article.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
            {article.category}
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(article.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 group-hover:text-white transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-zinc-500 line-clamp-2">{article.description}</p>
        )}
        <p className="text-xs text-zinc-600 font-medium">{article.source}</p>
      </div>
    </a>
  )
}
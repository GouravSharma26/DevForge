interface Path {
  id: string
  title: string
  description: string
  icon: string
  level: string
  totalTopics: number
  isEnrolled: boolean
  completedTopics: number
  progressPercent: number
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "text-green-400 bg-green-400/10 border-green-400/20",
  MID: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  SENIOR: "text-red-400 bg-red-400/10 border-red-400/20",
}

export function PathCard({
  path,
  onEnroll,
  onClick,
}: {
  path: Path
  onEnroll: (id: string) => void
  onClick: (id: string) => void
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-3xl">{path.icon}</span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_COLORS[path.level]}`}
        >
          {path.level}
        </span>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-white">{path.title}</h3>
        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{path.description}</p>
      </div>

      {/* Progress */}
      {path.isEnrolled && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{path.completedTopics} / {path.totalTopics} topics</span>
            <span>{path.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${path.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!path.isEnrolled && (
        <p className="text-xs text-zinc-600">{path.totalTopics} topics</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {path.isEnrolled ? (
          <button
            onClick={() => onClick(path.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={() => onEnroll(path.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            Enroll
          </button>
        )}
      </div>
    </div>
  )
}
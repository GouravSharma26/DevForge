interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

// Renamed to Card — matches the image's card-based UI
export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div
      className={`
        bg-[#16163a] border border-[#1f1f45] rounded-2xl overflow-hidden
        transition-all duration-200
        ${glow ? "shadow-[0_0_20px_#7c3aed20,0_4px_24px_rgba(0,0,0,0.4)]" : "shadow-[0_4px_24px_rgba(0,0,0,0.4)]"}
        ${className}
      `}
      style={{ backdropFilter: "blur(12px)" }}
    >
      {children}
    </div>
  )
}

// Keep Terminal as alias for backward compat
export function Terminal({ children, className = "" }: CardProps) {
  return <Card className={className}>{children}</Card>
}
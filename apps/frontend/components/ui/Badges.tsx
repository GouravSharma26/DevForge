interface BadgeProps {
  children: React.ReactNode
  variant?: "purple" | "green" | "red" | "yellow" | "gray"
}

const VARIANTS = {
  purple: "border-[#7c3aed40] text-[#a855f7] bg-[#7c3aed15]",
  green:  "border-[#10b98140] text-[#10b981] bg-[#10b98115]",
  red:    "border-[#ef444440] text-[#ef4444] bg-[#ef444415]",
  yellow: "border-[#f59e0b40] text-[#f59e0b] bg-[#f59e0b15]",
  gray:   "border-[#2a2a5a] text-[#5a5780] bg-[#ffffff05]",
}

export function Badge({ children, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
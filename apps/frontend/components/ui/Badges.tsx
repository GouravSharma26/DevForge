interface BadgeProps {
  children: React.ReactNode
  variant?: "purple" | "green" | "red" | "yellow" | "gray"
}

const VARIANTS = {
  purple: "border-[#ea580c40] text-[#f59e0b] bg-[#ea580c15]",
  green:  "border-[#10b98140] text-[#10b981] bg-[#10b98115]",
  red:    "border-[#ef444440] text-[#ef4444] bg-[#ef444415]",
  yellow: "border-[#eab30840] text-[#eab308] bg-[#eab30815]",
  gray:   "border-[rgba(255,180,120,0.14)] text-[#d4a373] bg-[#1c1712]",
}

export function Badge({ children, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
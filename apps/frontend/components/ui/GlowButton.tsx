interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function GlowButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: GlowButtonProps) {
  const variants = {
    primary: `
      bg-purple-gradient text-white
      hover:shadow-[0_0_20px_#7c3aed50]
      disabled:opacity-40 disabled:shadow-none
    `,
    secondary: `
      bg-[#16163a] border border-[#2a2a5a] text-[#a09dc0]
      hover:border-[#7c3aed50] hover:text-[#f1f0ff] hover:bg-[#1c1c45]
    `,
    danger: `
      bg-[#16163a] border border-[#ef444430] text-[#ef4444]
      hover:bg-[#ef444410] hover:border-[#ef444460]
    `,
    ghost: `
      text-[#5a5780] hover:text-[#a09dc0] hover:bg-[#16163a]
    `,
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-sm rounded-xl",
  }

  return (
    <button
      className={`
        font-mono font-medium transition-all duration-200 cursor-pointer
        disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
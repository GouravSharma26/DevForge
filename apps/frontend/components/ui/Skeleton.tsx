export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-theme/80 border border-border/50 ${className}`}
      {...props}
    />
  )
}

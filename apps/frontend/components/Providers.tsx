"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { ThemeProvider } from "@/components/ThemeProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const hydrate = useAuthStore((s) => s.hydrate)
  const pathname = usePathname()

  useEffect(() => {
    hydrate()
  }, [])

  const isLandingPage = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const forceEmber = isLandingPage || isAuthPage

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="ember"
      enableSystem={false}
      forcedTheme={forceEmber ? "ember" : undefined}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { AppShell } from "@/components/ui/AppShell"

export const metadata: Metadata = {
  title: "DevForge",
  description: "Practice. Battle. Get Hired.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen antialiased"
        style={{ 
          background: "radial-gradient(circle at 30% 20%, #c2591b33, transparent 60%), radial-gradient(circle at 80% 80%, #7c2d1233, transparent 60%), #171210", 
          color: "#fdf6f0" 
        }}
        suppressHydrationWarning
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
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
        style={{ background: "#0d0d1a", color: "#f1f0ff" }}
        suppressHydrationWarning
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
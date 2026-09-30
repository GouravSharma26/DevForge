import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { AppShell } from "@/components/ui/AppShell"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "DevForge",
  description: "Practice. Battle. Get Hired.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-base text-primary">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
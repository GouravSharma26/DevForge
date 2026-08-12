import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { AppShell } from "@/components/ui/AppShell"
import { ThemeProvider } from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: "DevForge",
  description: "Practice. Battle. Get Hired.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-base text-primary">
        <ThemeProvider attribute="class" defaultTheme="ember" enableSystem={false}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
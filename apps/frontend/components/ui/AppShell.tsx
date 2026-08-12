"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Anvil, User, Settings, LogOut, Moon, Sun, Flame, HelpCircle } from "lucide-react"
import { Navbar } from "./Navbar"
import { useAuthStore } from "@/store/auth.store"
import { useMe } from "@/hooks/useUser"
import { useTheme } from "next-themes"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const logout = useAuthStore((s) => s.logout)
  const pathname = usePathname()
  const router = useRouter()
  const isLandingPage = pathname === "/"
  const [profileOpen, setProfileOpen] = useState(false)
  const { data: user } = useMe()
  const { theme, setTheme } = useTheme()

  // Calculate Credits
  let displayCredits = ""
  if (user) {
    if (user.role === "ADMIN") {
      displayCredits = "ult"
    } else {
      let count = user.aiRequestCount || 0
      if (user.lastAiRequestAt) {
        const hours = (new Date().getTime() - new Date(user.lastAiRequestAt).getTime()) / (1000 * 60 * 60)
        if (hours >= 24) count = 0
      }
      const remaining = Math.max(0, 3 - count)
      displayCredits = `${remaining * 5}$`
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-14 w-full" />
      
      {/* Dynamic Header */}
      <header 
        className={`fixed z-[60] h-14 flex items-center justify-between px-4 transition-all duration-700 ease-in-out backdrop-blur-xl ${
          scrolled && isLandingPage
            ? "top-4 left-4 right-4 rounded-2xl bg-glass border border-border shadow-lg max-w-[1200px] mx-auto"
            : "top-0 left-0 right-0 border-b border-border bg-base/80"
        }`}
      >
        <div className="flex items-center gap-3">
        {token && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="w-9 h-9 rounded-lg bg-accent/5 border border-[#ffb478]/14 flex items-center justify-center text-secondary hover:text-primary hover:border-accent/50 transition-all duration-200 shrink-0"
          >
            <div className="w-4 flex flex-col gap-[3px]">
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "rotate-45 translate-y-[4.5px]" : ""}`} />
              <span className={`h-[1.5px] bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
            </div>
          </button>
        )}
        <Link href={token ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
            <Anvil size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="font-mono font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-accent to-highlight">
            DevForge
          </span>
        </Link>
        </div>
        
        {!token && hydrated && (
          <>
            <nav className="hidden md:flex items-center gap-6 font-mono text-sm text-muted">
              <button onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors cursor-pointer">Master the Code</button>
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors cursor-pointer">7 features</button>
              <button onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors cursor-pointer">Level up</button>
            </nav>
            <div className="flex items-center gap-4 font-mono">
              <Link href="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                Log in
              </Link>
              <Link href="/login?register=true" className="text-sm font-bold bg-[linear-gradient(135deg,#ea580c,#d97706)] text-primary px-4 py-1.5 rounded-lg shadow-[0_4px_24px_rgba(234,88,12,0.4)] hover:shadow-[0_8px_32px_rgba(234,88,12,0.6)] transition-all">
                Sign up
              </Link>
            </div>
          </>
        )}
        {token && hydrated && !isLandingPage && (
          <div className="relative flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-theme border border-accent/30 shadow-[0_0_10px_rgba(234,88,12,0.1)]">
                <span className="text-xs font-mono text-muted">Credits:</span>
                <span className={`text-xs font-bold font-mono ${displayCredits === 'ult' ? 'text-highlight' : 'text-accent'}`}>{displayCredits}</span>
              </div>
            )}
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-surface-theme border border-border flex items-center justify-center hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-all text-muted"
            >
              <User size={16} strokeWidth={2.5} />
            </button>
            
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-base/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden font-mono text-sm">
                  <div className="p-2 space-y-1">
                    <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary hover:bg-card transition-colors">
                      <User size={16} className="text-muted" /> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary hover:bg-card transition-colors">
                      <Settings size={16} className="text-muted" /> Settings
                    </Link>
                    <Link href="/about" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary hover:bg-card transition-colors">
                      <HelpCircle size={16} className="text-muted" /> About
                    </Link>
                  </div>
                  
                  <div className="h-px bg-card w-full my-1" />
                  
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-xs text-muted uppercase tracking-wider mb-1">Theme</div>
                    <div className="flex items-center justify-between gap-1">
                      <button 
                        onClick={() => { setTheme("dark"); setProfileOpen(false) }} 
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-accent bg-accent/10' : 'text-muted hover:bg-surface-theme/50 hover:text-primary'}`}
                      >
                        <Moon size={16} /> <span className="text-[10px]">Dark</span>
                      </button>
                      <button 
                        onClick={() => { setTheme("ember"); setProfileOpen(false) }} 
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${theme === 'ember' ? 'text-accent bg-accent/10' : 'text-muted hover:bg-surface-theme/50 hover:text-primary'}`}
                      >
                        <Flame size={16} /> <span className="text-[10px]">Ember</span>
                      </button>
                      <button 
                        onClick={() => { setTheme("light"); setProfileOpen(false) }} 
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-accent bg-accent/10' : 'text-muted hover:bg-surface-theme/50 hover:text-primary'}`}
                      >
                        <Sun size={16} /> <span className="text-[10px]">Light</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-px bg-card w-full my-1" />
                  
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        logout()
                        setProfileOpen(false)
                        router.push("/")
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-left"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <Navbar open={open} />

      <main
        className={`transition-[margin] duration-300 ${token && open ? "ml-[252px]" : "ml-0"}`}
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        {hydrated ? children : null}
      </main>
    </>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Navbar } from "./Navbar"
import { useAuthStore } from "@/store/auth.store"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const token = useAuthStore((s) => s.token)

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
          scrolled 
            ? "top-4 left-4 right-4 rounded-2xl bg-surface-container/80 border border-white/10 shadow-lg max-w-[1200px] mx-auto"
            : "top-0 left-0 right-0 border-b border-white/10 bg-background/50"
        }`}
      >
        <div className="flex items-center gap-3">
        {token && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="w-9 h-9 rounded-lg bg-[#ea580c]/5 border border-[#ffb478]/14 flex items-center justify-center text-[#d4a373] hover:text-[#fdf6f0] hover:border-[#ea580c]/50 transition-all duration-200 shrink-0"
          >
            <div className="w-4 flex flex-col gap-[3px]">
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "rotate-45 translate-y-[4.5px]" : ""}`} />
              <span className={`h-[1.5px] bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
            </div>
          </button>
        )}
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ea580c] to-[#f59e0b] flex items-center justify-center">
            <span className="text-white text-xs font-bold">⚔</span>
          </div>
          <span className="font-mono font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] to-[#f59e0b]">
            DevForge
          </span>
        </a>
        </div>
      </header>

      <Navbar open={open} />

      <div
        className={`transition-[margin] duration-300 ${token && open ? "ml-56" : "ml-0"}`}
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        {children}
      </div>
    </>
  )
}
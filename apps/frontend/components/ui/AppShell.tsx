"use client"

import { useState } from "react"
import { Navbar } from "./Navbar"
import { useAuthStore } from "@/store/auth.store"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const token = useAuthStore((s) => s.token)

  return (
    <>
      {/* Persistent top strip — always reserves its own space, nothing sits on top of it */}
      <header className="sticky top-0 z-[60] h-14 flex items-center gap-3 px-4 border-b border-[#1f1f45] bg-[#0d0d1a]/90 backdrop-blur-xl">
        {token && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="w-9 h-9 rounded-lg bg-[#16163a] border border-[#1f1f45] flex items-center justify-center text-[#a09dc0] hover:text-[#f1f0ff] hover:border-[#2a2a5a] transition-all duration-200 shrink-0"
          >
            <div className="w-4 flex flex-col gap-[3px]">
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "rotate-45 translate-y-[4.5px]" : ""}`} />
              <span className={`h-[1.5px] bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-[1.5px] bg-current transition-transform duration-200 ${open ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
            </div>
          </button>
        )}
        <a href="/landing" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center">
            <span className="text-white text-xs font-bold">⚔</span>
          </div>
          <span className="font-mono font-bold text-[#f1f0ff] text-sm">
            Dev<span className="text-[#a855f7]">Forge</span>
          </span>
        </a>
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
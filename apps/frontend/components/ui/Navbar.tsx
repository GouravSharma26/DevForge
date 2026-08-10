"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Newspaper, FileText, Mic, Puzzle, Zap, Anvil } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { useInterviews } from "@/hooks/useResume"

export function Navbar({ open }: { open: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  
  const { data: interviews } = useInterviews()
  const completedInterviews = interviews?.filter((i: any) => i.status === "COMPLETED") || []
  const readinessScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc: number, i: any) => acc + (i.score || 0), 0) / completedInterviews.length)
    : 0

  if (!token) return null

  const NavItem = ({ href, label, icon: Icon }: { href: string, label: string, icon: any }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[12px] transition-colors ${
          active 
            ? "bg-[rgba(234,88,12,0.14)] text-[#f59e0b]" 
            : "text-[#d4a373] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#fdf6f0]"
        }`}
      >
        <span className="w-4 flex items-center justify-center"><Icon size={14} /></span>
        {label}
      </Link>
    )
  }

  const GroupTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[9.5px] text-[#8a7a6a] uppercase tracking-[0.07em] px-2.5 mt-3.5 mb-1.5 font-mono">
      {children}
    </div>
  )

  return (
    <aside
      className={`fixed left-4 top-20 bottom-4 w-[220px] bg-[rgba(255,237,213,0.05)] backdrop-blur-[16px] border border-[rgba(255,180,120,0.14)] rounded-[18px] p-[18px_14px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col z-50 transition-transform duration-300 font-mono ${
        open ? "translate-x-0" : "-translate-x-[250px]"
      }`}
    >
      <Link href="/dashboard" className="flex items-center gap-2 font-extrabold text-[13px] px-1.5 mb-5.5 text-[#fdf6f0] hover:opacity-80 transition-opacity">
        <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-[#ea580c] to-[#f59e0b] flex items-center justify-center">
          <Anvil size={12} className="text-white" strokeWidth={3} />
        </div>
        DevForge
      </Link>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <GroupTitle>Overview</GroupTitle>
        <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem href="/news" label="News" icon={Newspaper} />

        <GroupTitle>Forge</GroupTitle>
        <NavItem href="/resume" label="Resumes" icon={FileText} />
        <NavItem href="/interview" label="Interview Hub" icon={Mic} />

        <GroupTitle>Practice</GroupTitle>
        <NavItem href="/problems" label="Problems" icon={Puzzle} />
        <NavItem href="/arena" label="PvP Arena" icon={Zap} />
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-3">
        <div className="p-3 rounded-[12px] bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.2)]">
          <div className="text-[9.5px] text-[#8a7a6a] mb-1.5 uppercase tracking-[0.05em]">Readiness</div>
          <div className="h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-gradient-to-r from-[#ea580c] to-[#f59e0b]" style={{ width: `${readinessScore}%` }}></div>
          </div>
          <div className="text-[11px] font-bold text-[#f59e0b]">{readinessScore}%</div>
        </div>

        <button
          onClick={() => {
            useAuthStore.getState().logout()
            router.push("/") // Ensure logout goes to landing page
          }}
          className="w-full text-left px-2.5 py-2 rounded-[9px] text-[11px] text-[#8a7a6a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
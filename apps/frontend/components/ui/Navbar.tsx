"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "News",     href: "/news" },
  { label: "Paths",    href: "/paths" },
  { label: "Practice", href: "/problems" },
  { label: "Arena",    href: "/arena" },
  { label: "Resume",   href: "/resume" },
  { label: "Interviews", href: "/interview" },
]

export function Navbar({ open }: { open: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)

  // if (pathname === "/landing") return null

  if (!token) return null

  return (
    <aside
      className={`fixed left-0 top-14 h-[calc(100vh-56px)] w-56 border-r border-[#ffb478]/14 bg-[#171210] flex flex-col z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[rgba(217,119,6,0.18)] text-[#fed7aa] border border-[rgba(253,186,116,0.45)] shadow-[0_4px_20px_rgba(234,88,12,0.1)] backdrop-blur-[8px]"
                  : "text-[#8a7a6a] hover:text-[#f59e0b] hover:bg-[#ea580c]/10 border border-transparent"
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#ffb478]/14 shrink-0">
        <button
          onClick={() => {
            useAuthStore.getState().logout()
            router.push("/login")
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#8a7a6a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 font-mono transition-colors"
        >
          logout
        </button>
      </div>
    </aside>
  )
}
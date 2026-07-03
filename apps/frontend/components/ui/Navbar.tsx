"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

const NAV_ITEMS = [
  { label: "News",     href: "/news" },
  { label: "Paths",    href: "/paths" },
  { label: "Practice", href: "/problems" },
  { label: "Arena",    href: "/arena" },
  { label: "Resume",   href: "/resume" },
]

export function Navbar({ open }: { open: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)

  // if (pathname === "/landing") return null

  if (!token) return null

  return (
    <aside
      className={`fixed left-0 top-14 h-[calc(100vh-56px)] w-56 border-r border-[#1f1f45] bg-[#0d0d1a] flex flex-col z-50 transition-transform duration-300 ${
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
                  ? "bg-[#7c3aed20] text-[#a855f7] border border-[#7c3aed30]"
                  : "text-[#5a5780] hover:text-[#a09dc0] hover:bg-[#16163a] border border-transparent"
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#1f1f45] shrink-0">
        <button
          onClick={() => {
            useAuthStore.getState().logout()
            router.push("/login")
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#5a5780] hover:text-[#ef4444] hover:bg-[#16163a] font-mono transition-colors"
        >
          logout
        </button>
      </div>
    </aside>
  )
}
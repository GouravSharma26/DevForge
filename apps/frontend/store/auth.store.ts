import { create } from "zustand"

interface User {
  id: string
  username: string
  email: string
  xp: number
  streak: number
  role?: string
  aiRequestCount?: number
}

interface AuthStore {
  user: User | null
  token: string | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  hydrate: () => {
    // Assuming backend sets a cookie, we just consider it hydrated. 
    // In a real app we might fetch /api/auth/me to get the user.
    // For now we just mark hydrated.
    set({ hydrated: true })
  },

  setAuth: (user) => {
    set({ user })
  },

  logout: async () => {
    try {
      // We must await an import to avoid circular dependency if we imported api at the top
      const { api } = await import("@/lib/api")
      await api.post("/auth/logout")
    } catch {
      // Ignore errors if already logged out
    }
    set({ user: null })
  },
}))
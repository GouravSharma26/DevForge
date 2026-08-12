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
    const token = localStorage.getItem("access_token")
    set({ token, hydrated: true })
  },

  setAuth: (user, token) => {
    localStorage.setItem("access_token", token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem("access_token")
    set({ user: null, token: null })
  },
}))
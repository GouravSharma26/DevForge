import { create } from "zustand"
import axios from "axios"

// Plain axios (not the shared `api` instance) is used for the session probe so the
// shared 401 interceptor does not redirect anonymous visitors to /login.
// API requests go through Next.js proxy now
// The session lives in an httpOnly cookie, so JS never sees a JWT. `token` is kept only as a
// truthy "session present" marker for the existing `if (!token)` page guards. Remove it once
// those guards are migrated to check `user`.
const SESSION_MARKER = "cookie-session"

// Bumped whenever auth state is set explicitly (login/logout). An in-flight hydrate() whose
// epoch no longer matches is stale and must not overwrite newer state.
let authEpoch = 0

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
  setAuth: (user: User) => void
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  hydrate: async () => {
    const epoch = authEpoch
    try {
      const res = await axios.get(`/api/user/me`, { withCredentials: true })
      if (epoch !== authEpoch) return
      const user = res.data?.data ?? null
      set({ user, token: user ? SESSION_MARKER : null, hydrated: true })
    } catch {
      if (epoch !== authEpoch) return
      set({ user: null, token: null, hydrated: true })
    }
  },

  setAuth: (user) => {
    authEpoch++
    set({ user, token: SESSION_MARKER, hydrated: true })
  },

  logout: async () => {
    authEpoch++
    try {
      // We must await an import to avoid circular dependency if we imported api at the top
      const { api } = await import("@/lib/api")
      await api.post("/auth/logout")
    } catch {
      // Ignore errors if already logged out
    }
    set({ user: null, token: null })
  },
}))

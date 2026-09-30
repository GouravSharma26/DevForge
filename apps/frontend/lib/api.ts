import axios from "axios"
import { useAuthStore } from "@/store/auth.store"
import { toast } from "sonner"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
})

// Removed manual auth header interceptor since we use httpOnly cookies now

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err?.config?.url?.includes("/auth/login") ||
      err?.config?.url?.includes("/auth/register")

    if (err.response?.status === 401 && !isAuthRoute) {
      useAuthStore.setState({ user: null })
      window.location.href = "/login"
    }
    
    if (err.response?.status === 429) {
      toast.error("Credits exhausted. Credits restores after 24hrs.")
    }

    return Promise.reject(err)
  }
)
import axios from "axios"
import { useAuthStore } from "@/store/auth.store"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token || localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err?.config?.url?.includes("/auth/login") ||
      err?.config?.url?.includes("/auth/register")

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("access_token")
      useAuthStore.setState({ token: null, user: null })
      window.location.href = "/login"
    }
    
    if (err.response?.status === 429) {
      alert("Credits exhausted. Credits restores after 24hrs.")
    }

    return Promise.reject(err)
  }
)
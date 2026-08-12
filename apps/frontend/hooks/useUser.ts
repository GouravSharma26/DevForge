import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"

export function useMe() {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await api.get("/user/me")
      return res.data.data
    },
    enabled: !!token,
  })
}

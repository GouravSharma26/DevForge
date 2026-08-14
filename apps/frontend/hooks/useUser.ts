import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { username?: string, bio?: string, targetRole?: string, avatar?: string }) => {
      const res = await api.patch("/user/me", data)
      return res.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user", "me"], data)
      useAuthStore.setState({ user: data })
    }
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function usePaths() {
  return useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await api.get("/paths")
      return res.data.data
    },
  })
}

export function usePath(id: string) {
  return useQuery({
    queryKey: ["paths", id],
    queryFn: async () => {
      const res = await api.get(`/paths/${id}`)
      return res.data.data
    },
  })
}

export function useEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pathId: string) => api.post(`/paths/${pathId}/enroll`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paths"] }),
  })
}

export function useMarkComplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ topicId, completed }: { topicId: string; completed: boolean }) =>
      api.post(`/paths/progress/${topicId}`, { completed }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["paths"] })
    },
  })
}
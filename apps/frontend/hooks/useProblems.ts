import { useQuery, useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useProblems(difficulty?: string, page = 1) {
  return useQuery({
    queryKey: ["problems", difficulty, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (difficulty) params.append("difficulty", difficulty)
      const res = await api.get(`/problems?${params}`)
      return res.data.data
    },
  })
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: ["problems", slug],
    queryFn: async () => {
      const res = await api.get(`/problems/${slug}`)
      return res.data.data
    },
    enabled: !!slug,
  })
}

export function useSubmit() {
  return useMutation({
    mutationFn: ({
      id,
      code,
      language,
    }: {
      id: string
      code: string
      language: string
    }) => api.post(`/problems/${id}/submit`, { code, language }),
  })
}
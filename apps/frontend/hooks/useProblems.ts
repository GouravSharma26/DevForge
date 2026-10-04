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

export function useRecommendedProblems() {
  return useQuery({
    queryKey: ["problems", "recommended"],
    queryFn: async () => {
      const res = await api.get('/problems/recommended')
      return res.data.data
    },
  })
}

export function useProblem(slug: string, mode?: string | null) {
  return useQuery({
    queryKey: ["problems", slug, mode],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (mode) params.append("mode", mode)
      const res = await api.get(`/problems/${slug}?${params.toString()}`)
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
      nodeId,
    }: {
      id: string
      code: string
      language: string
      nodeId?: string | null
    }) => api.post(`/problems/${id}/submit`, { code, language, nodeId }),
  })
}
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useNews(category?: string, page = 1) {
  return useQuery({
    queryKey: ["news", category, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (category) params.append("category", category)
      const res = await api.get(`/news?${params}`)
      return res.data.data
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  })
}
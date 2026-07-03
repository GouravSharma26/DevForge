import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useResumeBuilder() {
  return useQuery({
    queryKey: ["resume-builder"],
    queryFn: async () => {
      const res = await api.get("/resume/builder")
      return res.data.data
    },
  })
}

export function useSaveResumeBuilder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sections, template }: { sections: any[]; template: string }) => {
      const res = await api.post("/resume/builder", { sections, template })
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resume-builder"] }),
  })
}

export function useAIFillResume() {
  return useMutation({
    mutationFn: async (sections: any[]) => {
      const res = await api.post("/resume/builder/ai-fill", { sections })
      return res.data.data
    },
  })
}

export function useDeleteResumeBuilder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/resume/builder")
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resume-builder"] }),
  })
}
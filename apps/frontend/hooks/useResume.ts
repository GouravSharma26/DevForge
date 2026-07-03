import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useResume() {
  return useQuery({
    queryKey: ["resume"],
    queryFn: async () => {
      const res = await api.get("/resume")
      return res.data.data
    },
  })
}

export function useUpdateResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      skills?: string[]
      gaps?: string[]
      targetRole?: string
      suggestions?: any[]
    }) => {
      const res = await api.patch("/resume", data)
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resume"] }),
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await api.post("/resume/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resume"] }),
  })
}

export function useStartInterview() {
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const res = await api.post("/resume/interview", { resumeId })
      return res.data.data
    },
  })
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      const res = await api.get(`/resume/interview/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useSubmitAnswer(interviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      questionId,
      answer,
    }: {
      questionId: string
      answer: string
    }) => {
      const res = await api.post(`/resume/interview/${interviewId}/answer`, {
        questionId,
        answer,
      })
      return res.data.data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] }),
  })
}

export function useCompleteInterview(interviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/resume/interview/${interviewId}/complete`)
      return res.data.data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] }),
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/resume")
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resume"] })
      qc.invalidateQueries({ queryKey: ["resume-builder"] })
    },
  })
}
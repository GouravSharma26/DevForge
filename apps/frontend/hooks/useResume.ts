import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Resume, Interview, JDMatch } from "@devforge/shared-types"
import { useAuthStore } from "@/store/auth.store"

// ─── Fetch List of Resumes ───
export function useResumes() {
  const token = useAuthStore((s) => s.token)
  return useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await api.get("/resume")
      return res.data.data
    },
    enabled: !!token,
  })
}

// ─── Fetch Single Resume ───
export function useResume(id: string) {
  return useQuery<Resume>({
    queryKey: ["resume", id],
    queryFn: async () => {
      const res = await api.get(`/resume/${id}`)
      return res.data.data
    },
    enabled: !!id, // Only fetch if ID is provided
  })
}

export function useAnalyzeResume(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/resume/${id}/analyze`)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", id] })
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
    }
  })
}

export function useUpdateResume(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      profileName?: string
      skills?: string[]
      gaps?: string[]
      targetRole?: string
      suggestions?: any[]
    }) => {
      const res = await api.patch(`/resume/${id}`, data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
      queryClient.invalidateQueries({ queryKey: ["resume", id] })
    },
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, skipAI = false }: { file: File, skipAI?: boolean }) => {
      const form = new FormData()
      form.append("file", file)
      const url = skipAI ? "/resume/upload?skipAI=true" : "/resume/upload"
      const res = await api.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/resume/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] })
    },
  })
}

export function useForkResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, profileName }: { id: string; profileName: string }) => {
      const res = await api.post(`/resume/${id}/fork`, { profileName })
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
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
  return useQuery<Interview>({
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
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const res = await api.post(`/resume/interview/${interviewId}/answer`, { questionId, answer })
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interview", interviewId] }),
  })
}

export function useCompleteInterview(interviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/resume/interview/${interviewId}/complete`)
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interview", interviewId] }),
  })
}

export function useStartGrandmaster(interviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/resume/interview/${interviewId}/grandmaster`)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] })
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

export function useRunGrandmasterCode(interviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, code }: { questionId: string, code: string }) => {
      const res = await api.post(`/resume/interview/${interviewId}/question/${questionId}/run`, { code })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] })
    },
  })
}

export function useInterviews() {
  const token = useAuthStore((s) => s.token)
  return useQuery<Interview[]>({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await api.get("/resume/interviews")
      return res.data.data
    },
    enabled: !!token,
  })
}

export function useDeleteInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/resume/interview/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] })
    },
  })
}

// ─── NEW: JD Matching ───

export function useJDMatches(resumeId: string) {
  return useQuery({
    queryKey: ["jd-matches", resumeId],
    queryFn: async () => {
      const res = await api.get(`/resume/${resumeId}/jd-matches`)
      return res.data.data as JDMatch[]
    },
    enabled: !!resumeId,
  })
}

export function useCreateJDMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ resumeId, jdText }: { resumeId: string; jdText: string }) => {
      const res = await api.post(`/resume/${resumeId}/jd-match`, { jdText })
      return res.data.data as JDMatch
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["jd-matches", variables.resumeId] })
    }
  })
}

export function useUploadJDMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ resumeId, formData }: { resumeId: string; formData: FormData }) => {
      const res = await api.post(`/resume/${resumeId}/jd-match/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return res.data.data as JDMatch
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["jd-matches", variables.resumeId] })
    }
  })
}
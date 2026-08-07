import { z } from "zod"

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// ─── User ─────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  targetRole: z.string().nullable(),
  experienceLevel: z.enum(["BEGINNER", "MID", "SENIOR"]),
  xp: z.number(),
  streak: z.number(),
  createdAt: z.string(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type User = z.infer<typeof UserSchema>

// ─── Resume ───────────────────────────────────────────────────────────────────

export const ResumeSuggestionSchema = z.object({
  section: z.string(),
  issue: z.string(),
  fix: z.string(),
})

export const ResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileName: z.string(),
  originalText: z.string().optional(),
  skills: z.array(z.string()),
  experienceLevel: z.string(),
  targetRole: z.string().nullable().optional(),
  score: z.number(),
  skillsScore: z.number(),
  projectsScore: z.number(),
  writingScore: z.number(),
  atsScore: z.number(),
  suggestions: z.array(ResumeSuggestionSchema).or(z.unknown()),
  gaps: z.array(z.string()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type ResumeSuggestion = z.infer<typeof ResumeSuggestionSchema>
export type Resume = z.infer<typeof ResumeSchema>

// ─── Resume Builder ──────────────────────────────────────────────────────────

export const ResumeBuilderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sections: z.array(z.unknown()),
  template: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type ResumeBuilder = z.infer<typeof ResumeBuilderSchema>

// ─── Interview ────────────────────────────────────────────────────────────────

export const QuestionSchema = z.object({
  id: z.string(),
  interviewId: z.string(),
  round: z.number(),
  question: z.string(),
  context: z.string().nullable().optional(),
  userAnswer: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
})

export const InterviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resumeId: z.string(),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]),
  score: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  questions: z.array(QuestionSchema).optional(),
  resume: z.object({
    id: z.string(),
    profileName: z.string(),
    targetRole: z.string().nullable()
  }).optional()
})

export const JDMatchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resumeId: z.string(),
  companyName: z.string(),
  jobTitle: z.string(),
  jdText: z.string(),
  matchScore: z.number(),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  cultureFlags: z.array(z.object({
    flag: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    quote: z.string()
  })).optional(),
  createdAt: z.coerce.date(),
})

export type Question = z.infer<typeof QuestionSchema>
export type Interview = z.infer<typeof InterviewSchema>
export type JDMatch = z.infer<typeof JDMatchSchema>

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
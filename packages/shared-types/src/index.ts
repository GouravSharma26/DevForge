import { z } from "zod"

export const SUPPORTED_LANGUAGES = ["javascript", "python"] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes"),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
})

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
})

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  bio: z.string().max(500).optional().nullable(),
  targetRole: z.string().max(100).optional().nullable(),
  avatar: z.string().max(256 * 1024 * 1.4).regex(/^data:image\/(png|jpeg|webp);base64,/, "Avatar must be a PNG, JPEG, or WEBP data URL").optional().nullable(), // ~256KB base64
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
})

export const DeleteAccountSchema = z.object({
  password: z.string().min(1),
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
  level: z.number().optional(),
  rankTitle: z.string().optional(),
  elo: z.number().optional(),
  arenaWins: z.number().optional(),
  arenaLosses: z.number().optional(),
  arenaDraws: z.number().optional(),
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
  experienceLevel: z.enum(["BEGINNER", "MID", "SENIOR"]),
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
  title: z.string().nullable().optional(),
  type: z.string().optional(),
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
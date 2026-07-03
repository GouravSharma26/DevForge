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

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
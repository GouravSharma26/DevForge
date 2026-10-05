import { FastifyRequest, FastifyReply } from "fastify"
import bcrypt from "bcrypt"
import { prisma } from "@devforge/database"
import { RegisterSchema, LoginSchema } from "@devforge/shared-types"
import { z } from "zod"


export const AuthController = {
  async register(req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>, reply: FastifyReply) {
    const { username, email, password } = req.body

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing)
      return reply.status(409).send({ success: false, error: "User already exists" })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, email, password: hashed },
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, targetRole: true,
        experienceLevel: true, xp: true, streak: true, createdAt: true,
      },
    })

    const token = await reply.jwtSign({ id: user.id }, { expiresIn: "1h" })
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 3600,
    }

    reply.setCookie("access_token", token, cookieOptions)
    return reply.status(201).send({ success: true, data: { user } })
  },

  async login(req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>, reply: FastifyReply) {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)
      return reply.status(401).send({ success: false, error: "Invalid credentials" })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return reply.status(401).send({ success: false, error: "Invalid credentials" })

    const { password: _, ...safeUser } = user
    const token = await reply.jwtSign({ id: user.id }, { expiresIn: "1h" })
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 3600,
    }
    
    reply.setCookie("access_token", token, cookieOptions)
    return reply.send({ success: true, data: { user: safeUser } })
  },

  async logout(req: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("access_token", { 
      path: "/", 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production" 
    })
    return reply.send({ success: true })
  },
}
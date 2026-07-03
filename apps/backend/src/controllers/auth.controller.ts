import { FastifyRequest, FastifyReply } from "fastify"
import bcrypt from "bcrypt"
import { prisma } from "@devforge/database"
import { RegisterSchema, LoginSchema } from "@devforge/shared-types"

export const AuthController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const body = RegisterSchema.safeParse(req.body)
    if (!body.success)
      return reply.status(400).send({ success: false, error: body.error.message })

    const { username, email, password } = body.data

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
    return reply.status(201).send({ success: true, data: { token, user } })
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const body = LoginSchema.safeParse(req.body)
    if (!body.success)
      return reply.status(400).send({ success: false, error: body.error.message })

    const { email, password } = body.data
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)
      return reply.status(401).send({ success: false, error: "Invalid credentials" })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return reply.status(401).send({ success: false, error: "Invalid credentials" })

    const { password: _, ...safeUser } = user
    const token = await reply.jwtSign({ id: user.id }, { expiresIn: "1h" })
    return reply.send({ success: true, data: { token, user: safeUser } })
  },
}
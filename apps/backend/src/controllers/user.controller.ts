import { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "@devforge/database"

export const UserController = {
  async getMe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.user as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, targetRole: true,
        experienceLevel: true, xp: true, streak: true, createdAt: true,
      },
    })
    if (!user)
      return reply.status(404).send({ success: false, error: "User not found" })
    return reply.send({ success: true, data: user })
  },

  async updateMe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.user as { id: string }
    const user = await prisma.user.update({
      where: { id },
      data: req.body as any,
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, targetRole: true,
        experienceLevel: true, xp: true, streak: true, createdAt: true,
      },
    })
    return reply.send({ success: true, data: user })
  },
}
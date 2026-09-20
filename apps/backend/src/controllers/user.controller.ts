import { FastifyRequest, FastifyReply } from "fastify"
import bcrypt from "bcrypt"
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
        role: true, aiRequestCount: true, lastAiRequestAt: true,
      },
    })
    if (!user)
      return reply.status(404).send({ success: false, error: "User not found" })
    return reply.send({ success: true, data: user })
  },

  async updateMe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.user as { id: string }
    
    // Safely extract only allowed fields
    const { username, email, bio, targetRole, avatar } = req.body as any
    const data: any = {}
    if (username) data.username = username
    if (email) data.email = email
    if (bio !== undefined) data.bio = bio
    if (targetRole !== undefined) data.targetRole = targetRole
    if (avatar !== undefined) {
      // 2MB actual file size limit. Base64 inflates size by ~1.37x.
      if (typeof avatar === 'string' && avatar.length > 2 * 1024 * 1024 * 1.37) {
        return reply.status(400).send({ success: false, error: "Avatar image is too large (max 2MB)" })
      }
      data.avatar = avatar
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, targetRole: true,
        experienceLevel: true, xp: true, streak: true, createdAt: true,
        role: true, aiRequestCount: true, lastAiRequestAt: true,
      },
    })
    return reply.send({ success: true, data: user })
  },

  async updatePassword(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.user as { id: string }
    const { currentPassword, newPassword } = req.body as any

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ success: false, error: "Missing password fields" })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return reply.status(404).send({ success: false, error: "User not found" })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return reply.status(401).send({ success: false, error: "Incorrect current password" })

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id },
      data: { password: hashed }
    })

    return reply.send({ success: true, message: "Password updated successfully" })
  },

  async deleteMe(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.user as { id: string }
    await prisma.user.delete({ where: { id } })
    return reply.send({ success: true, message: "Account deleted successfully" })
  },
}
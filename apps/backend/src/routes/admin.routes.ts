import { FastifyInstance } from "fastify"
import { prisma } from "@devforge/database"


export async function adminRoutes(fastify: FastifyInstance) {
  // Middleware to verify admin
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify()
      const user = await prisma.user.findUnique({
        where: { id: (request.user as any).id },
      })
      if (!user || user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden: Admins only" })
      }
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" })
    }
  })

  fastify.get("/config", async (request, reply) => {
    let config = await prisma.systemConfig.findUnique({
      where: { id: "global" },
    })
    
    // Seed default if not exists
    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: "global" },
      })
    }
    
    return reply.send(config)
  })

  fastify.put("/config", async (request, reply) => {
    const data = request.body as any
    const updated = await prisma.systemConfig.update({
      where: { id: "global" },
      data: {
        botEnabled: data.botEnabled,
        botQueueWaitTime: data.botQueueWaitTime,
        baseTimeEasy: data.baseTimeEasy,
        baseTimeMedium: data.baseTimeMedium,
        baseTimeHard: data.baseTimeHard,
        multBeginner: data.multBeginner,
        multIntermediate: data.multIntermediate,
        multGrandmaster: data.multGrandmaster,
        variancePercent: data.variancePercent,
      },
    })
    return reply.send(updated)
  })

  fastify.get("/stats", async (request, reply) => {
    try {
      const [
        totalUsers,
        totalMatches,
        totalResumes,
        totalInterviews,
        totalProblems
      ] = await Promise.all([
        prisma.user.count(),
        prisma.match.count(),
        prisma.resume.count(),
        prisma.interview.count(),
        prisma.problem.count()
      ])

      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, email: true, createdAt: true, role: true }
      })

      return reply.send({
        totalUsers,
        totalMatches,
        totalResumes,
        totalInterviews,
        totalProblems,
        recentUsers
      })
    } catch (err) {
      console.error(err)
      return reply.status(500).send({ error: "Failed to fetch stats" })
    }
  })
}

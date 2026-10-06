import { FastifyInstance } from "fastify"
import { prisma } from "@devforge/database"
import { z } from "zod"


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

  const AdminConfigSchema = z.object({
    botEnabled: z.boolean().optional(),
    botQueueWaitTime: z.number().min(0).optional(),
    baseTimeEasy: z.number().min(0).optional(),
    baseTimeMedium: z.number().min(0).optional(),
    baseTimeHard: z.number().min(0).optional(),
    multBeginner: z.number().min(0).optional(),
    multIntermediate: z.number().min(0).optional(),
    multGrandmaster: z.number().min(0).optional(),
    variancePercent: z.number().min(0).max(100).optional(),
  })

  fastify.put("/config", { schema: { body: AdminConfigSchema } }, async (request, reply) => {
    const data = request.body as any
    const updated = await prisma.systemConfig.update({
      where: { id: "global" },
      data: {
        ...(data.botEnabled !== undefined && { botEnabled: data.botEnabled }),
        ...(data.botQueueWaitTime !== undefined && { botQueueWaitTime: data.botQueueWaitTime }),
        ...(data.baseTimeEasy !== undefined && { baseTimeEasy: data.baseTimeEasy }),
        ...(data.baseTimeMedium !== undefined && { baseTimeMedium: data.baseTimeMedium }),
        ...(data.baseTimeHard !== undefined && { baseTimeHard: data.baseTimeHard }),
        ...(data.multBeginner !== undefined && { multBeginner: data.multBeginner }),
        ...(data.multIntermediate !== undefined && { multIntermediate: data.multIntermediate }),
        ...(data.multGrandmaster !== undefined && { multGrandmaster: data.multGrandmaster }),
        ...(data.variancePercent !== undefined && { variancePercent: data.variancePercent }),
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
        totalProblems,
        totalSubmissions,
        activeMatches,
        xpAgg,
        aiAgg
      ] = await Promise.all([
        prisma.user.count(),
        prisma.match.count(),
        prisma.resume.count(),
        prisma.interview.count(),
        prisma.problem.count(),
        prisma.submission.count(),
        prisma.match.count({ where: { status: "ACTIVE" } }),
        prisma.user.aggregate({ _sum: { xp: true } }),
        prisma.user.aggregate({ _sum: { aiRequestCount: true } })
      ])

      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, email: true, createdAt: true, role: true }
      })

      const recentMatches = await prisma.match.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
          problem: { select: { title: true, difficulty: true } }
        }
      })

      const memoryUsage = process.memoryUsage()
      const serverStats = {
        uptime: process.uptime(),
        memory: {
          total: memoryUsage.heapTotal,
          used: memoryUsage.heapUsed,
          rss: memoryUsage.rss
        },
        nodeVersion: process.version
      }

      return reply.send({
        totalUsers,
        totalMatches,
        totalResumes,
        totalInterviews,
        totalProblems,
        totalSubmissions,
        activeMatches,
        totalAiRequests: aiAgg._sum.aiRequestCount || 0,
        totalXp: xpAgg._sum.xp || 0,
        recentUsers,
        recentMatches,
        serverStats
      })
    } catch (err) {
      console.error(err)
      return reply.status(500).send({ error: "Failed to fetch stats" })
    }
  })
}

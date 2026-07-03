import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import {
  getAllPaths,
  getPathById,
  enrollUser,
  markTopicComplete,
} from "../services/learning.service"

export async function learningRoutes(app: FastifyInstance) {
  // GET /api/paths — all paths with enrollment + progress
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const paths = await getAllPaths(userId)
      return reply.send({ success: true, data: paths })
    }
  )

  // GET /api/paths/:id — single path with topics
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const path = await getPathById(req.params.id, userId)
      if (!path) return reply.status(404).send({ success: false, error: "Path not found" })
      return reply.send({ success: true, data: path })
    }
  )

  // POST /api/paths/:id/enroll
  app.post(
    "/:id/enroll",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      await enrollUser(userId, req.params.id)
      return reply.send({ success: true, data: { message: "Enrolled successfully" } })
    }
  )

  // POST /api/paths/progress/:topicId
  app.post(
    "/progress/:topicId",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Params: { topicId: string }
        Body: { completed: boolean }
      }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { completed } = req.body
      await markTopicComplete(userId, req.params.topicId, completed)
      return reply.send({ success: true, data: { message: "Progress updated" } })
    }
  )
}
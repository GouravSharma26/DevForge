import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { getSkillTree, unlockNode, completeNode } from "../services/learn.service"

export default async function learnRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/learn/trees
  app.get(
    "/trees",
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const { getAllSkillTrees } = await import("../services/learn.service")
        const treesData = await getAllSkillTrees(userId)
        return reply.send({ success: true, data: treesData })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: "Failed to load skill trees" })
      }
    }
  )

  // GET /api/learn/tree/:id
  app.get(
    "/tree/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const treeData = await getSkillTree(userId, req.params.id)
        return reply.send({ success: true, data: treeData })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: "Failed to load skill tree" })
      }
    }
  )

  // POST /api/learn/node/:nodeId/unlock
  app.post(
    "/node/:nodeId/unlock",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { nodeId: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const progress = await unlockNode(userId, req.params.nodeId)
        return reply.send({ success: true, data: progress })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: "Internal Server Error" })
      }
    }
  )

  // POST /api/learn/node/:nodeId/complete
  app.post(
    "/node/:nodeId/complete",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { nodeId: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const progress = await completeNode(userId, req.params.nodeId)
        return reply.send({ success: true, data: progress })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: "Internal Server Error" })
      }
    }
  )
}

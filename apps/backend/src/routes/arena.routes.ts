import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { getMatchById } from "../services/arena.service"

export async function arenaRoutes(app: FastifyInstance) {
  app.get(
    "/match/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const match = await getMatchById(req.params.id)
      if (!match)
        return reply.status(404).send({ success: false, error: "Match not found" })
      return reply.send({ success: true, data: match })
    }
  )
}
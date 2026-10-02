import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { getProblems, getProblemBySlug, submitSolution, getRecommendedProblems } from "../services/problems.service"

export async function problemRoutes(app: FastifyInstance) {
  // GET /api/problems
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Querystring: { difficulty?: string; category?: string; page?: string }
      }>,
      reply
    ) => {
      const { difficulty, category, page = "1" } = req.query
      const result = await getProblems(difficulty, category, Number(page))
      return reply.send({ success: true, data: result })
    }
  )

  // GET /api/problems/recommended
  app.get(
    "/recommended",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const result = await getRecommendedProblems(userId)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // GET /api/problems/:slug
  app.get(
    "/:slug",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { slug: string } }>, reply) => {
      const problem = await getProblemBySlug(req.params.slug)
      if (!problem)
        return reply.status(404).send({ success: false, error: "Problem not found" })
      return reply.send({ success: true, data: problem })
    }
  )

  // POST /api/problems/:id/submit
  app.post(
    "/:id/submit",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Params: { id: string }
        Body: { code: string; language: string }
      }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { code, language } = req.body
      try {
        const result = await submitSolution(userId, req.params.id, code, language)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )
}
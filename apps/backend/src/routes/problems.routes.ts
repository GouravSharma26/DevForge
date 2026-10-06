import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { getProblems, getProblemBySlug, submitSolution, getRecommendedProblems } from "../services/problems.service"
import { z } from "zod"
import { SUPPORTED_LANGUAGES } from "@devforge/shared-types"

const ProblemsQuerySchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
})

export async function problemRoutes(app: FastifyInstance) {
  // GET /api/problems
  app.get(
    "/",
    { 
      schema: { querystring: ProblemsQuerySchema },
      preHandler: [authenticate] 
    },
    async (
      req: FastifyRequest<{
        Querystring: z.infer<typeof ProblemsQuerySchema>
      }>,
      reply
    ) => {
      const { difficulty, category, page } = req.query
      const result = await getProblems(difficulty, category, page)
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
        return reply.status(500).send({ success: false, error: "Internal Server Error" })
      }
    }
  )

  // GET /api/problems/:slug
  app.get(
    "/:slug",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Params: { slug: string }
        Querystring: { mode?: string }
      }>,
      reply
    ) => {
      const problem = await getProblemBySlug(req.params.slug, req.query.mode)
      if (!problem)
        return reply.status(404).send({ success: false, error: "Problem not found" })
      return reply.send({ success: true, data: problem })
    }
  )

  app.post(
    "/:id/submit",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      
      const schema = z.object({
        code: z.string().max(100000),
        language: z.enum(SUPPORTED_LANGUAGES as any),
        nodeId: z.string().optional()
      })
      
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: "Invalid payload" })
      }
      
      const { code, language, nodeId } = parsed.data
      
      try {
        const result = await submitSolution(userId, req.params.id, code, language, nodeId)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        if (err.message === "Problem not found") {
          return reply.status(404).send({ success: false, error: err.message })
        }
        return reply.status(400).send({ success: false, error: err.message || "Bad Request" })
      }
    }
  )
}
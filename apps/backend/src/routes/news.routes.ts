import { FastifyInstance, FastifyRequest } from "fastify"
import { getArticles, fetchAndStoreNews } from "../services/news.service"
import { z } from "zod"

const NewsQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function newsRoutes(app: FastifyInstance) {
  // GET /api/news?category=technology&page=1&limit=20
  app.get(
    "/",
    { schema: { querystring: NewsQuerySchema } },
    async (
      req: FastifyRequest<{
        Querystring: z.infer<typeof NewsQuerySchema>
      }>,
      reply
    ) => {
      const { category, page, limit } = req.query
      const result = await getArticles(category, page, limit)
      return reply.send({ success: true, data: result })
    }
  )

  // POST /api/news/refresh — manually trigger a fetch
  app.post("/refresh", async (_req, reply) => {
    const count = await fetchAndStoreNews()
    return reply.send({ success: true, data: { message: `${count} articles refreshed` } })
  })
}
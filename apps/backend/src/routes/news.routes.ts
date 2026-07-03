import { FastifyInstance, FastifyRequest } from "fastify"
import { getArticles, fetchAndStoreNews } from "../services/news.service"

export async function newsRoutes(app: FastifyInstance) {
  // GET /api/news?category=technology&page=1&limit=20
  app.get(
    "/",
    async (
      req: FastifyRequest<{
        Querystring: { category?: string; page?: string; limit?: string }
      }>,
      reply
    ) => {
      const { category, page = "1", limit = "20" } = req.query
      const result = await getArticles(category, Number(page), Number(limit))
      return reply.send({ success: true, data: result })
    }
  )

  // POST /api/news/refresh — manually trigger a fetch
  app.post("/refresh", async (_req, reply) => {
    const count = await fetchAndStoreNews()
    return reply.send({ success: true, data: { message: `${count} articles refreshed` } })
  })
}
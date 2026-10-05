import { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "@devforge/database"
import { consumeAiRequest, AiRateLimitError } from "../utils/ai-rate-limit"

export async function aiQuotaCheck(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id: userId } = req.user as { id: string }
    await consumeAiRequest(userId, prisma)
  } catch (err: any) {
    if (err instanceof AiRateLimitError) {
      return reply.status(429).send({ success: false, error: err.message })
    }
    req.log.error(err)
    return reply.status(500).send({ success: false, error: "Internal Server Error" })
  }
}

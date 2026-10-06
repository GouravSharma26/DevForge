import { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "@devforge/database"

// Short in-memory cache for token versions (expires every 30 seconds)
const tokenVersionCache = new Map<string, { version: number, expiresAt: number }>();

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded: any = await req.jwtVerify()
    
    if (decoded.tokenVersion !== undefined) {
      const now = Date.now();
      let cached = tokenVersionCache.get(decoded.id);
      
      if (!cached || cached.expiresAt < now) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { tokenVersion: true }
        });
        if (!user) {
          throw new Error("User deleted");
        }
        cached = { version: user.tokenVersion, expiresAt: now + 30000 };
        tokenVersionCache.set(decoded.id, cached);
      }
      
      if (cached.version !== decoded.tokenVersion) {
        throw new Error("Token version mismatch (revoked)");
      }
    }
  } catch (err: any) {
    return reply.status(401).send({ success: false, error: "Unauthorized" })
  }
}
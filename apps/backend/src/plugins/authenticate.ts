import { FastifyRequest, FastifyReply } from "fastify"

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ success: false, error: "Unauthorized" })
  }

  // CSRF Protection: Require valid Origin for state-changing requests
  const method = req.method.toUpperCase()
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    const origin = req.headers.origin
    if (!origin) {
      return reply.status(403).send({ success: false, error: "Missing Origin header for CSRF protection" })
    }
    
    // We validate the origin using our existing CORS logic
    const { checkCorsOrigin } = require("../utils/cors")
    
    await new Promise<void>((resolve, reject) => {
      checkCorsOrigin(origin, (err: Error | null, allow: boolean) => {
        if (err || !allow) reject(new Error("Origin not allowed"))
        else resolve()
      })
    }).catch(() => {
      reply.status(403).send({ success: false, error: "Invalid Origin for CSRF protection" })
      throw new Error("CSRF")
    })
  }
}
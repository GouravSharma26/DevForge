import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import jwt from "@fastify/jwt"
import rateLimit from "@fastify/rate-limit"
import fastifyCookie from "@fastify/cookie"
import * as cookie from "cookie"
import multipart from "@fastify/multipart"
import { Server } from "socket.io"
import { prisma } from "@devforge/database"
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod"

import { authRoutes } from "./routes/auth.routes"
import { problemRoutes } from "./routes/problems.routes"
import { learningRoutes } from "./routes/learning.routes"
import learnRoutes from "./routes/learn.routes"
import { userRoutes } from "./routes/user.routes"
import { newsRoutes } from "./routes/news.routes"
import { arenaRoutes } from "./routes/arena.routes"
import { resumeRoutes } from "./routes/resume.routes"
import { adminRoutes } from "./routes/admin.routes"
import { registerArenaHandlers } from "./sockets/arena.socket"
import { registerInterviewHandlers } from "./sockets/interview.socket"
import { checkCorsOrigin, isAllowedOrigin } from "./utils/cors"

const requireEnv = (k: string) => { 
  const v = process.env[k]; 
  if (!v || v.length < 32) throw new Error(`${k} missing/weak`);
  const weakPatterns = ["your-secret-here", "changeme", "supersecret"];
  if (weakPatterns.some(p => v.toLowerCase().includes(p))) throw new Error(`${k} missing/weak`);
  if (/^(.)\1+$/.test(v)) throw new Error(`${k} missing/weak`);
  return v; 
}

export function buildApp() {
  const app = Fastify({ logger: true, trustProxy: true })

  if (process.env.NODE_ENV === "production" && (!process.env.PISTON_API_URL || process.env.PISTON_API_URL.includes("emkc.org"))) {
    throw new Error("Self-hosted PISTON_API_URL is required in production. Do not use emkc.org.");
  }

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Initialize Socket.io early so it can be passed or accessed if needed
  const io = new Server(app.server, {
    cors: { 
      origin: checkCorsOrigin,
      credentials: true
    },
    maxHttpBufferSize: 100_000,
    allowRequest: (req, cb) => checkCorsOrigin(req.headers.origin, (_e, ok) => cb(null, ok))
  })

  app.decorate("io", io)

  app.register(fastifyCookie, {
    secret: requireEnv("COOKIE_SECRET"), // for signed cookies
    hook: "onRequest",
  })
  
  app.register(jwt, { 
    secret: requireEnv("JWT_SECRET"),
    cookie: { cookieName: "access_token", signed: false },
  })

  app.register(async (instance) => {
    await instance.register(helmet)
    await instance.register(cors, {
      origin: checkCorsOrigin,
      credentials: true,
    })
    await instance.register(rateLimit, { max: 100, timeWindow: "1 minute" })
    await instance.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

    // Global CSRF Protection
    instance.addHook("onRequest", async (req, reply) => {
      const method = req.method.toUpperCase()
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const origin = req.headers.origin
        if (!origin) {
          return reply.code(403).send({ success: false, error: "Missing Origin header for CSRF protection" })
        }
        
        if (!isAllowedOrigin(origin)) {
          return reply.code(403).send({ success: false, error: "Invalid Origin for CSRF protection" })
        }
      }
    })

    // REST Routes
    await instance.register(authRoutes, { prefix: "/api/auth" })
    await instance.register(userRoutes, { prefix: "/api/user" })
    await instance.register(newsRoutes, { prefix: "/api/news" })
    await instance.register(learningRoutes, { prefix: "/api/paths" })
    await instance.register(learnRoutes, { prefix: "/api/learn" })
    await instance.register(problemRoutes, { prefix: "/api/problems" })
    await instance.register(arenaRoutes, { prefix: "/api/arena" })
    await instance.register(resumeRoutes, { prefix: "/api/resume" })
    await instance.register(adminRoutes, { prefix: "/api/admin" })

    // Global Error Handler
    instance.setErrorHandler((error: any, request, reply) => {
      instance.log.error(error)
      
      if (error.name === "PrismaClientInitializationError" || error.message.includes("Can't reach database server")) {
        return reply.status(503).send({ 
          success: false, 
          error: "Database connection timeout. Please try again." 
        })
      }

      if (error.code === 'FST_ERR_VALIDATION' || error.name === 'ZodError') {
        const message = error.validation 
          ? error.validation.map((v: any) => v.message).join(", ") 
          : error.message;
        return reply.status(400).send({
          success: false,
          error: message || "Validation failed"
        })
      }

      const statusCode = error.statusCode || 500
      reply.status(statusCode).send({
        success: false,
        error: statusCode === 500 ? "Internal Server Error" : error.message
      })
    })

    instance.get("/health", async () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
  })

  // WebSocket Authentication Middleware
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token
    
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie)
      token = cookies.access_token
    }

    if (!token) return next(new Error("Unauthorized"))
    try {
      const decoded = app.jwt.verify(token) as { id: string, tokenVersion?: number }
      socket.data.userId = decoded.id

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { username: true, avatar: true, tokenVersion: true }
      })

      if (!user) return next(new Error("User deleted"))
      if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error("Token revoked"))
      }

      socket.data.username = user.username
      socket.data.avatar = user.avatar

      next()
    } catch {
      next(new Error("Invalid token"))
    }
  })

  // WebSocket Connection Handler
  io.on("connection", (socket) => {
    app.log.info(`Socket connected: ${socket.id} (user: ${socket.data.userId})`)
    registerArenaHandlers(io, socket)
    registerInterviewHandlers(io, socket)
  })

  return { app, io }
}

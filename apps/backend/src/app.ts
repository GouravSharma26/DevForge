import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import jwt from "@fastify/jwt"
import rateLimit from "@fastify/rate-limit"
import multipart from "@fastify/multipart"
import { Server } from "socket.io"
import { prisma } from "@devforge/database"
import "dotenv/config"

import { authRoutes } from "./routes/auth.routes"
import { problemRoutes } from "./routes/problems.routes"
import { learningRoutes } from "./routes/learning.routes"
import { userRoutes } from "./routes/user.routes"
import { newsRoutes } from "./routes/news.routes"
import { arenaRoutes } from "./routes/arena.routes"
import { resumeRoutes } from "./routes/resume.routes"
import { adminRoutes } from "./routes/admin.routes"
import { registerArenaHandlers } from "./sockets/arena.socket"
import { registerInterviewHandlers } from "./sockets/interview.socket"
import { checkCorsOrigin } from "./utils/cors"

export function buildApp() {
  const app = Fastify({ logger: true })

  // Initialize Socket.io early so it can be passed or accessed if needed
  const io = new Server(app.server, {
    cors: { 
      origin: checkCorsOrigin,
      credentials: true
    },
  })

  app.decorate("io", io)

  app.register(async (instance) => {
    await instance.register(helmet)
    await instance.register(cors, {
      origin: checkCorsOrigin,
      credentials: true,
    })
    await instance.register(jwt, { secret: process.env.JWT_SECRET || "supersecret" })
    await instance.register(rateLimit, { max: 100, timeWindow: "1 minute" })
    await instance.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

    // REST Routes
    await instance.register(authRoutes, { prefix: "/api/auth" })
    await instance.register(userRoutes, { prefix: "/api/user" })
    await instance.register(newsRoutes, { prefix: "/api/news" })
    await instance.register(learningRoutes, { prefix: "/api/paths" })
    await instance.register(problemRoutes, { prefix: "/api/problems" })
    await instance.register(arenaRoutes, { prefix: "/api/arena" })
    await instance.register(resumeRoutes, { prefix: "/api/resume" })
    await instance.register(adminRoutes, { prefix: "/api/admin" })

    // Global Error Handler
    instance.setErrorHandler((error, request, reply) => {
      instance.log.error(error)
      
      if (error.name === "PrismaClientInitializationError" || error.message.includes("Can't reach database server")) {
        return reply.status(503).send({ 
          success: false, 
          error: "Database connection timeout. Please try again." 
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
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error("Unauthorized"))
    try {
      const decoded = app.jwt.verify(token) as { id: string }
      socket.data.userId = decoded.id

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { username: true, avatar: true }
      })

      if (user) {
        socket.data.username = user.username
        socket.data.avatar = user.avatar
      }

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

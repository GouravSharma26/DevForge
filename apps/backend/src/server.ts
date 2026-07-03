import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import jwt from "@fastify/jwt"
import rateLimit from "@fastify/rate-limit"
import multipart from "@fastify/multipart"
import { Server } from "socket.io"
import { fetchAndStoreNews } from "./services/news.service"
import "dotenv/config"

import { authRoutes } from "./routes/auth.routes"
import { problemRoutes } from "./routes/problems.routes"
import { learningRoutes } from "./routes/learning.routes"
import { userRoutes } from "./routes/user.routes"
import { newsRoutes } from "./routes/news.routes"
import { arenaRoutes } from "./routes/arena.routes"
import { scheduleNewsJob } from "./workers/news.worker"
import { registerArenaHandlers } from "./sockets/arena.socket"
import { resumeRoutes } from "./routes/resume.routes"

const app = Fastify({ logger: true })

export const io = new Server(app.server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000" },
})

async function start() {
  await app.register(helmet)
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow no origin (mobile/curl), production URL, and all Vercel preview URLs
      if (
        !origin ||
        origin === process.env.FRONTEND_URL ||
        origin.endsWith(".vercel.app") ||
        origin === "http://localhost:3000"
      ) {
        cb(null, true)
      } else {
        cb(new Error("Not allowed by CORS"), false)
      }
    },
    credentials: true,
  })
  await app.register(jwt, { secret: process.env.JWT_SECRET! })
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" })
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

  // REST Routes
  await app.register(authRoutes, { prefix: "/api/auth" })
  await app.register(userRoutes, { prefix: "/api/user" })
  await app.register(newsRoutes, { prefix: "/api/news" })
  await app.register(learningRoutes, { prefix: "/api/paths" })
  await app.register(problemRoutes, { prefix: "/api/problems" })
  await app.register(arenaRoutes, { prefix: "/api/arena" })
  await app.register(resumeRoutes, { prefix: "/api/resume" })
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // WebSocket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error("Unauthorized"))
    try {
      const decoded = app.jwt.verify(token) as { id: string }
      socket.data.userId = decoded.id
      next()
    } catch {
      next(new Error("Invalid token"))
    }
  })

  // WebSocket Connection Handler
  io.on("connection", (socket) => {
    app.log.info(`Socket connected: ${socket.id} (user: ${socket.data.userId})`)
    registerArenaHandlers(io, socket)
  })

  const PORT = Number(process.env.PORT) || 5000

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" })
    console.log(`🚀 Backend running on http://localhost:${PORT}`)

    // Start background news fetching
    await scheduleNewsJob()

    // Fetch news immediately on startup so DB isn't empty
    await fetchAndStoreNews()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
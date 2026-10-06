import "dotenv/config"
import { buildApp } from "./app"
import { fetchAndStoreNews } from "./services/news.service"
import { scheduleNewsJob } from "./workers/news.worker"
import { scheduleArenaJobs } from "./workers/arena.worker"

const { app } = buildApp()

async function start() {
  const PORT = Number(process.env.PORT) || 5000

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" })
    console.log(`🚀 Backend running on http://localhost:${PORT}`)

    // Start background jobs (fire-and-forget)
    scheduleNewsJob().catch(err => console.error("Failed to schedule news job", err))
    scheduleArenaJobs().catch(err => console.error("Failed to schedule arena jobs", err))

    // Fetch news immediately on startup so DB isn't empty (fire-and-forget)
    fetchAndStoreNews().catch(err => console.error("Failed to fetch initial news", err))
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Handle Uncaught Exceptions gracefully
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err)
  process.exit(1)
})

process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Rejection:", err)
  process.exit(1)
})

start()
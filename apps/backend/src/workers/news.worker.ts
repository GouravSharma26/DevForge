import { Queue, Worker } from "bullmq"
import { fetchAndStoreNews } from "../services/news.service"

const connection = {
  url: process.env.REDIS_URL!,
}

// Use URL-based connection to avoid ioredis version conflicts
const redisConnection = {
  host: (() => {
    try {
      const url = new URL(process.env.REDIS_URL!.replace("rediss://", "https://").replace("redis://", "http://"))
      return url.hostname
    } catch { return "localhost" }
  })(),
  port: (() => {
    try {
      const url = new URL(process.env.REDIS_URL!.replace("rediss://", "https://").replace("redis://", "http://"))
      return parseInt(url.port) || 6379
    } catch { return 6379 }
  })(),
  username: (() => {
    try {
      const url = new URL(process.env.REDIS_URL!.replace("rediss://", "https://").replace("redis://", "http://"))
      return url.username || undefined
    } catch { return undefined }
  })(),
  password: (() => {
    try {
      const url = new URL(process.env.REDIS_URL!.replace("rediss://", "https://").replace("redis://", "http://"))
      return url.password || undefined
    } catch { return undefined }
  })(),
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
  family: 4, // Force IPv4 to prevent ETIMEDOUT on Upstash
  maxRetriesPerRequest: null, // Required by BullMQ
}

export const newsQueue = new Queue("news", { connection: redisConnection })

newsQueue.on("error", (err) => {
  console.error("⚠️ News Queue Redis error (ignored):", err.message)
})

const worker = new Worker(
  "news",
  async (job) => {
    console.log(`⚙️  Processing job: ${job.name}`)
    await fetchAndStoreNews()
  },
  { connection: redisConnection }
)

worker.on("completed", () => console.log("✅ News job completed"))
worker.on("failed", (job, err) => console.error(`❌ News job failed`, err))
worker.on("error", (err) => {
  console.error("⚠️ News Worker Redis error (ignored):", err.message)
})

export async function scheduleNewsJob() {
  await newsQueue.add(
    "fetch-news",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: 50,
    }
  )
  console.log("🕐 News job scheduled every 6 hours")
}
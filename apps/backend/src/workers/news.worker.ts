import { Queue, Worker } from "bullmq"
import { fetchAndStoreNews } from "../services/news.service"

const connection = {
  url: process.env.REDIS_URL!,
}

let parsedUrl: URL | undefined;
try {
  if (process.env.REDIS_URL) {
    parsedUrl = new URL(process.env.REDIS_URL.replace("rediss://", "https://").replace("redis://", "http://"))
  }
} catch {
  // Ignore
}

// Use URL-based connection to avoid ioredis version conflicts
const redisConnection = {
  host: parsedUrl?.hostname || "localhost",
  port: parseInt(parsedUrl?.port || "6379") || 6379,
  username: parsedUrl?.username || undefined,
  password: parsedUrl?.password || undefined,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  family: 4, // Force IPv4 to prevent ETIMEDOUT on Upstash
  maxRetriesPerRequest: null, // Required by BullMQ
}

let newsQueue: Queue;
let worker: Worker;

export async function scheduleNewsJob() {
  if (!newsQueue) {
    newsQueue = new Queue("news", { connection: redisConnection })
    newsQueue.on("error", (err) => {
      console.error("⚠️ News Queue Redis error (ignored):", err.message)
    })
  }

  if (!worker) {
    worker = new Worker(
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
  }

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
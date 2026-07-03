import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { fetchAndStoreNews } from "../services/news.service"

const connection = new IORedis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null,
})

// Queue that schedules the fetch job
export const newsQueue = new Queue("news", { connection })

// Worker that processes the job
const worker = new Worker(
  "news",
  async (job) => {
    console.log(`⚙️  Processing job: ${job.name}`)
    await fetchAndStoreNews()
  },
  { connection }
)

worker.on("completed", () => console.log("✅ News job completed"))
worker.on("failed", (job, err) => console.error(`❌ News job failed`, err))

// Schedule: fetch news every 6 hours
export async function scheduleNewsJob() {
  await newsQueue.add(
    "fetch-news",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 }, // 6 hours in ms
      removeOnComplete: true,
      removeOnFail: 50,
    }
  )
  console.log("🕐 News job scheduled every 6 hours")
}
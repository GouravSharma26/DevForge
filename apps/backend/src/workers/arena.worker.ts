import { Queue, Worker } from "bullmq"
import { prisma } from "@devforge/database"

let parsedUrl: URL | undefined;
try {
  if (process.env.REDIS_URL) {
    parsedUrl = new URL(process.env.REDIS_URL.replace("rediss://", "https://").replace("redis://", "http://"))
  }
} catch {
  // Ignore
}

const redisConnection = {
  host: parsedUrl?.hostname || "localhost",
  port: parseInt(parsedUrl?.port || "6379") || 6379,
  username: parsedUrl?.username || undefined,
  password: parsedUrl?.password || undefined,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  family: 4,
  maxRetriesPerRequest: null,
}

let arenaQueue: Queue;
let worker: Worker;

export async function reconcileStaleMatches() {
  console.log("🧹 Reconciling stale arena matches...")
  
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
  const deleted = await prisma.match.deleteMany({
    where: {
      status: "WAITING",
      createdAt: { lt: twoMinutesAgo }
    }
  })
  if (deleted.count > 0) {
    console.log(`🧹 Deleted ${deleted.count} stale WAITING matches`)
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  const updated = await prisma.match.updateMany({
    where: {
      status: "IN_PROGRESS",
      createdAt: { lt: thirtyMinutesAgo }
    },
    data: { status: "ABANDONED" }
  })
  if (updated.count > 0) {
    console.log(`🧹 Marked ${updated.count} stale IN_PROGRESS matches as ABANDONED`)
  }
}

export async function scheduleArenaJobs() {
  if (!arenaQueue) {
    arenaQueue = new Queue("arena", { connection: redisConnection })
    arenaQueue.on("error", (err) => {
      console.error("⚠️ Arena Queue Redis error (ignored):", err.message)
    })
  }

  if (!worker) {
    worker = new Worker(
      "arena",
      async (job) => {
        if (job.name === "reconcile-matches") {
          await reconcileStaleMatches()
        }
      },
      { connection: redisConnection }
    )

    worker.on("failed", (job, err) => console.error(`❌ Arena job failed`, err))
    worker.on("error", (err) => {
      console.error("⚠️ Arena Worker Redis error (ignored):", err.message)
    })
  }

  // Run on boot
  await reconcileStaleMatches()

  // Schedule every 5 minutes
  await arenaQueue.add(
    "reconcile-matches",
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: 10,
    }
  )
  console.log("🕐 Arena match reconciliation scheduled every 5 minutes")
}

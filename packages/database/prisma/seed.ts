import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding learning paths...")

  await prisma.userProgress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.learningPath.deleteMany()

  const paths = [
    {
      title: "Frontend Developer",
      description: "Master HTML, CSS, JavaScript, React and build production UIs",
      icon: "🎨",
      level: "BEGINNER" as const,
      order: 1,
      topics: [
        { title: "HTML Fundamentals", order: 1, estimatedMins: 45 },
        { title: "CSS & Flexbox", order: 2, estimatedMins: 60 },
        { title: "JavaScript Basics", order: 3, estimatedMins: 90 },
        { title: "DOM Manipulation", order: 4, estimatedMins: 60 },
        { title: "React Fundamentals", order: 5, estimatedMins: 120 },
        { title: "React Hooks", order: 6, estimatedMins: 90 },
        { title: "TypeScript for React", order: 7, estimatedMins: 90 },
        { title: "TanStack Query", order: 8, estimatedMins: 60 },
      ],
    },
    {
      title: "Backend Developer",
      description: "Build scalable APIs with Node.js, databases, and authentication",
      icon: "⚙️",
      level: "MID" as const,
      order: 2,
      topics: [
        { title: "Node.js Core", order: 1, estimatedMins: 60 },
        { title: "REST API Design", order: 2, estimatedMins: 90 },
        { title: "Fastify / Express", order: 3, estimatedMins: 90 },
        { title: "PostgreSQL & SQL", order: 4, estimatedMins: 120 },
        { title: "Prisma ORM", order: 5, estimatedMins: 60 },
        { title: "JWT Authentication", order: 6, estimatedMins: 60 },
        { title: "Redis & Caching", order: 7, estimatedMins: 60 },
        { title: "Background Jobs", order: 8, estimatedMins: 45 },
      ],
    },
    {
      title: "DSA Master",
      description: "Crack coding interviews with data structures and algorithms",
      icon: "🧩",
      level: "MID" as const,
      order: 3,
      topics: [
        { title: "Big O Notation", order: 1, estimatedMins: 45 },
        { title: "Arrays & Strings", order: 2, estimatedMins: 90 },
        { title: "Linked Lists", order: 3, estimatedMins: 90 },
        { title: "Stacks & Queues", order: 4, estimatedMins: 60 },
        { title: "Trees & BST", order: 5, estimatedMins: 120 },
        { title: "Graphs & BFS/DFS", order: 6, estimatedMins: 120 },
        { title: "Dynamic Programming", order: 7, estimatedMins: 180 },
        { title: "Sorting Algorithms", order: 8, estimatedMins: 90 },
      ],
    },
    {
      title: "System Design",
      description: "Design large-scale distributed systems like a senior engineer",
      icon: "🏗️",
      level: "SENIOR" as const,
      order: 4,
      topics: [
        { title: "Scalability Basics", order: 1, estimatedMins: 60 },
        { title: "Load Balancing", order: 2, estimatedMins: 60 },
        { title: "Database Sharding", order: 3, estimatedMins: 90 },
        { title: "Caching Strategies", order: 4, estimatedMins: 60 },
        { title: "Message Queues", order: 5, estimatedMins: 90 },
        { title: "Microservices", order: 6, estimatedMins: 120 },
        { title: "Design Twitter", order: 7, estimatedMins: 120 },
        { title: "Design YouTube", order: 8, estimatedMins: 120 },
      ],
    },
  ]

  for (const pathData of paths) {
    const { topics, ...pathInfo } = pathData

    const path = await prisma.learningPath.upsert({
      where: { id: pathInfo.title },
      update: {},
      create: {
        ...pathInfo,
        totalTopics: topics.length,
        topics: {
          create: topics.map((t) => ({
            title: t.title,
            order: t.order,
            estimatedMins: t.estimatedMins,
          })),
        },
      },
    })

    console.log(`✅ Seeded: ${path.title}`)
  }

  console.log("🌱 Seeding complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
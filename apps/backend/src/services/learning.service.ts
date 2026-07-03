import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function getAllPaths(userId: string) {
  const paths = await prisma.learningPath.findMany({
    orderBy: { order: "asc" },
    include: {
      enrollments: {
        where: { userId },
        select: { id: true },
      },
      topics: {
        select: { id: true },
      },
    },
  })

  // For each path, calculate user's completion %
  const pathIds = paths
    .filter((p) => p.enrollments.length > 0)
    .map((p) => p.id)

  const progressCounts = await prisma.userProgress.groupBy({
    by: ["topicId"],
    where: {
      userId,
      completed: true,
      topic: { pathId: { in: pathIds } },
    },
    _count: true,
  })

  const completedByPath: Record<string, number> = {}
  for (const p of progressCounts) {
    const topic = await prisma.topic.findUnique({
      where: { id: p.topicId },
      select: { pathId: true },
    })
    if (topic) {
      completedByPath[topic.pathId] = (completedByPath[topic.pathId] || 0) + 1
    }
  }

  return paths.map((path) => ({
    id: path.id,
    title: path.title,
    description: path.description,
    icon: path.icon,
    level: path.level,
    totalTopics: path.totalTopics,
    order: path.order,
    isEnrolled: path.enrollments.length > 0,
    completedTopics: completedByPath[path.id] || 0,
    progressPercent:
      path.totalTopics > 0
        ? Math.round(((completedByPath[path.id] || 0) / path.totalTopics) * 100)
        : 0,
  }))
}

export async function getPathById(pathId: string, userId: string) {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      topics: { orderBy: { order: "asc" } },
      enrollments: { where: { userId } },
    },
  })

  if (!path) return null

  const progress = await prisma.userProgress.findMany({
    where: { userId, topic: { pathId } },
    select: { topicId: true, completed: true, completedAt: true },
  })

  const progressMap = Object.fromEntries(progress.map((p) => [p.topicId, p]))

  return {
    ...path,
    isEnrolled: path.enrollments.length > 0,
    topics: path.topics.map((topic) => ({
      ...topic,
      completed: progressMap[topic.id]?.completed ?? false,
      completedAt: progressMap[topic.id]?.completedAt ?? null,
    })),
  }
}

export async function enrollUser(userId: string, pathId: string) {
  return prisma.enrollment.upsert({
    where: { userId_pathId: { userId, pathId } },
    update: {},
    create: { userId, pathId },
  })
}

export async function markTopicComplete(
  userId: string,
  topicId: string,
  completed: boolean
) {
  return prisma.userProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { userId, topicId, completed, completedAt: completed ? new Date() : null },
  })
}
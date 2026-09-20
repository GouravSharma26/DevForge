import { prisma } from "@devforge/database"
import bcrypt from "bcrypt"


async function main() {
  console.log("Seeding bots and admin...")

  // 1. Seed Bots
  const bots = [
    { username: "devbot-beginner", email: "beginner@devbot.ai", xp: 100, role: "USER" },
    { username: "devbot-intermediate", email: "intermediate@devbot.ai", xp: 2000, role: "USER" },
    { username: "devbot-grandmaster", email: "grandmaster@devbot.ai", xp: 10000, role: "USER" },
  ]

  const password = await bcrypt.hash("DevBotSecurePass123!", 10)

  for (const bot of bots) {
    await prisma.user.upsert({
      where: { email: bot.email },
      update: {},
      create: {
        username: bot.username,
        email: bot.email,
        password,
        xp: bot.xp,
        role: "USER"
      }
    })
    console.log(`Seeded ${bot.username}`)
  }

  // 2. Promote first user to Admin
  const firstUser = await prisma.user.findFirst({
    where: { NOT: { email: { contains: "@devbot.ai" } } },
    orderBy: { createdAt: 'asc' }
  })

  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: "ADMIN" }
    })
    console.log(`Promoted user ${firstUser.username} to ADMIN`)
  }

  // 3. Ensure SystemConfig exists
  await prisma.systemConfig.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" }
  })
  console.log("SystemConfig seeded")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Frontend Developer Roadmap...")

  // Delete existing path if it exists to avoid duplicates
  await prisma.learningPath.deleteMany({
    where: { title: "Frontend Developer Roadmap" }
  })

  const path = await prisma.learningPath.create({
    data: {
      title: "Frontend Developer Roadmap",
      description: "Step by step guide to becoming a modern frontend developer in 2026. Based on roadmap.sh.",
      icon: "🌐",
      level: "BEGINNER",
      totalTopics: 10,
      order: 1,
      topics: {
        create: [
          {
            title: "Internet & How it works",
            description: "Learn how the internet works, what is HTTP, DNS, and hosting.",
            videoUrl: "https://www.youtube.com/embed/x3c1ih2NJEg",
            order: 1,
            estimatedMins: 30,
          },
          {
            title: "HTML Basics",
            description: "Learn the basics of HTML, semantics, forms, and validations.",
            videoUrl: "https://www.youtube.com/embed/kUMe1FH4CGY",
            order: 2,
            estimatedMins: 45,
          },
          {
            title: "CSS Fundamentals",
            description: "Learn styling, layouts (Flexbox/Grid), responsive design, and CSS variables.",
            videoUrl: "https://www.youtube.com/embed/OXGznpKZ_sA",
            order: 3,
            estimatedMins: 60,
          },
          {
            title: "JavaScript Basics",
            description: "Learn syntax, variables, data types, functions, and DOM manipulation.",
            videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
            order: 4,
            estimatedMins: 90,
          },
          {
            title: "Version Control (Git)",
            description: "Learn how to use Git, GitHub, branching, and merging.",
            videoUrl: "https://www.youtube.com/embed/8JJ101D3knE",
            order: 5,
            estimatedMins: 45,
          },
          {
            title: "React Fundamentals",
            description: "Learn components, props, state, hooks (useState, useEffect), and JSX.",
            videoUrl: "https://www.youtube.com/embed/bMknfKXIFA8",
            order: 6,
            estimatedMins: 120,
          },
          {
            title: "Modern CSS (Tailwind)",
            description: "Learn utility-first CSS and how to build responsive layouts rapidly.",
            videoUrl: "https://www.youtube.com/embed/ft30zcMlFao",
            order: 7,
            estimatedMins: 60,
          },
          {
            title: "State Management",
            description: "Learn Zustand, Redux, or Context API for complex application state.",
            videoUrl: "https://www.youtube.com/embed/_VqZNvjuGI",
            order: 8,
            estimatedMins: 90,
          },
          {
            title: "Next.js & SSR",
            description: "Learn React frameworks, server-side rendering, and static site generation.",
            videoUrl: "https://www.youtube.com/embed/ZjAqacIC_3c",
            order: 9,
            estimatedMins: 120,
          },
          {
            title: "Testing & Deployment",
            description: "Learn Jest, React Testing Library, and how to deploy to Vercel.",
            videoUrl: "https://www.youtube.com/embed/8Xwq35cPwYg",
            order: 10,
            estimatedMins: 90,
          },
        ]
      }
    }
  })

  console.log("Successfully created path:", path.title)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { prisma } from "@devforge/database"


const NEWS_API_KEY = process.env.NEWS_API_KEY!
const BASE_URL = "https://newsapi.org/v2"
const CATEGORIES = ["technology", "science", "business"]

interface NewsAPIArticle {
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  source: { name: string }
  publishedAt: string
}

export async function fetchAndStoreNews() {
  console.log("📰 Fetching news from NewsAPI...")
  
  // Skip initial fetch if we have articles from the last 3 hours
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const recentArticle = await prisma.article.findFirst({
    where: { createdAt: { gte: threeHoursAgo } }
  })
  if (recentArticle) {
    console.log("⏭️  Recent articles found, skipping fetch")
    return 0
  }

  let totalSaved = 0

  for (const category of CATEGORIES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(
        `${BASE_URL}/top-headlines?category=${category}&language=en&pageSize=20`,
        {
          headers: {
            "X-Api-Key": NEWS_API_KEY
          },
          signal: controller.signal
        }
      )
      clearTimeout(timeoutId)

      if (!res.ok) {
        console.warn(`NewsAPI returned ${res.status} for category ${category}`)
        continue
      }

      const data = (await res.json()) as any
      if (!data.articles?.length) {
        console.warn(`No articles for ${category}:`, data)
        continue
      }

      const articlesToCreate = []
      for (const article of data.articles) {
        if (!article.title || !article.url || article.title === "[Removed]") continue
        
        articlesToCreate.push({
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.urlToImage,
          source: article.source?.name || "Unknown",
          category,
          publishedAt: new Date(article.publishedAt),
        })
      }
      
      if (articlesToCreate.length > 0) {
        const result = await prisma.article.createMany({
          data: articlesToCreate,
          skipDuplicates: true
        })
        totalSaved += result.count
      }
    } catch (err) {
      console.error(`Failed to fetch category: ${category}`, err)
    }
  }

  console.log(`✅ News fetch complete — ${totalSaved} articles saved`)
  return totalSaved
}

export async function getArticles(category?: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  try {
    const where = category ? { category } : undefined
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])
    return {
      articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  } catch (err) {
    console.error("getArticles error:", err)
    return {
      articles: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    }
  }
}
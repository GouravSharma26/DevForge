import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
  let totalSaved = 0

  for (const category of CATEGORIES) {
    try {
      const res = await fetch(
        `${BASE_URL}/top-headlines?category=${category}&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`
      )
      const data = (await res.json()) as any
      if (!data.articles?.length) {
        console.warn(`No articles for ${category}:`, data)
        continue
      }

      for (const article of data.articles) {
        if (!article.title || !article.url || article.title === "[Removed]") continue
        await prisma.article.upsert({
          where: { url: article.url },
          update: {},
          create: {
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.urlToImage,
            source: article.source.name,
            category,
            publishedAt: new Date(article.publishedAt),
          },
        })
        totalSaved++
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
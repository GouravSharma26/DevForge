import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"

const prisma = new PrismaClient()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function saveResumeBuilder(userId: string, sections: any[], template: string) {
  return prisma.resumeBuilder.upsert({
    where: { userId },
    update: { sections, template, updatedAt: new Date() },
    create: { userId, sections, template },
  })
}

export async function loadResumeBuilder(userId: string) {
  return prisma.resumeBuilder.findUnique({ where: { userId } })
}

export async function generateResumeWithAI(userId: string, sections: any[]) {
  const resume = await prisma.resume.findUnique({ where: { userId } })

  const context = resume
    ? `Skills: ${resume.skills.join(", ")}\nExperience Level: ${resume.experienceLevel}\nTarget Role: ${resume.targetRole || "Software Developer"}`
    : "Software Developer with experience in web development"

  const prompt = `
You are a professional resume writer. Generate realistic, ATS-friendly resume content.

Candidate context:
${context}

Current sections:
${JSON.stringify(sections, null, 2)}

Fill in all empty fields with professional, realistic content.
Keep existing non-empty content as-is.
For bullet points, use strong action verbs and include metrics where possible.
For skills, organize by category.
Make experience and projects sound impressive but realistic.

Return ONLY valid JSON with the same structure as the input sections array.
Fill every empty string field. Do not change section types or IDs.
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("Failed to parse AI response")
    return JSON.parse(match[0])
  }
}
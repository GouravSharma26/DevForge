import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { consumeAiRequest } from "../utils/ai-rate-limit"

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

export async function generateResumeWithAI(userId: string, sections: any[], resumeId?: string) {
  await consumeAiRequest(userId, prisma)
  
  let resume = null

  if (resumeId) {
    resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } })
    if (!resume) {
      throw new Error("Specified resume profile not found")
    }
  } else {
    resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    })
  }

  const context = resume
    ? `Original Resume Text from PDF:\n${resume.originalText}\n\nAdditional Info:\nSkills: ${(Array.isArray(resume.skills) ? resume.skills : []).join(", ")}\nExperience Level: ${resume.experienceLevel || "Mid"}\nTarget Role: ${resume.targetRole || "Software Developer"}`
    : "Software Developer with experience in web development"

  const prompt = `
You are an expert resume parser and writer. Your job is to extract the candidate's information from the provided context and format it perfectly into the JSON structure provided.

Candidate context:
${context}

Current sections:
${JSON.stringify(sections, null, 2)}

Instructions:
1. Extract the actual name, contact info, experience, education, projects, and skills from the "Original Resume Text" and fill in the empty fields.
2. Only use the candidate's actual information from the text. DO NOT hallucinate fake names like "Alex Chen" or fake experiences.
3. If some information is missing from the text (e.g. they don't have a LinkedIn), leave that specific field as an empty string.
4. For bullet points, format the extracted text to use strong action verbs and professional phrasing while maintaining accuracy.
5. Keep existing non-empty content as-is.

Return ONLY valid JSON with the exact same structure as the input sections array.
Do not change section types or IDs. Do not include markdown code block formatting (\`\`\`json).
`

  let result;
  let retries = 5;
  let delay = 5000;

  while (retries > 0) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (error: any) {
      const isRateLimit = error.status === 503 || error.status === 429 || 
                          (error.message && (error.message.includes("429") || error.message.includes("503") || error.message.includes("exhausted") || error.message.includes("quota")));
                          
      if (isRateLimit && retries > 1) {
        console.warn(`⏳ Gemini API busy/rate-limited in aiFill. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
      } else {
        console.warn("⚠️ Rate limit exhausted! Switching to Regex Fallback in aiFill...")
        break;
      }
    }
  }

  if (!result) {
    const rawText = resume?.originalText || ""
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const phoneMatch = rawText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    const nameStr = lines.length > 0 ? lines[0].substring(0, 50) : "Candidate Name"
    
    return sections.map(sec => {
      if (sec.id === 'personal' || sec.type === 'Personal Info') {
        return {
          ...sec,
          data: {
            ...sec.data,
            name: nameStr,
            email: emailMatch ? emailMatch[0] : "candidate@example.com",
            phone: phoneMatch ? phoneMatch[0] : "+1 234 567 8900",
          }
        }
      }
      if (sec.id === 'summary' || sec.type === 'Professional Summary') {
        return {
           ...sec,
           data: {
             ...sec.data,
             content: "Regex parser active. Please manually edit this section. " + (resume?.targetRole || "")
           }
        }
      }
      return sec
    })
  }

  // @ts-ignore
  const text = result.response.text().trim()

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("Failed to parse AI response")
    return JSON.parse(match[0])
  }
}
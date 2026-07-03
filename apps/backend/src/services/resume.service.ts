import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

// ─── Resume Analysis (Native PDF Parsing) ─────────────────────────────────────

export async function analyzeResume(userId: string, pdfBuffer: Buffer) {
  const prompt = `
You are an expert technical recruiter and resume analyst. Read this candidate's resume and return a JSON response.

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "skills": ["skill1", "skill2"],
  "experienceLevel": "JUNIOR" | "MID" | "SENIOR",
  "targetRole": "most likely role they're applying for",
  "scores": {
    "skills": 0-100,
    "projects": 0-100,
    "writing": 0-100,
    "ats": 0-100,
    "overall": 0-100
  },
  "gaps": ["missing skill 1", "missing skill 2"],
  "suggestions": [
    {
      "section": "Summary" | "Skills" | "Projects" | "Experience" | "General",
      "issue": "what is wrong",
      "fix": "how to fix it"
    }
  ]
}

Scoring criteria:
- skills: Are they relevant and modern? Are they listed clearly?
- projects: Do they show impact with metrics? Are they described well?
- writing: Action verbs, concise bullets, no typos, professional tone?
- ats: Keywords present, standard section names, no tables/columns?
- overall: Weighted average
`

  let result;
  let retries = 3;
  let delay = 2000; // Start with a 2-second wait

  while (retries > 0) {
    try {
      // 🚀 Pass the raw PDF buffer directly to Gemini!
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: pdfBuffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
      ])
      break; // Success! Exit the retry loop.
    } catch (error: any) {
      if (error.status === 503 && retries > 1) {
        console.warn(`⏳ Gemini API busy. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2; // Exponential backoff: waits 2s, then 4s, then 8s
      } else {
        throw error; // If it's not a 503, or we ran out of retries, throw the error
      }
    }
  }

  // @ts-ignore - result will always be defined here unless an error was thrown above
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Failed to parse AI response")
    parsed = JSON.parse(match[0])
  }

  const resume = await prisma.resume.upsert({
    where: { userId },
    update: {
      originalText: "Parsed natively by Gemini", // We no longer store raw extracted text
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "JUNIOR",
      targetRole: parsed.targetRole || null,
      score: parsed.scores?.overall || 0,
      skillsScore: parsed.scores?.skills || 0,
      projectsScore: parsed.scores?.projects || 0,
      writingScore: parsed.scores?.writing || 0,
      atsScore: parsed.scores?.ats || 0,
      suggestions: parsed.suggestions || [],
      gaps: parsed.gaps || [],
    },
    create: {
      userId,
      originalText: "Parsed natively by Gemini",
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "JUNIOR",
      targetRole: parsed.targetRole || null,
      score: parsed.scores?.overall || 0,
      skillsScore: parsed.scores?.skills || 0,
      projectsScore: parsed.scores?.projects || 0,
      writingScore: parsed.scores?.writing || 0,
      atsScore: parsed.scores?.ats || 0,
      suggestions: parsed.suggestions || [],
      gaps: parsed.gaps || [],
    },
  })

  return { resume, raw: parsed }
}

export async function getResume(userId: string) {
  return prisma.resume.findUnique({ where: { userId } })
}

export async function deleteResume(userId: string) {
  try {
    return await prisma.resume.delete({ where: { userId } })
  } catch (error) {
    // If the resume doesn't exist, ignore the error
    return null
  }
}

export async function analyzeResumeFromText(userId: string, resumeText: string) {
  const prompt = `
You are an expert technical recruiter and resume analyst. Analyze this resume text and return a JSON response.

RESUME TEXT:
${resumeText}

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "skills": ["skill1", "skill2"],
  "experienceLevel": "JUNIOR",
  "targetRole": "most likely role they're applying for",
  "scores": {
    "skills": 0-100,
    "projects": 0-100,
    "writing": 0-100,
    "ats": 0-100,
    "overall": 0-100
  },
  "gaps": ["missing skill 1", "missing skill 2"],
  "suggestions": [
    {
      "section": "Summary",
      "issue": "what is wrong",
      "fix": "how to fix it"
    }
  ]
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Failed to parse AI response")
    parsed = JSON.parse(match[0])
  }

  return prisma.resume.upsert({
    where: { userId },
    update: {
      originalText: resumeText,
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "JUNIOR",
      targetRole: parsed.targetRole || null,
      score: parsed.scores.overall || 0,
      skillsScore: parsed.scores.skills || 0,
      projectsScore: parsed.scores.projects || 0,
      writingScore: parsed.scores.writing || 0,
      atsScore: parsed.scores.ats || 0,
      suggestions: parsed.suggestions || [],
      gaps: parsed.gaps || [],
    },
    create: {
      userId,
      originalText: resumeText,
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "JUNIOR",
      targetRole: parsed.targetRole || null,
      score: parsed.scores.overall || 0,
      skillsScore: parsed.scores.skills || 0,
      projectsScore: parsed.scores.projects || 0,
      writingScore: parsed.scores.writing || 0,
      atsScore: parsed.scores.ats || 0,
      suggestions: parsed.suggestions || [],
      gaps: parsed.gaps || [],
    },
  })
}
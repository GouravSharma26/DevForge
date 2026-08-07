import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"
import { redactPII } from "../utils/redact"

const prisma = new PrismaClient()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

// ─── Resume Analysis (Native PDF Parsing) ─────────────────────────────────────

export async function analyzeResume(userId: string, pdfBuffer: Buffer, profileName: string = "PDF Upload") {
  const prompt = `
You are an expert technical recruiter and resume analyst. Read this candidate's resume and return a JSON response.

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "redactedText": "Full extracted text of the resume, but with any emails, phone numbers, and physical addresses replaced with [EMAIL REDACTED], [PHONE REDACTED], or [ADDRESS REDACTED]. Do not summarize the text, preserve the full content as closely as possible, just redact the contact info.",
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
  let delay = 2000; 

  while (retries > 0) {
    try {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: pdfBuffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
      ])
      break; 
    } catch (error: any) {
      if (error.status === 503 && retries > 1) {
        console.warn(`⏳ Gemini API busy. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2; 
      } else {
        throw error; 
      }
    }
  }

  // @ts-ignore
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Failed to parse AI response")
    parsed = JSON.parse(match[0])
  }

  // Handle redaction fallback and regex backstop
  let finalOriginalText = "[REDACTION_FAILED_OR_MISSING]"
  if (parsed.redactedText && typeof parsed.redactedText === 'string' && parsed.redactedText.trim().length > 0) {
    // Run our local regex backstop just in case the AI missed something
    finalOriginalText = redactPII(parsed.redactedText)
  } else {
    console.warn("⚠️ analyzeResume: redactedText was missing or empty in Gemini's response. Falling back to placeholder.")
  }

  // CHANGED: from upsert to create
  const resume = await prisma.resume.create({
    data: {
      userId,
      profileName, // Added profile name
      originalText: finalOriginalText, 
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

// ─── Get Multiple Resumes ───────────────────────────────────────────────────

export async function getUserResumes(userId: string) {
  return await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }, 
    select: {
      id: true,
      profileName: true, 
      targetRole: true,
      score: true,
      atsScore: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

// CHANGED: Get a specific resume by ID
export async function getResumeById(id: string, userId: string) {
  return await prisma.resume.findFirst({
    where: { id, userId },
    include: { interviews: true }
  })
}

// CHANGED: Now deletes a specific resume by ID, checking userId for security
export async function deleteResume(id: string, userId: string) {
  try {
    return await prisma.resume.deleteMany({ 
      where: { id, userId } 
    })
  } catch (error) {
    return null
  }
}

export async function forkResume(sourceId: string, userId: string, newProfileName: string) {
  // Fetch the source resume with ownership check.
  const source = await getResumeById(sourceId, userId)
  if (!source) {
    throw new Error("Source resume not found or access denied")
  }

  // Explicitly destructure out fields we DO NOT want to copy.
  // This drops id, timestamps, and the existing interviews relation.
  const { id, createdAt, updatedAt, interviews, profileName, ...resumeData } = source

  // Create the new resume with the new profile name and the remaining data.
  return await prisma.resume.create({
    data: {
      ...resumeData,
      profileName: newProfileName
    }
  })
}

// ─── Builder/Text Analysis ──────────────────────────────────────────────────

export async function analyzeResumeFromText(userId: string, resumeText: string, profileName: string = "Builder Draft") {
  const prompt = `
You are an expert technical recruiter and resume analyst. Analyze this resume text and return a JSON response.

RESUME TEXT:
${resumeText}

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "redactedText": "Full extracted text of the resume, but with any emails, phone numbers, and physical addresses replaced with [EMAIL REDACTED], [PHONE REDACTED], or [ADDRESS REDACTED]. Do not summarize the text, preserve the full content as closely as possible, just redact the contact info.",
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

  // Handle redaction fallback and regex backstop
  let finalOriginalText = ""
  if (parsed.redactedText && typeof parsed.redactedText === 'string' && parsed.redactedText.trim().length > 0) {
    // Run our local regex backstop just in case the AI missed something
    finalOriginalText = redactPII(parsed.redactedText)
  } else {
    console.warn("⚠️ analyzeResumeFromText: redactedText was missing or empty in Gemini's response. Falling back to local regex redaction on raw input.")
    finalOriginalText = redactPII(resumeText)
  }

  // CHANGED: from upsert to create
  return prisma.resume.create({
    data: {
      userId,
      profileName, // Added profile name
      originalText: finalOriginalText,
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
    }
  })
}
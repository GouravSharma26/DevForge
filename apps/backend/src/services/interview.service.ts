import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@devforge/database"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

// ─── Generate Questions ───────────────────────────────────────────────────────

export async function generateInterview(userId: string, resumeId: string) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
  if (!resume) throw new Error("Resume not found")

  const prompt = `
You are a senior technical interviewer. Based on this candidate's resume data, generate exactly 9 interview questions — 3 per round.

CANDIDATE DATA:
- Skills: ${resume.skills.join(", ")}
- Experience Level: ${resume.experienceLevel}
- Target Role: ${resume.targetRole || "Software Developer"}
- Skill Gaps: ${resume.gaps.join(", ")}

Return ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "round": 1,
      "question": "technical question based on their listed skills",
      "context": "why you're asking this based on their resume"
    },
    ... 9 total questions, 3 per round
  ]
}

Round 1 (Technical): Questions about technologies they listed
Round 2 (Projects): Questions about their actual project experience
Round 3 (Gaps): Questions about skills missing from their resume for their target role
`

  let result;
  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
    try {
      result = await model.generateContent(prompt)
      break;
    } catch (error: any) {
      if (error.status === 503 && retries > 1) {
        console.warn(`⏳ Gemini API busy generating interview. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  // @ts-ignore - result is guaranteed to be defined unless an error was thrown
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Failed to parse questions")
    parsed = JSON.parse(match[0])
  }

  const interview = await prisma.interview.create({
    data: {
      userId,
      resumeId,
      questions: {
        create: parsed.questions.map((q: any) => ({
          round: q.round,
          question: q.question,
          context: q.context || null,
        })),
      },
    },
    include: { questions: true },
  })

  return interview
}

// ─── Submit Answer ────────────────────────────────────────────────────────────

export async function submitAnswer(
  questionId: string,
  userAnswer: string,
  resumeSkills: string[]
) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })
  if (!question) throw new Error("Question not found")

  const prompt = `
You are a senior technical interviewer evaluating a candidate's answer.

Question: ${question.question}
Candidate's skills: ${resumeSkills.join(", ")}
Answer: ${userAnswer}

Return ONLY valid JSON:
{
  "score": 0-100,
  "feedback": "2-3 sentences of specific, constructive feedback",
  "strengths": "what they did well",
  "improvements": "what they could improve"
}
`

  let result;
  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
    try {
      result = await model.generateContent(prompt)
      break;
    } catch (error: any) {
      if (error.status === 503 && retries > 1) {
        console.warn(`⏳ Gemini API busy grading answer. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  // @ts-ignore - result is guaranteed to be defined unless an error was thrown
  const text = result.response.text().trim()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Failed to parse feedback")
    parsed = JSON.parse(match[0])
  }

  const feedback = `${parsed.feedback}\n\n✅ Strengths: ${parsed.strengths}\n📈 Improve: ${parsed.improvements}`

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      userAnswer,
      feedback,
      score: parsed.score,
    },
  })

  return updated
}

// ─── Complete Interview ───────────────────────────────────────────────────────

export async function completeInterview(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { questions: true },
  })
  if (!interview) throw new Error("Interview not found")

  const answered = interview.questions.filter((q) => q.score !== null)
  const avgScore =
    answered.length > 0
      ? Math.round(answered.reduce((sum, q) => sum + (q.score || 0), 0) / answered.length)
      : 0

  return prisma.interview.update({
    where: { id: interviewId },
    data: { status: "COMPLETED", score: avgScore },
    include: { questions: true },
  })
}

export async function getInterview(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      questions: { orderBy: { round: "asc" } },
      resume: true,
    },
  })
}

export async function getUserInterviews(userId: string) {
  return prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { questions: { select: { score: true } } },
  })
}
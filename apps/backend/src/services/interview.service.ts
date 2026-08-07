import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
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
      if ((error.status === 503 || error.status === 429 || error.message?.includes("429")) && retries > 1) {
        console.warn(`⏳ Gemini API busy (429/503). Retrying in ${delay / 1000} seconds...`);
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

  const questionsData = parsed.questions.map((q: any) => ({
    round: q.round,
    question: q.question,
    context: q.context || null,
  }))



  const interview = await prisma.interview.create({
    data: {
      userId,
      resumeId,
      questions: {
        create: questionsData,
      },
    },
    include: { questions: true },
  })

  return interview
}

export async function appendGrandmasterChallenge(interviewId: string, userId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId, userId }
  })
  if (!interview) throw new Error("Interview not found or unauthorized")

  const { generateGrandmasterChallenge } = await import("./grandmaster.service")
  
  // We use javascript as default. Ideally, we could parse from resume skills.
  const gmChallenge = await generateGrandmasterChallenge(interviewId, "javascript")
  
  await prisma.question.create({
    data: {
      interviewId,
      round: 4,
      isGrandmaster: true,
      language: gmChallenge.language,
      question: gmChallenge.scenario,
      buggyCode: gmChallenge.buggyCode,
      expectedOutput: gmChallenge.expectedOutput,
      context: "Grandmaster Debug Challenge",
    }
  })

  // Reopen the interview
  return prisma.interview.update({
    where: { id: interviewId },
    data: { status: "IN_PROGRESS" },
    include: { questions: true }
  })
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

  // GRANDMASTER PATH
  if (question.isGrandmaster) {
    const { runInSandbox } = await import("../utils/sandbox")
    const { evaluateGrandmasterSubmission } = await import("./grandmaster.service")
    
    const sandboxRes = await runInSandbox(userAnswer, question.language || "javascript")
    
    const evalResult = await evaluateGrandmasterSubmission(
      question.question, // The scenario
      question.expectedOutput || "", 
      userAnswer, 
      sandboxRes.stdout, 
      sandboxRes.stderr
    )

    return prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer,
        feedback: evalResult.feedback,
        score: evalResult.score,
        pistonOutput: sandboxRes.stdout + (sandboxRes.stderr ? `\nError: ${sandboxRes.stderr}` : ""),
      },
    })
  }

  // STANDARD QUESTION PATH
  // We no longer evaluate standard questions here. We just save the answer.
  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      userAnswer,
      // Leave score and feedback as null. Batch evaluation handles this on completion.
    },
  })

  return updated
}

// ─── Run Grandmaster Code (No Evaluation) ─────────────────────────────────────

export async function runGrandmasterCode(questionId: string, code: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })
  if (!question) throw new Error("Question not found")
  if (!question.isGrandmaster) throw new Error("Question is not a Grandmaster challenge")
  if (question.runAttempts >= 4) throw new Error("Maximum run attempts reached")

  const { runInSandbox } = await import("../utils/sandbox")
  const sandboxRes = await runInSandbox(code, question.language || "javascript")

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      runAttempts: { increment: 1 },
      pistonOutput: sandboxRes.stdout + (sandboxRes.stderr ? `\nError: ${sandboxRes.stderr}` : ""),
    },
  })

  return {
    stdout: sandboxRes.stdout,
    stderr: sandboxRes.stderr,
    runAttempts: updated.runAttempts,
  }
}

// ─── Complete Interview ───────────────────────────────────────────────────────

export async function completeInterview(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { questions: true, resume: true },
  })
  if (!interview) throw new Error("Interview not found")

  const standardQuestions = interview.questions.filter(q => !q.isGrandmaster)
  
  // Find standard questions that are answered but not yet graded
  const ungraded = standardQuestions.filter(q => q.userAnswer && q.score === null)

  if (ungraded.length > 0) {
    const prompt = `
You are a senior technical interviewer. Evaluate the candidate's answers to the following questions.
Candidate's skills: ${interview.resume?.skills?.join(", ") || "General IT"}

Questions and Answers:
${ungraded.map(q => `
ID: ${q.id}
Question: ${q.question}
Answer: ${q.userAnswer}
`).join("\n")}

Return ONLY a valid JSON array of objects, one for each question evaluated.
Format exactly like this:
[
  {
    "questionId": "the ID provided above",
    "score": <number 0-100>,
    "feedback": "2-3 sentences of specific, constructive feedback",
    "strengths": "what they did well",
    "improvements": "what they could improve"
  }
]
`
    let result;
    let retries = 2; // initial + 2 retries
    let delay = 2000;
    let success = false;
    let parsedArray: any[] = [];

    while (retries >= 0 && !success) {
      try {
        result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        
        let jsonStr = text;
        const match = text.match(/\[[\s\S]*\]/)
        if (match) {
          jsonStr = match[0]
        }
        
        parsedArray = JSON.parse(jsonStr)
        if (!Array.isArray(parsedArray)) throw new Error("Result is not an array")
        success = true;
      } catch (error: any) {
        if (retries > 0) {
          console.warn(`⏳ Gemini batch evaluation failed (${error.message}). Retrying in ${delay / 1000} seconds...`);
          await new Promise(r => setTimeout(r, delay));
          retries--;
          delay *= 2;
        } else {
          console.error("❌ Gemini batch evaluation exhausted all retries.");
          throw new Error("Failed to evaluate answers. Please try again.");
        }
      }
    }

    // Apply the valid evaluations
    for (const item of parsedArray) {
      if (item.questionId && typeof item.score === 'number' && item.feedback) {
        const fullFeedback = `${item.feedback}\n\n✅ Strengths: ${item.strengths || "N/A"}\n📈 Improve: ${item.improvements || "N/A"}`
        await prisma.question.update({
          where: { id: item.questionId },
          data: {
            score: item.score,
            feedback: fullFeedback
          }
        })
      }
    }
  }

  // Refetch to get updated scores
  const updatedInterview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { questions: true }
  })
  
  if (!updatedInterview) throw new Error("Interview disappeared")

  const stdQs = updatedInterview.questions.filter(q => !q.isGrandmaster)
  const graded = stdQs.filter((q) => q.score !== null)
  
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((sum, q) => sum + (q.score || 0), 0) / graded.length)
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
    include: { 
      questions: { select: { score: true } },
      resume: { select: { id: true, profileName: true, targetRole: true } }
    },
  })
}

export async function deleteInterview(interviewId: string, userId: string) {
  return prisma.interview.deleteMany({
    where: {
      id: interviewId,
      userId, // Ensure ownership
    },
  })
}
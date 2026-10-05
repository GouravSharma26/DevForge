import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai"
import { prisma } from "@devforge/database"
import { consumeAiRequest } from "../utils/ai-rate-limit"

function getModel(systemInstruction: string, schema: Schema) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  })
}

// ─── Generate Questions ───────────────────────────────────────────────────────

export async function generateInterview(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } })
  if (!resume) throw new Error("Resume not found or access denied")
  await consumeAiRequest(userId, prisma)

  const primaryLanguage = resume.skills[0] || "JavaScript"

  const systemInstruction = "You are a senior technical interviewer. Generate exactly 9 interview questions (3 per round) PLUS 1 Grandmaster debug challenge."
  
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            round: { type: SchemaType.NUMBER },
            question: { type: SchemaType.STRING, description: "technical question based on their listed skills" },
            context: { type: SchemaType.STRING, description: "why you're asking this based on their resume" }
          },
          required: ["round", "question", "context"]
        }
      },
      grandmaster: {
        type: SchemaType.OBJECT,
        properties: {
          scenario: { type: SchemaType.STRING, description: "Explanation of what the buggy code is supposed to do" },
          language: { type: SchemaType.STRING },
          buggyCode: { type: SchemaType.STRING, description: "The buggy code that prints output to stdout" },
          expectedOutput: { type: SchemaType.STRING, description: "The exact stdout expected if fixed" }
        },
        required: ["scenario", "language", "buggyCode", "expectedOutput"]
      }
    },
    required: ["questions"]
  }

  const model = getModel(systemInstruction, schema)

  const prompt = `
CANDIDATE DATA:
- Skills: ${resume.skills.join(", ")}
- Experience Level: ${resume.experienceLevel}
- Target Role: ${resume.targetRole || "Software Developer"}
- Skill Gaps: ${resume.gaps.join(", ")}
- Primary Language: ${primaryLanguage}

Round 1 (Technical): Questions about technologies they listed
Round 2 (Projects): Questions about their actual project experience
Round 3 (Gaps): Questions about skills missing from their resume for their target role
Grandmaster: A concise, self-contained debug challenge with a logical bug (no syntax errors) that prints output to stdout in ${primaryLanguage}.
`

  let result;
  let retries = 2; // Reduced retries due to schema
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

  const text = result!.response.text().trim()
  const parsed = JSON.parse(text)

  const questionsData = parsed.questions.map((q: any) => ({
    round: q.round,
    question: q.question,
    context: q.context || null,
    isGrandmaster: false,
  }))

  if (parsed.grandmaster) {
    questionsData.push({
      round: 4,
      isGrandmaster: true,
      question: parsed.grandmaster.scenario,
      language: parsed.grandmaster.language,
      buggyCode: parsed.grandmaster.buggyCode,
      expectedOutput: parsed.grandmaster.expectedOutput,
      context: "Grandmaster Debug Challenge",
    })
  }
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

  // The Grandmaster question is now pre-generated and stored in the DB during interview creation.
  // We just need to reopen the interview.

  // Reopen the interview
  return prisma.interview.update({
    where: { id: interviewId },
    data: { status: "IN_PROGRESS" },
    include: { questions: true }
  })
}

// ─── Submit Answer ────────────────────────────────────────────────────────────

export async function submitAnswer(
  interviewId: string,
  userId: string,
  questionId: string,
  userAnswer: string
) {
  const question = await prisma.question.findFirst({
    where: { id: questionId, interviewId, interview: { userId } },
    include: { interview: true }
  })
  if (!question) throw Object.assign(new Error("Not found"), { statusCode: 404 })

  // GRANDMASTER PATH
  if (question.isGrandmaster) {
    const { executeCode } = await import("./piston.service")
    const { evaluateGrandmasterSubmission } = await import("./grandmaster.service")
    
    const pistonRes = await executeCode(question.language || "javascript", userAnswer)
    const stdout = pistonRes.run.stdout
    const stderr = pistonRes.run.stderr
    
    const evalResult = await evaluateGrandmasterSubmission(
      userId,
      question.question, // The scenario
      question.expectedOutput || "", 
      userAnswer, 
      stdout, 
      stderr
    )

    return prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer,
        feedback: evalResult.feedback,
        score: evalResult.score,
        pistonOutput: stdout + (stderr ? `\nError: ${stderr}` : ""),
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

export async function runGrandmasterCode(interviewId: string, userId: string, questionId: string, code: string) {
  const questionCheck = await prisma.question.findUnique({
    where: { id: questionId },
    include: { interview: true }
  })

  if (!questionCheck || questionCheck.interview?.userId !== userId || questionCheck.interviewId !== interviewId || !questionCheck.isGrandmaster) {
    throw Object.assign(new Error("Not found"), { statusCode: 404 })
  }

  if (questionCheck.runAttempts >= 4) {
    throw Object.assign(new Error("Run limit reached"), { statusCode: 429 })
  }

  await prisma.question.update({
    where: { id: questionId },
    data: { runAttempts: { increment: 1 } },
  })

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  const { executeCode } = await import("./piston.service")
  const pistonRes = await executeCode(question!.language || "javascript", code)
  const stdout = pistonRes.run.stdout
  const stderr = pistonRes.run.stderr

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      pistonOutput: stdout + (stderr ? `\nError: ${stderr}` : ""),
    },
  })

  return {
    stdout: stdout,
    stderr: stderr,
    runAttempts: updated.runAttempts,
  }
}

// ─── Complete Interview ───────────────────────────────────────────────────────

export async function completeInterview(interviewId: string, userId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    include: { questions: true, resume: true },
  })
  if (!interview) throw Object.assign(new Error("Interview not found"), { statusCode: 404 })
  
  await consumeAiRequest(interview.userId, prisma)

  const standardQuestions = interview.questions.filter(q => !q.isGrandmaster)
  
  // Find standard questions that are answered but not yet graded
  const ungraded = standardQuestions.filter(q => q.userAnswer && q.score === null)

  if (ungraded.length > 0) {
    const systemInstruction = "You are a senior technical interviewer. Evaluate the candidate's answers to the questions. Be constructive and specific."
    
    const schema: Schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionId: { type: SchemaType.STRING, description: "the ID of the question" },
          score: { type: SchemaType.NUMBER, description: "0-100" },
          feedback: { type: SchemaType.STRING, description: "2-3 sentences of specific, constructive feedback" },
          strengths: { type: SchemaType.STRING, description: "what they did well" },
          improvements: { type: SchemaType.STRING, description: "what they could improve" }
        },
        required: ["questionId", "score", "feedback", "strengths", "improvements"]
      }
    }

    const model = getModel(systemInstruction, schema)
    
    const prompt = `
Candidate's skills: ${interview.resume?.skills?.join(", ") || "General IT"}

Questions and Answers:
${ungraded.map(q => `
ID: ${q.id}
Question: ${q.question}
Answer: ${q.userAnswer}
`).join("\n")}
`
    let result;
    let retries = 1; // Reduced retries
    let delay = 2000;
    let success = false;
    let parsedArray: any[] = [];

    while (retries >= 0 && !success) {
      try {
        result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        parsedArray = JSON.parse(text)
        success = true;
      } catch (error: any) {
        if (retries > 0) {
          console.warn(`⏳ Gemini batch evaluation failed (${error.message}). Retrying in ${delay / 1000} seconds...`);
          await new Promise(r => setTimeout(r, delay));
          retries--;
          delay *= 2;
        } else {
          console.error("❌ Gemini batch evaluation exhausted all retries. Using fallback.");
          success = true;
          // Create fallback array for ungraded questions
          parsedArray = ungraded.map(q => ({
            questionId: q.id,
            score: null, // No score given
            feedback: "Evaluation failed due to API quota limits. Please review your answer manually.",
            strengths: "N/A",
            improvements: "N/A"
          }));
        }
      }
    }

    // Apply the valid evaluations (or fallbacks)
    for (const item of parsedArray) {
      if (item.questionId && item.feedback) {
        const fullFeedback = item.score !== null 
          ? `${item.feedback}\n\n✅ Strengths: ${item.strengths || "N/A"}\n📈 Improve: ${item.improvements || "N/A"}`
          : item.feedback;
        
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

  // ─── Gamification: Award XP for passing interviews ───
  if (avgScore >= 70) {
    const { awardXp } = await import("./xp.service")
    const xpReward = updatedInterview.type === "AI_AGENT" ? 350 : 250
    await awardXp(userId, xpReward).catch(err => console.error("Failed to award XP:", err))
  }

  return prisma.interview.update({
    where: { id: interviewId },
    data: { status: "COMPLETED", score: avgScore },
    include: { questions: true },
  })
}

export async function getInterview(interviewId: string, userId: string) {
  return prisma.interview.findFirst({
    where: { id: interviewId, userId },
    include: {
      questions: {
        orderBy: { round: "asc" },
        select: {
          id: true,
          round: true,
          question: true,
          context: true,
          isGrandmaster: true,
          language: true,
          buggyCode: true,
          userAnswer: true,
          score: true,
          feedback: true,
          pistonOutput: true,
          runAttempts: true,
          interviewId: true
        }
      },
      resume: { select: { id: true, profileName: true, targetRole: true, skills: true } },
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
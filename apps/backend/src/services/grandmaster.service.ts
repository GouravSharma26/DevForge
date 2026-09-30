import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai"
import { prisma } from "@devforge/database"
import { runInSandbox } from "../utils/sandbox"
import { consumeAiRequest } from "../utils/ai-rate-limit"
import crypto from "crypto"

function getModel(systemInstruction: string, schema?: Schema) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction,
    generationConfig: schema ? {
      responseMimeType: "application/json",
      responseSchema: schema
    } : undefined
  })
}

const challengeCache = new Map<string, any>()

export async function generateGrandmasterChallenge(interviewId: string, primaryLanguage: string) {
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } })
  if (!interview) throw new Error("Interview not found")
  await consumeAiRequest(interview.userId, prisma)

  const cacheKey = crypto.createHash("sha256").update(`${primaryLanguage}-grandmaster-challenge`).digest("hex")
  if (challengeCache.has(cacheKey)) {
    console.log(`✅ Grandmaster challenge cache hit for ${primaryLanguage}`)
    return challengeCache.get(cacheKey)
  }

  const systemInstruction = "You are an expert technical interviewer. Generate a concise, self-contained debug challenge. The code MUST contain a logical bug (not a syntax error) and must print its output to stdout so it can be evaluated."
  
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      scenario: { type: SchemaType.STRING, description: "Explanation of what the code is supposed to do." },
      language: { type: SchemaType.STRING },
      buggyCode: { type: SchemaType.STRING, description: "The buggy code that prints output to stdout." },
      expectedOutput: { type: SchemaType.STRING, description: "The exact stdout expected if fixed." }
    },
    required: ["scenario", "language", "buggyCode", "expectedOutput"]
  }

  const model = getModel(systemInstruction, schema)

  const maxRetries = 2; // Reduced retries since parse failures are eliminated
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const prompt = `Generate a debug challenge in ${primaryLanguage}.`
    let result;
    try {
      result = await model.generateContent(prompt)
    } catch (err: any) {
      if (err.status === 429 || err.message?.includes("429") || err.status === 503) {
        console.warn("⏳ Gemini API rate limit hit in Grandmaster generation. Retrying...");
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }

    try {
      const parsed = JSON.parse(result.response.text())

      // PRE-CHECK
      const sandboxRes = await runInSandbox(parsed.buggyCode, parsed.language)
      
      if (sandboxRes.stderr && !sandboxRes.stdout) {
        console.warn("Sandbox pre-check failed (syntax/compile error). Retrying generation...", sandboxRes.stderr)
        continue;
      }

      const finalChallenge = {
        scenario: parsed.scenario,
        language: parsed.language,
        buggyCode: parsed.buggyCode,
        expectedOutput: parsed.expectedOutput
      }

      challengeCache.set(cacheKey, finalChallenge)
      return finalChallenge
    } catch (err: any) {
      console.warn("Challenge generation parse error (unlikely with schema), retrying...", err.message)
    }
  }

  throw new Error("Failed to generate a valid grandmaster challenge.")
}

export async function evaluateGrandmasterSubmission(userId: string, scenario: string, expectedOutput: string, submittedCode: string, pistonStdout: string, pistonStderr: string) {
  await consumeAiRequest(userId, prisma)
  
  const systemInstruction = "You are an expert code evaluator. Evaluate whether the user's submitted fix solves the bug based on the scenario, expected output, and actual execution output."
  
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      score: { type: SchemaType.NUMBER, description: "0-100, 100 meaning completely fixed and correct" },
      feedback: { type: SchemaType.STRING, description: "Brief, constructive feedback on their fix (or lack thereof)." }
    },
    required: ["score", "feedback"]
  }

  const model = getModel(systemInstruction, schema)

  const prompt = `
Scenario:
${scenario}

Expected Output:
${expectedOutput}

User's Submitted Code:
${submittedCode}

Actual Execution Output (Stdout):
${pistonStdout || "<empty>"}

Execution Errors (Stderr):
${pistonStderr || "<empty>"}
  `

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())

    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
      feedback: parsed.feedback || "Code evaluated."
    }
  } catch (err: any) {
    console.warn("Evaluation failed...", err.message)
    return {
      score: 0,
      feedback: "Evaluation failed due to an unexpected error. Please review your code manually."
    }
  }
}


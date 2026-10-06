import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai"
import { prisma } from "@devforge/database"
import { executeCode } from "./piston.service"
import { withGeminiRetry } from "../utils/gemini"

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
      expectedOutput: { type: SchemaType.STRING, description: "The exact stdout expected if fixed." },
      fixedCode: { type: SchemaType.STRING, description: "The corrected code that prints expectedOutput." }
    },
    required: ["scenario", "language", "buggyCode", "expectedOutput", "fixedCode"]
  }

  const model = getModel(systemInstruction, schema)

  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    const prompt = `Generate a debug challenge in ${primaryLanguage}.`
    let result;
    try {
      result = await withGeminiRetry(() => model.generateContent(prompt))
      const parsed = JSON.parse(result.response.text())

      // PRE-CHECK
      const buggyRes = await executeCode(parsed.language, parsed.buggyCode)
      const fixedRes = await executeCode(parsed.language, parsed.fixedCode)
      
      if (buggyRes.run.stderr && !buggyRes.run.stdout) {
        console.warn("Sandbox pre-check failed (syntax/compile error in buggy code). Retrying generation...", buggyRes.run.stderr)
        continue;
      }
      
      if (fixedRes.run.stdout?.trim() !== parsed.expectedOutput?.trim()) {
        console.warn("Sandbox pre-check failed (fixed code stdout does not match expected). Retrying generation...")
        continue;
      }

      if (buggyRes.run.stdout?.trim() === parsed.expectedOutput?.trim()) {
        console.warn("Sandbox pre-check failed (buggy code stdout matches expected!). Retrying generation...")
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
      console.warn("Challenge generation parse/API error, retrying...", err.message)
    }
  }

  throw new Error("Failed to generate a valid grandmaster challenge.")
}

export async function evaluateGrandmasterSubmission(userId: string, scenario: string, expectedOutput: string, submittedCode: string, pistonStdout: string, pistonStderr: string) {
  
  const truncatedStdout = (pistonStdout || "<empty>").substring(0, 500);
  const truncatedStderr = (pistonStderr || "<empty>").substring(0, 500);
  
  // Deterministic judging
  const score = truncatedStdout.trim() === expectedOutput.trim() ? 100 : 0;

  const systemInstruction = "You are an expert code evaluator. Provide brief, constructive feedback on the user's submitted fix based on the scenario, expected output, and actual execution output. They scored " + score + "/100."
  
  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      feedback: { type: SchemaType.STRING, description: "Brief, constructive feedback on their fix (or lack thereof)." }
    },
    required: ["feedback"]
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
${truncatedStdout}

Execution Errors (Stderr):
${truncatedStderr}
  `

  try {
    const result = await withGeminiRetry(() => model.generateContent(prompt))
    const parsed = JSON.parse(result.response.text())

    return {
      score,
      feedback: parsed.feedback || "Code evaluated."
    }
  } catch (err: any) {
    console.warn("Evaluation failed...", err.message)
    return {
      score,
      feedback: score === 100 ? "Correct fix! Output matched expected." : "Evaluation failed, but output did not match expected."
    }
  }
}


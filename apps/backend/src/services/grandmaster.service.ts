import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"
import { runInSandbox } from "../utils/sandbox"

const prisma = new PrismaClient()

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
}

export async function generateGrandmasterChallenge(interviewId: string, primaryLanguage: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const prompt = `
You are an expert technical interviewer. Generate a concise, self-contained debug challenge in ${primaryLanguage}.
The code MUST contain a logical bug (not a syntax error) and must print its output to stdout so it can be evaluated.

Return ONLY valid JSON with exactly this structure:
{
  "scenario": "Explanation of what the code is supposed to do.",
  "language": "${primaryLanguage}",
  "buggyCode": "function solve() { ... } console.log(solve());",
  "expectedOutput": "The exact stdout expected if fixed."
}
    `
    let result;
    try {
      result = await getModel().generateContent(prompt)
    } catch (err: any) {
      if (err.status === 429 || err.message?.includes("429") || err.status === 503) {
        console.warn("⏳ Gemini API rate limit hit in Grandmaster generation. Retrying...");
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }
    const responseText = result.response.text()

    try {
      const match = responseText.match(/```json\n([\s\S]*?)\n```/)
      const jsonStr = match ? match[1] : responseText
      const parsed = JSON.parse(jsonStr)

      // PRE-CHECK
      // Verify that the buggy code actually runs (even if output is wrong)
      // This ensures it doesn't have a compilation/syntax error that breaks the sandbox entirely.
      const sandboxRes = await runInSandbox(parsed.buggyCode, parsed.language)
      
      // If code runs without failing compilation completely (or timedOut), we accept it.
      if (sandboxRes.stderr && !sandboxRes.stdout) {
        // If it strictly produces a compilation/syntax error (like missing bracket), retry.
        console.warn("Sandbox pre-check failed (syntax/compile error). Retrying generation...", sandboxRes.stderr)
        continue;
      }

      return {
        scenario: parsed.scenario,
        language: parsed.language,
        buggyCode: parsed.buggyCode,
        expectedOutput: parsed.expectedOutput
      }
    } catch (err: any) {
      console.warn("Challenge generation parse error, retrying...", err.message)
    }
  }

  throw new Error("Failed to generate a valid grandmaster challenge after 3 attempts.")
}

export async function evaluateGrandmasterSubmission(scenario: string, expectedOutput: string, submittedCode: string, pistonStdout: string, pistonStderr: string) {
  const prompt = `
You are an expert code evaluator. The user submitted a fix for a debug challenge.

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

Did the user successfully fix the bug? Analyze their code and the actual execution output.
Return ONLY valid JSON with exactly this structure:
{
  "score": <number 0-100, 100 meaning completely fixed and correct>,
  "feedback": "Brief, constructive feedback on their fix (or lack thereof)."
}
  `

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const result = await getModel().generateContent(prompt)
      const responseText = result.response.text()
      const match = responseText.match(/```json\n([\s\S]*?)\n```/)
      const jsonStr = match ? match[1] : responseText
      const parsed = JSON.parse(jsonStr)

      return {
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
        feedback: parsed.feedback || "Code evaluated."
      }
    } catch (err: any) {
      console.warn("Evaluation parse error, retrying...", err.message)
    }
  }

  // FALLBACK for final evaluation call
  return {
    score: 0,
    feedback: "Evaluation failed due to an unexpected error. Please review your code manually."
  }
}

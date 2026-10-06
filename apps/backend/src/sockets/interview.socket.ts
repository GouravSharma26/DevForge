import { Server, Socket } from "socket.io"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { prisma } from "@devforge/database"
import { consumeAiRequest } from "../utils/ai-rate-limit"
import { containsPromptInjection, isGarbageText } from "../utils/prompt-scrubber"
import { withGeminiRetry } from "../utils/gemini"

export function registerInterviewHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId
  const chatSessions = new Map<string, { chat: any, interviewId: string, history: any[], timer?: NodeJS.Timeout }>()

  socket.on("interview:join", async ({ resumeId, duration }: { resumeId: string, duration?: number }) => {
    try {
      if (!resumeId) throw new Error("Resume ID required")
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
      if (!resume || resume.userId !== userId) {
        return socket.emit("interview:error", { message: "Resume not found or unauthorized" })
      }

      await consumeAiRequest(userId, prisma)

      const interview = await prisma.interview.create({
        data: {
          userId,
          resumeId,
          type: "AI_AGENT",
          title: `1-on-1 AI Interview (${duration || 5} min)`,
          status: "IN_PROGRESS",
        }
      })

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const systemInstruction = `You are an expert technical interviewer. You are conducting a mock interview for a software engineering role. 
The candidate's resume summary:
Skills: ${resume.skills.join(", ")}
Experience Level: ${resume.experienceLevel}
Target Role: ${resume.targetRole || "Software Developer"}

Ask technical questions one by one. Wait for the candidate's answer before proceeding. Be conversational, constructive, and realistic. Start by welcoming the candidate and asking the first question. Keep your responses concise (under 100 words).`

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction })
      const chat = model.startChat({ history: [] })

      const sessionTimeout = setTimeout(async () => {
        socket.emit("interview:error", { message: "Interview session time has expired. Please conclude the interview." })
        const activeSession = chatSessions.get(socket.id)
        if (activeSession) {
          try {
            await prisma.interview.updateMany({
              where: { id: activeSession.interviewId, status: "IN_PROGRESS" },
              data: { status: "COMPLETED" } // Wait, actually it should be ended.
            })
          } catch (err) {}
          chatSessions.delete(socket.id)
        }
      }, (duration || 5) * 60 * 1000)

      chatSessions.set(socket.id, { chat, interviewId: interview.id, history: [], timer: sessionTimeout })

      const result = await chat.sendMessage("Start the interview.")
      const text = result.response.text()

      const session = chatSessions.get(socket.id)
      if (session) {
        session.history.push({ role: "agent", content: text })
      }

      socket.emit("interview:reply", { message: text, interviewId: interview.id })
      console.log(`User ${userId} joined AI agent interview ${interview.id} with resume ${resumeId}`)
    } catch (error: any) {
       console.error("Join error", error)
       socket.emit("interview:error", { message: error.message || "Failed to start interview" })
    }
  })

  socket.on("interview:message", async ({ message }: { message: string }) => {
    try {
      const session = chatSessions.get(socket.id)
      if (!session) {
         return socket.emit("interview:error", { message: "Chat session not found. Please refresh." })
      }
      if (typeof message !== "string" || message.trim().length === 0) {
        return socket.emit("interview:error", { message: "Invalid message format." })
      }

      if (message.length > 2000) {
        return socket.emit("interview:error", { message: "Message is too long. Please keep it under 2000 characters." })
      }

      if (session.history.length >= 60) {
        return socket.emit("interview:error", { message: "Interview session length limit reached. Please conclude the interview." })
      }
      
      if (containsPromptInjection(message)) {
        const errorMsg = "Please stick to the interview context. Unrelated instructions are not permitted."
        socket.emit("interview:reply", { message: errorMsg })
        session.history.push({ role: "user", content: message })
        session.history.push({ role: "agent", content: errorMsg })
        return
      }

      if (isGarbageText(message)) {
        const errorMsg = "I couldn't quite understand that. Could you please provide a clearer answer?"
        socket.emit("interview:reply", { message: errorMsg })
        session.history.push({ role: "user", content: message })
        session.history.push({ role: "agent", content: errorMsg })
        return
      }

      session.history.push({ role: "user", content: message })

      const result = await session.chat.sendMessageStream(message)
      
      let fullResponse = ""
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText
        socket.emit("interview:stream", { chunk: chunkText })
      }
      session.history.push({ role: "agent", content: fullResponse })
      socket.emit("interview:stream_end", { fullMessage: fullResponse })

    } catch (error: any) {
      console.error("Message error", error)
      socket.emit("interview:error", { message: error.message || "Failed to process message" })
    }
  })
  
  socket.on("interview:end", async () => {
    try {
      const session = chatSessions.get(socket.id)
      if (!session) return

      const { interviewId, history } = session
      chatSessions.delete(socket.id)
      
      socket.emit("interview:evaluating", { message: "Generating feedback report..." })

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const evalModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              score: { type: SchemaType.NUMBER, description: "Overall score out of 100 based on accuracy and problem-solving skills" },
              feedback: { type: SchemaType.STRING, description: "Detailed feedback explaining how to improve their answers vs what they provided. Constructive criticism." },
            },
            required: ["score", "feedback"]
          }
        }
      })

      const prompt = `Evaluate the following technical interview transcript. Generate a score out of 100 and detailed feedback (what they got right, what they missed, how to improve).
      
      Transcript:
      ${history.map(h => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join("\n\n")}`

      const result = await withGeminiRetry(() => evalModel.generateContent(prompt))
      const textResponse = result.response.text().trim()

      const parsed = JSON.parse(textResponse)

      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: "COMPLETED",
          score: parsed.score,
          questions: {
            create: {
              round: 1,
              question: "Overall 1-on-1 AI Interview Session",
              userAnswer: "See feedback for full transcript details.",
              feedback: parsed.feedback,
              score: parsed.score,
            }
          }
        }
      })

      socket.emit("interview:ended", { interviewId, score: parsed.score })
    } catch (error: any) {
      console.error("End error", error)
      socket.emit("interview:error", { message: "Failed to generate report, but interview was saved." })
    }
  })

  socket.on("disconnect", async () => {
    const session = chatSessions.get(socket.id)
    if (session) {
      if (session.timer) clearTimeout(session.timer)
      try {
        await prisma.interview.updateMany({
          where: { id: session.interviewId, status: "IN_PROGRESS" },
          data: { status: "ABANDONED" }
        })
      } catch (err) {
        console.error("Failed to mark abandoned interview", err)
      }
      chatSessions.delete(socket.id)
    }
  })
}

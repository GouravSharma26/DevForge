import { Server, Socket } from "socket.io"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@devforge/database"
import { consumeAiRequest } from "../utils/ai-rate-limit"

export function registerInterviewHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId
  const chatSessions = new Map<string, any>()

  socket.on("interview:join", async ({ resumeId }: { resumeId: string }) => {
    try {
      if (!resumeId) throw new Error("Resume ID required")
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
      if (!resume || resume.userId !== userId) {
        return socket.emit("interview:error", { message: "Resume not found or unauthorized" })
      }

      await consumeAiRequest(userId, prisma)

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const systemInstruction = `You are an expert technical interviewer. You are conducting a mock interview for a software engineering role. 
The candidate's resume summary:
Skills: ${resume.skills.join(", ")}
Experience Level: ${resume.experienceLevel}
Target Role: ${resume.targetRole || "Software Developer"}

Ask technical questions one by one. Wait for the candidate's answer before proceeding. Be conversational, constructive, and realistic. Start by welcoming the candidate and asking the first question. Keep your responses concise.`

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction })
      const chat = model.startChat({ history: [] })

      chatSessions.set(socket.id, chat)

      const result = await chat.sendMessage("Start the interview.")
      const text = result.response.text()

      socket.emit("interview:reply", { message: text })
      console.log(`User ${userId} joined AI agent interview with resume ${resumeId}`)
    } catch (error: any) {
       console.error("Join error", error)
       socket.emit("interview:error", { message: error.message || "Failed to start interview" })
    }
  })

  socket.on("interview:message", async ({ message }: { message: string }) => {
    try {
      const chat = chatSessions.get(socket.id)
      if (!chat) {
         return socket.emit("interview:error", { message: "Chat session not found. Please refresh." })
      }
      
      const result = await chat.sendMessageStream(message)
      
      let fullResponse = ""
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText
        socket.emit("interview:stream", { chunk: chunkText })
      }
      socket.emit("interview:stream_end", { fullMessage: fullResponse })

    } catch (error: any) {
      console.error("Message error", error)
      socket.emit("interview:error", { message: error.message || "Failed to process message" })
    }
  })
  
  socket.on("disconnect", () => {
    chatSessions.delete(socket.id)
  })
}

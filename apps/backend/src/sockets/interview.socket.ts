import { Server, Socket } from "socket.io"

export function registerInterviewHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId

  socket.on("interview:join", async ({ interviewId }: { interviewId: string }) => {
    socket.join(interviewId)
    // TODO: Load interview state and send initial welcome
    console.log(`User ${userId} joined interview ${interviewId}`)
  })

  socket.on("interview:message", async ({ interviewId, message }: { interviewId: string, message: string }) => {
    // TODO: Handle incoming message, validate access, send to Gemini, stream response
    console.log(`User ${userId} sent message in interview ${interviewId}: ${message}`)
  })
  
  socket.on("interview:leave", async ({ interviewId }: { interviewId: string }) => {
    socket.leave(interviewId)
    console.log(`User ${userId} left interview ${interviewId}`)
  })
}

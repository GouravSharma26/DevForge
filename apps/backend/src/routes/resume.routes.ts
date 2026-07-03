import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { PrismaClient } from "@prisma/client"
import {
  analyzeResume,
  analyzeResumeFromText,
  getResume,
} from "../services/resume.service"
import {
  generateInterview,
  submitAnswer,
  completeInterview,
  getInterview,
  getUserInterviews,
} from "../services/interview.service"
import {
  saveResumeBuilder,
  loadResumeBuilder,
  generateResumeWithAI,
} from "../services/resume-builder.service"

const prisma = new PrismaClient()

export async function resumeRoutes(app: FastifyInstance) {

  // GET /api/resume/builder
  app.get("/builder", { preHandler: [authenticate] }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const data = await loadResumeBuilder(userId)
    return reply.send({ success: true, data })
  })

  // POST /api/resume/builder
  app.post(
    "/builder",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Body: { sections: any[]; template: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const { sections, template } = req.body
      const data = await saveResumeBuilder(userId, sections, template)
      return reply.send({ success: true, data })
    }
  )

  // POST /api/resume/builder/ai-fill
  app.post(
    "/builder/ai-fill",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Body: { sections: any[] } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const filled = await generateResumeWithAI(userId, req.body.sections)
        return reply.send({ success: true, data: filled })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // DELETE /api/resume/builder
  app.delete(
    "/builder",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        await prisma.resumeBuilder.delete({ where: { userId } })
        return reply.send({ success: true, data: { message: "Resume builder deleted" } })
      } catch {
        return reply.status(404).send({ success: false, error: "No built resume found" })
      }
    }
  )

  // POST /api/resume/analyze-builder
  app.post(
    "/analyze-builder",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const builder = await prisma.resumeBuilder.findUnique({ where: { userId } })
      if (!builder) {
        return reply.status(404).send({ success: false, error: "No built resume found" })
      }

      const sections = builder.sections as any[]
      const personal = sections.find((s: any) => s.type === "personal")?.data
      const summary  = sections.find((s: any) => s.type === "summary")?.data
      const exp      = sections.find((s: any) => s.type === "experience")?.data
      const edu      = sections.find((s: any) => s.type === "education")?.data
      const skills   = sections.find((s: any) => s.type === "skills")?.data
      const projects = sections.find((s: any) => s.type === "projects")?.data

      const resumeText = `
NAME: ${personal?.name || ""}
TITLE: ${personal?.title || ""}
EMAIL: ${personal?.email || ""}
LOCATION: ${personal?.location || ""}

SUMMARY:
${summary?.text || "No summary provided"}

EXPERIENCE:
${exp?.items?.filter((i: any) => i.company || i.position).map((i: any) =>
  `${i.position} at ${i.company} (${i.startDate} - ${i.current ? "Present" : i.endDate})\n${i.bullets?.filter((b: string) => b).join("\n")}`
).join("\n\n") || "No experience listed"}

EDUCATION:
${edu?.items?.filter((i: any) => i.institution).map((i: any) =>
  `${i.degree} in ${i.field} from ${i.institution} (GPA: ${i.gpa || "N/A"})`
).join("\n") || "No education listed"}

SKILLS:
${skills?.items?.filter((i: any) => i.skills).map((i: any) =>
  `${i.category}: ${i.skills}`
).join("\n") || "No skills listed"}

PROJECTS:
${projects?.items?.filter((i: any) => i.name).map((i: any) =>
  `${i.name} (${i.tech})\n${i.bullets?.filter((b: string) => b).join("\n")}`
).join("\n\n") || "No projects listed"}
      `.trim()

      try {
        const resume = await analyzeResumeFromText(userId, resumeText)
        return reply.send({ success: true, data: resume })
      } catch (err: any) {
        console.error("Analyze builder error:", err)
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/upload
  app.post(
    "/upload",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const data = await req.file()
      if (!data) return reply.status(400).send({ success: false, error: "No file uploaded" })
      if (data.mimetype !== "application/pdf") return reply.status(400).send({ success: false, error: "Only PDF files allowed" })
      const buffer = await data.toBuffer()
      if (buffer.length > 5 * 1024 * 1024) return reply.status(400).send({ success: false, error: "File too large (max 5MB)" })
      try {
        const result = await analyzeResume(userId, buffer)
        return reply.send({ success: true, data: result.resume })
      } catch (err: any) {
        console.error("🚨 UPLOAD CRASH:", err)
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // GET /api/resume
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const resume = await getResume(userId)
      return reply.send({ success: true, data: resume })
    }
  )

  // DELETE /api/resume
  app.delete(
    "/",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        await prisma.resume.delete({ where: { userId } })
        return reply.send({ success: true, data: { message: "Resume deleted" } })
      } catch {
        return reply.status(404).send({ success: false, error: "No resume found" })
      }
    }
  )

  // PATCH /api/resume
  app.patch(
    "/",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Body: { skills?: string[]; gaps?: string[]; targetRole?: string; suggestions?: any[] }
      }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { skills, gaps, targetRole, suggestions } = req.body
      const resume = await prisma.resume.update({
        where: { userId },
        data: {
          ...(skills      !== undefined && { skills }),
          ...(gaps        !== undefined && { gaps }),
          ...(targetRole  !== undefined && { targetRole }),
          ...(suggestions !== undefined && { suggestions }),
        },
      })
      return reply.send({ success: true, data: resume })
    }
  )

  // POST /api/resume/interview
  app.post(
    "/interview",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Body: { resumeId: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const interview = await generateInterview(userId, req.body.resumeId)
        return reply.send({ success: true, data: interview })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // GET /api/resume/interviews
  app.get(
    "/interviews",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const interviews = await getUserInterviews(userId)
      return reply.send({ success: true, data: interviews })
    }
  )

  // GET /api/resume/interview/:id
  app.get(
    "/interview/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const interview = await getInterview(req.params.id)
      if (!interview) return reply.status(404).send({ success: false, error: "Interview not found" })
      return reply.send({ success: true, data: interview })
    }
  )

  // POST /api/resume/interview/:id/answer
  app.post(
    "/interview/:id/answer",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { questionId: string; answer: string } }>,
      reply
    ) => {
      const { questionId, answer } = req.body
      const interview = await getInterview(req.params.id)
      if (!interview) return reply.status(404).send({ success: false, error: "Interview not found" })
      try {
        const result = await submitAnswer(questionId, answer, interview.resume.skills)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/interview/:id/complete
  app.post(
    "/interview/:id/complete",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        const interview = await completeInterview(req.params.id)
        return reply.send({ success: true, data: interview })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )
}
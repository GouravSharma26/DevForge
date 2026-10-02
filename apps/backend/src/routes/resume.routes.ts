import { FastifyInstance, FastifyRequest } from "fastify"
import { authenticate } from "../plugins/authenticate"
import { prisma } from "@devforge/database"
import {
  analyzeResume,
  analyzeExistingResumeText,
  analyzeResumeFromText,
  getUserResumes,
  getResumeById,
  deleteResume,
  forkResume,
} from "../services/resume.service"
import {
  generateInterview,
  submitAnswer,
  completeInterview,
  getInterview,
  getUserInterviews,
  deleteInterview,
  appendGrandmasterChallenge,
  runGrandmasterCode,
} from "../services/interview.service"
import {
  saveResumeBuilder,
  loadResumeBuilder,
  generateResumeWithAI,
} from "../services/resume-builder.service"
import {
  matchJD,
  matchJDPdf,
  getJDMatchesForResume,
} from "../services/jd-match.service"


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
    async (req: FastifyRequest<{ Body: { sections: any[]; resumeId?: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const filled = await generateResumeWithAI(userId, req.body.sections, req.body.resumeId)
        return reply.send({ success: true, data: filled })
      } catch (err: any) {
        const statusCode = err.message === "Specified resume profile not found" ? 404 : 500
        return reply.status(statusCode).send({ success: false, error: err.message })
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
    async (req: FastifyRequest<{ Querystring: { skipAI?: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const data = await req.file()
      if (!data) return reply.status(400).send({ success: false, error: "No file uploaded" })
      if (data.mimetype !== "application/pdf") return reply.status(400).send({ success: false, error: "Only PDF files allowed" })
      const buffer = await data.toBuffer()
      if (buffer.length > 5 * 1024 * 1024) return reply.status(400).send({ success: false, error: "File too large (max 5MB)" })
      
      const skipAI = req.query.skipAI === "true"
      
      try {
        const result = await analyzeResume(userId, buffer, "PDF Upload", skipAI)
        return reply.send({ success: true, data: result.resume })
      } catch (err: any) {
        console.error("🚨 UPLOAD CRASH:", err)
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // ─── NEW: List all resumes for user ───
  // GET /api/resume
  app.get(
    "/",
    { preHandler: [authenticate] },
    async (req, reply) => {
      const { id: userId } = req.user as { id: string }
      const resumes = await getUserResumes(userId)
      return reply.send({ success: true, data: resumes })
    }
  )

  // ─── NEW: Get a specific resume ───
  // GET /api/resume/:id
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const resume = await getResumeById(req.params.id, userId)
      if (!resume) return reply.status(404).send({ success: false, error: "Resume not found" })
      return reply.send({ success: true, data: resume })
    }
  )

  // ─── NEW: Analyze existing resume ───
  // POST /api/resume/:id/analyze
  app.post(
    "/:id/analyze",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const resume = await getResumeById(req.params.id, userId)
        if (!resume) return reply.status(404).send({ success: false, error: "Resume not found" })
        if (!resume.originalText) return reply.status(400).send({ success: false, error: "No original text found to analyze" })

        // Re-analyze using the stored text by faking a buffer, or we need to modify analyzeResume to accept text directly.
        // Actually, analyzeResume takes a pdfBuffer. If we pass a fake buffer, pdfParse will fail, but the AI prompt expects base64 pdf.
        // We need a text-based analysis endpoint. Let's create it in service.
        const updatedResume = await analyzeExistingResumeText(userId, resume.id, resume.originalText)
        return reply.send({ success: true, data: updatedResume })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // ─── NEW: Fork a specific resume ───
  // POST /api/resume/:id/fork
  app.post(
    "/:id/fork",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { profileName: string } }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { profileName } = req.body
      if (!profileName) {
        return reply.status(400).send({ success: false, error: "Profile name is required" })
      }
      try {
        const forkedResume = await forkResume(req.params.id, userId, profileName)
        return reply.send({ success: true, data: forkedResume })
      } catch (err: any) {
        if (err.message.includes("not found or access denied")) {
          return reply.status(404).send({ success: false, error: err.message })
        }
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // ─── NEW: JD Matching ───
  // GET /api/resume/:id/jd-matches
  app.get(
    "/:id/jd-matches",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const matches = await getJDMatchesForResume(userId, req.params.id)
      return reply.send({ success: true, data: matches })
    }
  )

  // POST /api/resume/:id/jd-match
  app.post(
    "/:id/jd-match",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { jdText: string } }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { jdText } = req.body
      if (!jdText) {
        return reply.status(400).send({ success: false, error: "jdText is required" })
      }
      try {
        const match = await matchJD(userId, req.params.id, jdText)
        return reply.send({ success: true, data: match })
      } catch (err: any) {
        if (err.message.includes("not found or unauthorized")) {
          return reply.status(404).send({ success: false, error: err.message })
        }
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/:id/jd-match/upload
  app.post(
    "/:id/jd-match/upload",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const data = await req.file()
      
      if (!data) {
        return reply.status(400).send({ success: false, error: "No file uploaded" })
      }
      
      if (data.mimetype !== "application/pdf") {
        return reply.status(400).send({ success: false, error: "Only PDF files are supported" })
      }

      const buffer = await data.toBuffer()
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ success: false, error: "File size exceeds 5MB limit" })
      }

      try {
        const match = await matchJDPdf(userId, req.params.id, buffer)
        return reply.send({ success: true, data: match })
      } catch (err: any) {
        if (err.message.includes("not found or unauthorized")) {
          return reply.status(404).send({ success: false, error: err.message })
        }
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // ─── CHANGED: Delete a specific resume ───
  // DELETE /api/resume/:id
  app.delete(
    "/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const result = await deleteResume(req.params.id, userId)
      if (!result || result.count === 0) {
        return reply.status(404).send({ success: false, error: "Resume not found or already deleted" })
      }
      return reply.send({ success: true, data: { message: "Resume deleted" } })
    }
  )

  // ─── CHANGED: Patch a specific resume ───
  // PATCH /api/resume/:id
  app.patch(
    "/:id",
    { preHandler: [authenticate] },
    async (
      req: FastifyRequest<{
        Params: { id: string }
        Body: { skills?: string[]; gaps?: string[]; targetRole?: string; suggestions?: any[]; profileName?: string }
      }>,
      reply
    ) => {
      const { id: userId } = req.user as { id: string }
      const { skills, gaps, targetRole, suggestions, profileName } = req.body
      
      // 1. Verify ownership first since id is no longer tied 1:1 to user
      const existing = await getResumeById(req.params.id, userId)
      if (!existing) return reply.status(404).send({ success: false, error: "Resume not found" })

      // 2. Perform update
      const resume = await prisma.resume.update({
        where: { id: req.params.id },
        data: {
          ...(profileName !== undefined && { profileName }),
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
      const { id: userId } = req.user as { id: string }
      const interview = await getInterview(req.params.id, userId)
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
      const { id: userId } = req.user as { id: string }
      const { questionId, answer } = req.body
      try {
        const result = await submitAnswer(req.params.id, userId, questionId, answer)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        console.error("[Submit Answer Error]:", err)
        const status = err.statusCode || 500
        return reply.status(status).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/interview/:id/complete
  app.post(
    "/interview/:id/complete",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const interview = await completeInterview(req.params.id, userId)
        return reply.send({ success: true, data: interview })
      } catch (err: any) {
        const status = err.statusCode || 500
        return reply.status(status).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/interview/:id/grandmaster
  app.post(
    "/interview/:id/grandmaster",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const interview = await getInterview(req.params.id, userId)
        if (!interview) return reply.status(404).send({ success: false, error: "Interview not found" })
        if (interview.status !== "COMPLETED") return reply.status(400).send({ success: false, error: "Interview must be completed before starting the Grandmaster challenge" })
        
        const updated = await appendGrandmasterChallenge(req.params.id, userId)
        return reply.send({ success: true, data: updated })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // POST /api/resume/interview/:id/question/:questionId/run
  app.post(
    "/interview/:id/question/:questionId/run",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string; questionId: string }, Body: { code: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const result = await runGrandmasterCode(req.params.id, userId, req.params.questionId, req.body.code)
        return reply.send({ success: true, data: result })
      } catch (err: any) {
        const status = err.statusCode || 500
        return reply.status(status).send({ success: false, error: err.message })
      }
    }
  )

  // PATCH /api/resume/interview/:id
  app.patch(
    "/interview/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }, Body: { title: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      const { title } = req.body
      try {
        const interview = await prisma.interview.updateMany({
          where: { id: req.params.id, userId },
          data: { title }
        })
        if (interview.count === 0) return reply.status(404).send({ success: false, error: "Interview not found" })
        return reply.send({ success: true, data: { message: "Interview renamed" } })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )

  // DELETE /api/resume/interview/:id
  app.delete(
    "/interview/:id",
    { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: userId } = req.user as { id: string }
      try {
        const result = await deleteInterview(req.params.id, userId)
        if (!result || result.count === 0) {
          return reply.status(404).send({ success: false, error: "Interview not found or unauthorized" })
        }
        return reply.send({ success: true, data: { message: "Interview deleted" } })
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message })
      }
    }
  )
}
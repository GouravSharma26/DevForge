import { FastifyInstance } from "fastify"
import { UserController } from "../controllers/user.controller"
import { authenticate } from "../plugins/authenticate"
import { UpdateProfileSchema, ChangePasswordSchema, DeleteAccountSchema } from "@devforge/shared-types"

export async function userRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [authenticate] }, UserController.getMe)
  app.patch("/me", { schema: { body: UpdateProfileSchema }, preHandler: [authenticate] }, UserController.updateMe)
  app.put("/me/password", { 
    schema: { body: ChangePasswordSchema },
    preHandler: [authenticate],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '10 minute'
      }
    }
  }, UserController.updatePassword)
  app.delete("/me", { schema: { body: DeleteAccountSchema }, preHandler: [authenticate] }, UserController.deleteMe)
}
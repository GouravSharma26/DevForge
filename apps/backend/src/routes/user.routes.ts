import { FastifyInstance } from "fastify"
import { UserController } from "../controllers/user.controller"
import { authenticate } from "../plugins/authenticate"

export async function userRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [authenticate] }, UserController.getMe)
  app.patch("/me", { preHandler: [authenticate] }, UserController.updateMe)
  app.put("/me/password", { preHandler: [authenticate] }, UserController.updatePassword)
  app.delete("/me", { preHandler: [authenticate] }, UserController.deleteMe)
}
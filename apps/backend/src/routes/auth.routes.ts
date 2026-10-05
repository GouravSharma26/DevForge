import { FastifyInstance } from "fastify"
import { AuthController } from "../controllers/auth.controller"

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, AuthController.register)
  app.post("/login", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, AuthController.login)
  app.post("/logout", AuthController.logout)
}
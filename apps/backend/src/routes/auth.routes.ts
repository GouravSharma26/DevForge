import { FastifyInstance } from "fastify"
import { AuthController } from "../controllers/auth.controller"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { RegisterSchema, LoginSchema } from "@devforge/shared-types"

export async function authRoutes(app: FastifyInstance) {
  const zapp = app.withTypeProvider<ZodTypeProvider>()
  
  zapp.post("/register", { 
    schema: { body: RegisterSchema }, 
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } 
  }, AuthController.register as any)
  
  zapp.post("/login", { 
    schema: { body: LoginSchema }, 
    config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } 
  }, AuthController.login as any)
  
  zapp.post("/logout", AuthController.logout as any)
}
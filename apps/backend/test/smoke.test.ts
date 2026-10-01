import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { buildApp } from "../src/app"

describe("Backend Smoke Tests", () => {
  let app: ReturnType<typeof buildApp>["app"]
  let io: ReturnType<typeof buildApp>["io"]

  beforeAll(async () => {
    const built = buildApp()
    app = built.app
    io = built.io
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    // Socket.IO server is attached to fastify instance via decorate
  })

  it("GET /health should return status ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.status).toBe("ok")
    expect(body.timestamp).toBeDefined()
  })

  it("POST /api/auth/register with missing fields should fail validation", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: { origin: "http://localhost:3000" },
      payload: { username: "test" }, // missing email, password
    })

    expect(response.statusCode).toBe(400)
  })

  it("POST /api/auth/login with missing fields should fail validation", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: "http://localhost:3000" },
      payload: { email: "test@example.com" }, // missing password
    })

    expect(response.statusCode).toBe(400)
  })
})

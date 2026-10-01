import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { buildApp } from "../src/app"
import { prisma } from "@devforge/database"
import { io as Client } from "socket.io-client"
import { AddressInfo } from "net"

describe("Auth & WebSockets", () => {
  let app: ReturnType<typeof buildApp>["app"]
  let ioServer: ReturnType<typeof buildApp>["io"]
  let port: number
  let testUser: any

  beforeAll(async () => {
    const built = buildApp()
    app = built.app
    ioServer = built.io
    
    // Create test user
    const username = `testuser-${Date.now()}`
    const email = `${username}@example.com`
    const password = "Password123!"

    await app.ready()
    
    // Start listening to bind port for websocket tests
    await app.listen({ port: 0 })
    port = (app.server.address() as AddressInfo).port

    // Register user directly
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: { origin: "http://localhost:3000" },
      payload: { username, email, password }
    })
    
    if (res.statusCode !== 201) {
      console.error("Register failed:", res.payload)
    }
    
    const body = JSON.parse(res.payload)
    testUser = { ...body.data.user, password }
  })

  afterAll(async () => {
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } })
    }
    await app.close()
  })

  it("should authenticate via cookie and access /api/user/me", async () => {
    // 1. Login
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: "http://localhost:3000" },
      payload: { email: testUser.email, password: testUser.password }
    })
    
    expect(loginRes.statusCode).toBe(200)
    
    // Extract cookie
    const cookies = loginRes.cookies
    const accessToken = cookies.find(c => c.name === "access_token")
    expect(accessToken).toBeDefined()

    // 2. Access /api/user/me using ONLY the cookie
    const meRes = await app.inject({
      method: "GET",
      url: "/api/user/me",
      headers: {
        cookie: `access_token=${accessToken!.value}`
      }
    })

    expect(meRes.statusCode).toBe(200)
    const meBody = JSON.parse(meRes.payload)
    expect(meBody.data.id).toBe(testUser.id)
  })

  it("should authenticate websocket connection via cookie", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: "http://localhost:3000" },
      payload: { email: testUser.email, password: testUser.password }
    })
    const accessToken = loginRes.cookies.find(c => c.name === "access_token")!.value

    return new Promise<void>((resolve, reject) => {
      const socket = Client(`http://localhost:${port}`, {
        extraHeaders: {
          cookie: `access_token=${accessToken}`
        }
      })

      socket.on("connect", () => {
        socket.disconnect()
        resolve()
      })

      socket.on("connect_error", (err) => {
        reject(err)
      })
    })
  })

  it("should reject REST request with no cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/user/me"
    })
    expect(res.statusCode).toBe(401)
  })

  it("should reject REST request with tampered cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/user/me",
      headers: {
        cookie: "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token"
      }
    })
    expect(res.statusCode).toBe(401)
  })

  it("should reject WebSocket connection with no cookie", async () => {
    return new Promise<void>((resolve) => {
      const socket = Client(`http://localhost:${port}`)
      
      socket.on("connect", () => {
        socket.disconnect()
        throw new Error("Should not have connected without a cookie")
      })

      socket.on("connect_error", (err) => {
        expect(err.message).toBe("Unauthorized")
        resolve()
      })
    })
  })
})

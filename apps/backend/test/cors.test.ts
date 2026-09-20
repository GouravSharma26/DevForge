import { describe, it, expect } from "vitest"
import { checkCorsOrigin } from "../src/utils/cors"

describe("CORS Configuration", () => {
  it("allows requests with no origin (e.g., mobile apps, curl)", () => {
    checkCorsOrigin(undefined, (err, allow) => {
      expect(err).toBeNull()
      expect(allow).toBe(true)
    })
  })

  it("allows requests from localhost:3000", () => {
    checkCorsOrigin("http://localhost:3000", (err, allow) => {
      expect(err).toBeNull()
      expect(allow).toBe(true)
    })
  })

  it("allows specific devforge vercel preview deployments", () => {
    checkCorsOrigin("https://pr-123-devforge.vercel.app", (err, allow) => {
      expect(err).toBeNull()
      expect(allow).toBe(true)
    })
  })

  it("blocks arbitrary malicious vercel deployments", () => {
    checkCorsOrigin("https://malicious-app.vercel.app", (err, allow) => {
      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toBe("Not allowed by CORS")
      expect(allow).toBe(false)
    })
  })

  it("allows the configured production FRONTEND_URL", () => {
    process.env.FRONTEND_URL = "https://devforge.io"
    checkCorsOrigin("https://devforge.io", (err, allow) => {
      expect(err).toBeNull()
      expect(allow).toBe(true)
    })
  })
})

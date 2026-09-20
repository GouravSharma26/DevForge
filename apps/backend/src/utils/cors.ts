export function checkCorsOrigin(origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) {
  if (
    !origin ||
    origin === process.env.FRONTEND_URL ||
    origin === "http://localhost:3000" ||
    // Strict match for devforge preview deployments
    (origin.endsWith(".vercel.app") && origin.includes("-devforge"))
  ) {
    cb(null, true)
  } else {
    cb(new Error("Not allowed by CORS"), false)
  }
}

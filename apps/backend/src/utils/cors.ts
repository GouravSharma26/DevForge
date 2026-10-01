export function checkCorsOrigin(origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) {
  const allowed = new Set([
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? [])
  ].filter(Boolean));

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
  }

  // Example secure regex for vercel previews if needed:
  // const preview = /^https:\/\/devforge-[a-z0-9-]+-myteamslug\.vercel\.app$/
  // Since we don't know the exact team slug, we disable preview blanket allowance.
  
  if (!origin || allowed.has(origin)) {
    cb(null, true);
  } else {
    // Avoid returning an error object to prevent 500 responses; false correctly triggers CORS rejection.
    cb(null, false);
  }
}

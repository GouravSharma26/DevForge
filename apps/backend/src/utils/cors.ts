export function isAllowedOrigin(origin: string | undefined): boolean {
  const allowed = new Set([
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? [])
  ].filter(Boolean));

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
  }

  // Allow vercel preview URLs securely
  const isPreview = origin && /^https:\/\/devforge-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin);
  
  return !origin || allowed.has(origin) || !!isPreview;
}

export function checkCorsOrigin(origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) {
  if (isAllowedOrigin(origin)) {
    cb(null, true);
  } else {
    // Avoid returning an error object to prevent 500 responses; false correctly triggers CORS rejection.
    cb(null, false);
  }
}

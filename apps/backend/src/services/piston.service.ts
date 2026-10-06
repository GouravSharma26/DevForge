export interface PistonResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

export async function executeCode(language: string, code: string, version: string = "*"): Promise<PistonResponse> {
  const pistonUrl = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

  // First, we need to fetch runtimes if version is '*' or we can just send '*' and let Piston pick the latest.
  // Piston v2 accepts version: "*" to use the latest version available.
  
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(`${pistonUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          language,
          version,
          files: [{ content: code }]
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Retryable: ${response.status}`);
        }
        if (response.status === 401) {
          throw new Error("Piston API unavailable - self-hosted instance required.");
        }
        throw new Error(`Piston API error: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 500_000) { // Cap at ~500KB
        throw new Error("Piston API response too large");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.startsWith("Retryable")) {
        attempt++;
        if (attempt >= maxAttempts) throw new Error("Piston execution failed after max retries.");
        const jitter = Math.floor(Math.random() * 500);
        await new Promise(res => setTimeout(res, 500 * attempt + jitter));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Piston execution failed");
}

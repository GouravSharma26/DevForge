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
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(`${pistonUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        language,
        version,
        files: [
          {
            content: code,
          },
        ],
      }),
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Piston API timed out after 15 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Piston API unavailable - self-hosted instance required or API whitelist needed.");
    }
    throw new Error(`Piston API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

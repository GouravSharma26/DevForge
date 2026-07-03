import { execFile } from "child_process"
import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

interface SandboxResult {
  stdout: string
  stderr: string
  timedOut: boolean
}

export async function runInSandbox(
  code: string,
  language: string,
  timeoutMs = 5000
): Promise<SandboxResult> {
  const id = randomUUID()

  if (language === "javascript") {
    return runJS(code, id, timeoutMs)
  }

  if (language === "python") {
    return runPython(code, id, timeoutMs)
  }

  throw new Error(`Unsupported language: ${language}`)
}

function runJS(code: string, id: string, timeoutMs: number): Promise<SandboxResult> {
  const filePath = join(tmpdir(), `devforge_${id}.js`)

  return new Promise((resolve) => {
    writeFileSync(filePath, code, "utf8")

    let timedOut = false

    const child = execFile(
      "node",
      [
        "--max-old-space-size=64",   // limit memory to 64MB
        filePath,
      ],
      { timeout: timeoutMs },
      (error, stdout, stderr) => {
        try { unlinkSync(filePath) } catch {}

        if (error?.killed || error?.signal === "SIGTERM") {
          timedOut = true
        }

        resolve({
          stdout: stdout?.trim() || "",
          stderr: stderr?.trim() || error?.message || "",
          timedOut,
        })
      }
    )
  })
}

function runPython(code: string, id: string, timeoutMs: number): Promise<SandboxResult> {
  const filePath = join(tmpdir(), `devforge_${id}.py`)

  return new Promise((resolve) => {
    writeFileSync(filePath, code, "utf8")

    let timedOut = false

    execFile(
      "python",
      [filePath],
      { timeout: timeoutMs },
      (error, stdout, stderr) => {
        try { unlinkSync(filePath) } catch {}

        if (error?.killed || error?.signal === "SIGTERM") {
          timedOut = true
        }

        resolve({
          stdout: stdout?.trim() || "",
          stderr: stderr?.trim() || error?.message || "",
          timedOut,
        })
      }
    )
  })
}
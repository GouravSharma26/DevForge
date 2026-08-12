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

  const lang = language.toLowerCase()

  if (lang === "javascript" || lang === "js" || lang === "node" || lang === "typescript" || lang === "ts") {
    return runJS(code, id, timeoutMs)
  }

  if (lang === "python" || lang === "py" || lang === "python3") {
    return runPython(code, id, timeoutMs)
  }

  throw new Error(`Unsupported language: ${language}`)
}

function getSandboxCommand(executable: string, args: string[]): { cmd: string, args: string[] } {
  // DEV-ONLY: Windows bypass. Render/Linux production always uses the real unshare/ulimit wrapper below.
  // This just allows local development on Windows where sh/unshare are not available.
  if (process.platform === "win32") {
    return { cmd: executable, args }
  }

  const script = `
UNSHARE=""
if unshare -r -n true 2>/dev/null; then
  UNSHARE="unshare -r -n"
elif unshare -n true 2>/dev/null; then
  UNSHARE="unshare -n"
else
  echo "[Sandbox Warning] unshare failed, network isolation degraded" >&2
fi

# ulimit -u is shared with the host process on non-root deployments and is a known, accepted limitation, not full isolation.
$UNSHARE sh -c 'ulimit -v 524288 -u 64 -n 128 -t 10 -f 1024; exec "$0" "$@"' "$0" "$@"
`.trim()

  return {
    cmd: "sh",
    args: ["-c", script, executable, ...args]
  }
}

function runJS(code: string, id: string, timeoutMs: number): Promise<SandboxResult> {
  const filePath = join(tmpdir(), `devforge_${id}.js`)

  return new Promise((resolve) => {
    writeFileSync(filePath, code, "utf8")

    let timedOut = false
    const command = getSandboxCommand("node", ["--max-old-space-size=64", filePath])

    const child = execFile(
      command.cmd,
      command.args,
      { 
        timeout: timeoutMs,
        killSignal: "SIGTERM",
        env: { PATH: process.env.PATH, HTTP_PROXY: "http://127.0.0.1:9999", HTTPS_PROXY: "http://127.0.0.1:9999" }
      },
      (error, stdout, stderr) => {
        if (fallbackTimer) clearTimeout(fallbackTimer)
        try { unlinkSync(filePath) } catch {}

        if (error?.killed || error?.signal === "SIGTERM" || error?.signal === "SIGKILL") {
          timedOut = true
        }

        resolve({
          stdout: stdout?.trim() || "",
          stderr: stderr?.trim() || error?.message || "",
          timedOut,
        })
      }
    )

    const fallbackTimer = setTimeout(() => {
      try {
        if (child.pid) process.kill(child.pid, "SIGKILL")
      } catch (e) {}
    }, timeoutMs + 1000)
  })
}

function runPython(code: string, id: string, timeoutMs: number): Promise<SandboxResult> {
  const filePath = join(tmpdir(), `devforge_${id}.py`)

  return new Promise((resolve) => {
    writeFileSync(filePath, code, "utf8")

    let timedOut = false
    const pythonCmd = process.env.PYTHON_CMD || (process.platform === "win32" ? "python" : "python3")
    const command = getSandboxCommand(pythonCmd, [filePath])

    const child = execFile(
      command.cmd,
      command.args,
      { 
        timeout: timeoutMs,
        killSignal: "SIGTERM",
        env: { PATH: process.env.PATH, HTTP_PROXY: "http://127.0.0.1:9999", HTTPS_PROXY: "http://127.0.0.1:9999" } 
      },
      (error, stdout, stderr) => {
        if (fallbackTimer) clearTimeout(fallbackTimer)
        try { unlinkSync(filePath) } catch {}

        if (error?.killed || error?.signal === "SIGTERM" || error?.signal === "SIGKILL") {
          timedOut = true
        }

        resolve({
          stdout: stdout?.trim() || "",
          stderr: stderr?.trim() || error?.message || "",
          timedOut,
        })
      }
    )

    const fallbackTimer = setTimeout(() => {
      try {
        if (child.pid) process.kill(child.pid, "SIGKILL")
      } catch (e) {}
    }, timeoutMs + 1000)
  })
}
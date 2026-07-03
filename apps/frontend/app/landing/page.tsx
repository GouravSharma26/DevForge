"use client"

import { useAuthStore } from "@/store/auth.store"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

// ─── Tiny reusable styles ────────────────────────────────────────────────────
const mono = "JetBrains Mono, monospace"

const FEATURES = [
  {
    icon: "📡",
    title: "Tech News Feed",
    desc: "Curated AI & tech articles refreshed every 6 hours from top sources. Filter by category, never miss what matters.",
    tag: "Phase 1",
    color: "#6366f1",
  },
  {
    icon: "🎯",
    title: "Learning Paths",
    desc: "Structured skill tracks from Frontend to System Design. Track progress, earn XP, and go from beginner to job-ready.",
    tag: "Phase 1",
    color: "#7c3aed",
  },
  {
    icon: "🧩",
    title: "DSA Practice",
    desc: "LeetCode-style problems with a VS Code-quality Monaco Editor. Real code execution — no external sandbox needed.",
    tag: "Phase 2",
    color: "#8b5cf6",
  },
  {
    icon: "⚔️",
    title: "PvP Arena",
    desc: "Real-time 1v1 coding battles via WebSockets. Same problem, race to pass all tests first. Winner earns 100 XP.",
    tag: "Phase 3",
    color: "#a855f7",
  },
  {
    icon: "📄",
    title: "Resume Scanner",
    desc: "Upload your PDF resume. Gemini AI vision analyzes skills, ATS compatibility, writing quality and scores it 0–100.",
    tag: "Phase 4",
    color: "#c084fc",
  },
  {
    icon: "🎙️",
    title: "Mock Interview",
    desc: "AI generates 9 interview questions based on YOUR resume. Answer, get scored, get feedback. Rounds 1–3 escalate.",
    tag: "Phase 4",
    color: "#d8b4fe",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up in seconds. No credit card, no setup. Your profile tracks XP, streak, and progress across all features.",
  },
  {
    num: "02",
    title: "Choose a learning path",
    desc: "Pick a structured track — Frontend, Backend, DSA, or System Design. Each has 8 progressive topics with estimated time.",
  },
  {
    num: "03",
    title: "Practice with real code",
    desc: "Solve DSA problems in the Monaco Editor. Your code runs in a secure local sandbox. See pass/fail for each test case.",
  },
  {
    num: "04",
    title: "Battle in the Arena",
    desc: "Enter matchmaking, get paired with another developer, race to solve the same problem first. Climb the XP ladder.",
  },
  {
    num: "05",
    title: "Scan your resume",
    desc: "Upload your PDF. AI scores it across 4 dimensions and flags skill gaps for your target role.",
  },
  {
    num: "06",
    title: "Ace the interview",
    desc: "AI builds a 9-question interview from your actual resume. Each answer gets scored and critiqued instantly.",
  },
]

const STATS = [
  { value: "7",    label: "Core features",      suffix: "" },
  { value: "10",   label: "DSA problems",       suffix: "+" },
  { value: "4",    label: "Learning paths",     suffix: "" },
  { value: "100",  label: "XP per Arena win",   suffix: "" },
]

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix }: { target: string; suffix: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const num = parseInt(target)
    if (isNaN(num)) { setVal(0); return }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(num / 40)
        const timer = setInterval(() => {
          start += step
          if (start >= num) { setVal(num); clearInterval(timer) }
          else setVal(start)
        }, 30)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {val}{suffix}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  function handleCTA() {
    if (hydrated && token) {
      router.push("/")       // already logged in → go to news feed
    } else {
      router.push("/login")  // not logged in → go to login
    }
  }

  return (
    <div style={{ background: "#0d0d1a", minHeight: "100vh", fontFamily: mono, overflowX: "hidden" }}>

      {/* ── Background ambient glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "30%",
          width: 600, height: 600,
          background: "radial-gradient(circle, #7c3aed18, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "-5%",
          width: 400, height: 400,
          background: "radial-gradient(circle, #6366f115, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, #a855f710, transparent 70%)",
          borderRadius: "50%",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════ */}
        <section style={{
          minHeight: "92vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 24px 60px", textAlign: "center",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 99,
            border: "1px solid #7c3aed40", background: "#7c3aed10",
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#a855f7" }}>Open Source · Full Stack Portfolio Project</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900, lineHeight: 1.1,
            color: "#f1f0ff", marginBottom: 24, maxWidth: 820,
          }}>
            The platform that turns{" "}
            <span style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              developers
            </span>
            {" "}into{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              engineers
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(14px, 2vw, 18px)",
            color: "#5a5780", maxWidth: 560, lineHeight: 1.8,
            marginBottom: 48,
          }}>
            Practice DSA. Battle in real-time 1v1 coding matches. Get your resume
            AI-scored. Walk into interviews ready.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleCTA}
              style={{
                padding: "14px 36px", borderRadius: 14, fontSize: 14,
                fontWeight: 700, cursor: "pointer", border: "none",
                background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                color: "#fff", fontFamily: mono,
                boxShadow: "0 4px 24px #7c3aed40, 0 0 0 1px #7c3aed30",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px #7c3aed60, 0 0 0 1px #7c3aed50")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px #7c3aed40, 0 0 0 1px #7c3aed30")}
            >
              Get Started — Free
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "14px 36px", borderRadius: 14, fontSize: 14,
                fontWeight: 600, cursor: "pointer",
                background: "#16163a", border: "1px solid #2a2a5a",
                color: "#a09dc0", fontFamily: mono, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed50"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#f1f0ff"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a5a"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#a09dc0"
              }}
            >
              See Features ↓
            </button>
          </div>

          {/* Hero visual — fake terminal */}
          <div style={{
            marginTop: 72, width: "100%", maxWidth: 780,
            background: "#12122b", border: "1px solid #1f1f45",
            borderRadius: 20, overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px #7c3aed20",
          }}>
            {/* Terminal bar */}
            <div style={{
              background: "#0d0d1a", padding: "12px 20px",
              borderBottom: "1px solid #1f1f45",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3b30" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffcc00" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28cd41" }} />
              </div>
              <span style={{ fontSize: 11, color: "#3a3760", marginLeft: 8 }}>devforge — mock-interview.ts</span>
            </div>
            {/* Code preview */}
            <div style={{ padding: "24px 28px", textAlign: "left" }}>
              {[
                { line: "// AI-generated based on your resume", color: "#3a3760" },
                { line: 'const question = "I see you listed React — explain useEffect vs useLayoutEffect";', color: "#a09dc0" },
                { line: "", color: "" },
                { line: "// Your answer evaluation:", color: "#3a3760" },
                { line: 'score: 87/100', color: "#a855f7" },
                { line: 'feedback: "Strong explanation of timing differences. Add a real use case next time."', color: "#10b981" },
                { line: "", color: "" },
                { line: "// Skill gap detected:", color: "#3a3760" },
                { line: 'missing: ["Docker", "Kubernetes", "CI/CD"]', color: "#f59e0b" },
                { line: 'resumeScore: 93 / 100  // ATS: 98%  Writing: 90%', color: "#6366f1" },
              ].map((row, i) => (
                <div key={i} style={{
                  fontSize: 12, lineHeight: "22px",
                  color: row.color || "transparent",
                  fontFamily: mono,
                }}>
                  <span style={{ color: "#2a2a5a", marginRight: 16, userSelect: "none" }}>{row.line ? String(i + 1).padStart(2, "0") : "  "}</span>
                  {row.line}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            STATS
        ════════════════════════════════════════════ */}
        <section style={{ padding: "60px 24px", borderTop: "1px solid #1f1f45", borderBottom: "1px solid #1f1f45" }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2,
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                textAlign: "center", padding: "28px 16px",
                borderRight: i < STATS.length - 1 ? "1px solid #1f1f45" : "none",
              }}>
                <div style={{
                  fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900,
                  background: "linear-gradient(135deg, #7c3aed, #c084fc)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  fontFamily: mono, lineHeight: 1,
                }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: "#5a5780", marginTop: 8, fontFamily: mono }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FEATURES
        ════════════════════════════════════════════ */}
        <section id="features" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Section header */}
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{
                display: "inline-block", fontSize: 11, color: "#a855f7",
                border: "1px solid #7c3aed40", background: "#7c3aed10",
                padding: "4px 14px", borderRadius: 99, marginBottom: 16,
              }}>
                Everything you need
              </div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#f1f0ff", fontFamily: mono }}>
                7 features. 1 platform.
              </h2>
              <p style={{ fontSize: 14, color: "#5a5780", marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>
                Built with Next.js, Fastify, PostgreSQL, Redis, Socket.io, and Gemini AI.
              </p>
            </div>

            {/* Feature grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  style={{
                    background: hoveredFeature === i ? "#1c1c45" : "#16163a",
                    border: `1px solid ${hoveredFeature === i ? f.color + "40" : "#1f1f45"}`,
                    borderRadius: 20, padding: 28,
                    transition: "all 0.25s",
                    cursor: "default",
                    boxShadow: hoveredFeature === i ? `0 8px 32px ${f.color}15` : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span style={{ fontSize: 32 }}>{f.icon}</span>
                    <span style={{
                      fontSize: 10, padding: "3px 10px", borderRadius: 99, fontFamily: mono,
                      background: f.color + "15", color: f.color, border: `1px solid ${f.color}30`,
                    }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f0ff", marginBottom: 10, fontFamily: mono }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#5a5780", lineHeight: 1.8, fontFamily: mono }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════ */}
        <section style={{ padding: "100px 24px", borderTop: "1px solid #1f1f45" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{
                display: "inline-block", fontSize: 11, color: "#a855f7",
                border: "1px solid #7c3aed40", background: "#7c3aed10",
                padding: "4px 14px", borderRadius: 99, marginBottom: 16,
              }}>
                The journey
              </div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "#f1f0ff", fontFamily: mono }}>
                How DevForge works
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 24, padding: "28px 0",
                    borderBottom: i < STEPS.length - 1 ? "1px solid #1f1f45" : "none",
                  }}
                >
                  {/* Number */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "linear-gradient(135deg, #7c3aed20, #6366f120)",
                    border: "1px solid #7c3aed30",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#a855f7", fontFamily: mono,
                  }}>
                    {step.num}
                  </div>
                  {/* Content */}
                  <div style={{ paddingTop: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f0ff", marginBottom: 8, fontFamily: mono }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "#5a5780", lineHeight: 1.8, fontFamily: mono }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            TECH STACK
        ════════════════════════════════════════════ */}
        <section style={{ padding: "80px 24px", borderTop: "1px solid #1f1f45" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#3a3760", fontFamily: mono, marginBottom: 32, textTransform: "uppercase", letterSpacing: 2 }}>
              Built with
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {[
                "Next.js 14", "TypeScript", "Fastify", "PostgreSQL",
                "Redis", "Prisma", "Socket.io", "BullMQ",
                "Monaco Editor", "Gemini AI", "Tailwind CSS", "Turborepo",
              ].map((tech) => (
                <span
                  key={tech}
                  style={{
                    padding: "8px 16px", borderRadius: 10, fontSize: 12,
                    background: "#16163a", border: "1px solid #1f1f45",
                    color: "#5a5780", fontFamily: mono, transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.border = "1px solid #7c3aed40"
                    ;(e.currentTarget as HTMLSpanElement).style.color = "#a855f7"
                    ;(e.currentTarget as HTMLSpanElement).style.background = "#7c3aed10"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.border = "1px solid #1f1f45"
                    ;(e.currentTarget as HTMLSpanElement).style.color = "#5a5780"
                    ;(e.currentTarget as HTMLSpanElement).style.background = "#16163a"
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CTA
        ════════════════════════════════════════════ */}
        <section style={{ padding: "100px 24px", borderTop: "1px solid #1f1f45" }}>
          <div style={{
            maxWidth: 700, margin: "0 auto", textAlign: "center",
            background: "linear-gradient(135deg, #16163a, #1c1c45)",
            border: "1px solid #7c3aed30",
            borderRadius: 28, padding: "64px 40px",
            boxShadow: "0 0 80px #7c3aed15, 0 24px 64px rgba(0,0,0,0.4)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow behind card */}
            <div style={{
              position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
              width: 400, height: 400,
              background: "radial-gradient(circle, #7c3aed20, transparent 70%)",
              borderRadius: "50%", pointerEvents: "none",
            }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>⚔️</div>
              <h2 style={{
                fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900,
                color: "#f1f0ff", marginBottom: 16, fontFamily: mono,
              }}>
                Ready to level up?
              </h2>
              <p style={{ fontSize: 14, color: "#5a5780", lineHeight: 1.8, marginBottom: 40, fontFamily: mono }}>
                Join DevForge. Practice daily. Battle weekly.
                <br />Get your resume interview-ready. Land the job.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleCTA}
                  style={{
                    padding: "14px 40px", borderRadius: 14, fontSize: 14,
                    fontWeight: 700, cursor: "pointer", border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                    color: "#fff", fontFamily: mono,
                    boxShadow: "0 4px 24px #7c3aed50",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px #7c3aed70")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px #7c3aed50")}
                >
                  Start for Free →
                </button>
                <button
                  onClick={() => window.open("https://github.com/yourusername/devforge", "_blank")}
                  style={{
                    padding: "14px 40px", borderRadius: 14, fontSize: 14,
                    fontWeight: 600, cursor: "pointer",
                    background: "transparent", border: "1px solid #2a2a5a",
                    color: "#a09dc0", fontFamily: mono, transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed50"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#f1f0ff"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a5a"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#a09dc0"
                  }}
                >
                  ★ Star on GitHub
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════ */}
        <footer style={{
          borderTop: "1px solid #1f1f45", padding: "40px 24px",
          background: "#0a0a14",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 24,
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#fff", fontSize: 12 }}>⚔</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", fontFamily: mono }}>
                Dev<span style={{ color: "#a855f7" }}>Forge</span>
              </span>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "News",     href: "/" },
                { label: "Practice", href: "/problems" },
                { label: "Arena",    href: "/arena" },
                { label: "Resume",   href: "/resume" },
              ].map((link) => (
                <a key={link.label} href={link.href} style={{
                  fontSize: 12, color: "#5a5780", textDecoration: "none",
                  fontFamily: mono, transition: "color 0.2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5780")}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Credit */}
            <p style={{ fontSize: 11, color: "#3a3760", fontFamily: mono }}>
              Built by{" "}
              <span style={{ color: "#7c3aed" }}>Gourav Sharma</span>
              {" "}· {new Date().getFullYear()}
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}
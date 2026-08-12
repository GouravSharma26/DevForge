"use client"

import { useAuthStore } from "@/store/auth.store"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Anvil } from "lucide-react"

// ─── Tiny reusable styles ────────────────────────────────────────────────────
const mono = "JetBrains Mono, monospace"

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
    ),
    title: "Tech News Feed",
    desc: "Curated AI & tech articles refreshed every 6 hours from top sources. Filter by category, never miss what matters.",
    tag: "Phase 1",
    color: "#d97706",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    title: "Learning Paths",
    desc: "Structured skill tracks from Frontend to System Design. Track progress, earn XP, and go from beginner to job-ready.",
    tag: "Phase 1",
    color: "#10b981",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "DSA Practice",
    desc: "LeetCode-style problems with a VS Code-quality Monaco Editor. Real code execution — no external sandbox needed.",
    tag: "Phase 2",
    color: "#f59e0b",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "PvP Arena",
    desc: "Real-time 1v1 coding battles via WebSockets. Same problem, race to pass all tests first. Winner earns 100 XP.",
    tag: "Phase 3",
    color: "#ef4444",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
    title: "Resume Scanner",
    desc: "Upload your PDF resume. Gemini AI vision analyzes skills, ATS compatibility, writing quality and scores it 0–100.",
    tag: "Phase 4",
    color: "#f97316",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
    title: "Mock Interview",
    desc: "AI generates 9 interview questions based on YOUR resume. Answer, get scored, get feedback. Rounds 1–3 escalate.",
    tag: "Phase 4",
    color: "#ea580c",
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

// ─── WebGL Background Shader ─────────────────────────────────────────────────
function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function syncSize() {
      const w = canvas?.clientWidth || window.innerWidth
      const h = canvas?.clientHeight || window.innerHeight
      if (canvas && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w
        canvas.height = h
      }
    }
    window.addEventListener('resize', syncSize)
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 center = uv - 0.5;
    center.x *= u_resolution.x / u_resolution.y;
    
    // Create a digital grid/data flow effect
    float grid = sin(uv.x * 50.0 + u_time) * sin(uv.y * 50.0 - u_time);
    grid = smoothstep(0.95, 1.0, grid);
    
    // Glitchy "code" lines
    float line = step(0.98, fract(uv.y * 20.0 + u_time * 0.2));
    float lineX = step(0.99, fract(uv.x * 10.0 - u_time * 0.1));
    
    // Glowing particles
    float glow = 0.0;
    for(int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 pos = vec2(hash(vec2(fi, 1.0)), hash(vec2(fi, 2.0)));
        pos = 0.5 + 0.4 * sin(u_time * 0.5 + pos * 6.28);
        float dist = length(uv - pos);
        glow += 0.002 / (dist * dist + 0.001);
    }
    
    // Adapted to Ember Glass Palette
    vec3 color1 = vec3(0.09, 0.07, 0.06); // Dark ember bg (#171210)
    vec3 color2 = vec3(0.92, 0.35, 0.05); // Ember orange (#ea580c)
    vec3 color3 = vec3(0.96, 0.62, 0.04); // Amber (#f59e0b)
    
    vec3 base = mix(color1, color2 * 0.15, grid);
    base += color2 * line * 0.2;
    base += color3 * lineX * 0.15;
    base += color2 * glow * 0.8;
    
    // Vignette
    float vignette = 1.0 - length(center) * 1.2;
    base *= vignette;

    gl_FragColor = vec4(base, 1.0);
}`
    function cs(type: number, src: string) {
      const s = (gl as WebGLRenderingContext).createShader(type)!
      ;(gl as WebGLRenderingContext).shaderSource(s, src)
      ;(gl as WebGLRenderingContext).compileShader(s)
      return s
    }
    
    const glCtx = gl as WebGLRenderingContext
    const prog = glCtx.createProgram()!
    glCtx.attachShader(prog, cs(glCtx.VERTEX_SHADER, vs))
    glCtx.attachShader(prog, cs(glCtx.FRAGMENT_SHADER, fs))
    glCtx.linkProgram(prog)
    glCtx.useProgram(prog)
    
    const buf = glCtx.createBuffer()
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf)
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), glCtx.STATIC_DRAW)
    
    const pos = glCtx.getAttribLocation(prog, 'a_position')
    glCtx.enableVertexAttribArray(pos)
    glCtx.vertexAttribPointer(pos, 2, glCtx.FLOAT, false, 0, 0)
    
    const uTime = glCtx.getUniformLocation(prog, 'u_time')
    const uRes = glCtx.getUniformLocation(prog, 'u_resolution')

    let animFrameId: number
    function render(t: number) {
      if (canvas && (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight)) {
        syncSize()
      }
      if (canvas) {
        glCtx.viewport(0, 0, canvas.width, canvas.height)
        if (uTime) glCtx.uniform1f(uTime, t * 0.001)
        if (uRes) glCtx.uniform2f(uRes, canvas.width, canvas.height)
        glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4)
      }
      animFrameId = requestAnimationFrame(render)
    }
    animFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', syncSize)
      cancelAnimationFrame(animFrameId)
    }
  }, [])

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  useEffect(() => {
    if (hydrated && token) {
      router.push("/dashboard")
    }
  }, [hydrated, token, router])

  function handleCTA() {
    if (hydrated && token) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }
  
  if (!hydrated) {
    return <div className="bg-base" />
  }

  return (
    <div className="bg-base">

      {/* ── Background ambient glows & WebGL Shader ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <HeroShader />
        <div style={{
          position: "absolute", top: "-10%", left: "30%",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(234,88,12,0.12), transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "-5%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(217,119,6,0.08), transparent 70%)",
          borderRadius: "50%",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════ */}
        <section id="hero" style={{
          minHeight: "92vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 24px 60px", textAlign: "center",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 99,
            border: "1px solid rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.1)",
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#ea580c" }}>Open Source · Full Stack Portfolio Project</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900, lineHeight: 1.1,
            color: "rgb(var(--text-primary))", marginBottom: 24, maxWidth: 820,
          }}>
            Master the Code.<br />
            <span style={{
              background: "linear-gradient(135deg, #ea580c, #f97316, #f59e0b)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Conquer the Interview.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(14px, 2vw, 18px)",
            color: "rgb(var(--text-muted))", maxWidth: 560, lineHeight: 1.8,
            marginBottom: 48,
          }}>
            The elite training ground for software engineers. Level up your DSA, crush technical rounds, and compete in the arena.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleCTA}
              style={{
                padding: "14px 36px", borderRadius: 14, fontSize: 14,
                fontWeight: 700, cursor: "pointer", border: "none",
                background: "linear-gradient(135deg, #ea580c, #d97706)",
                color: "rgb(var(--text-primary))", fontFamily: mono,
                boxShadow: "0 4px 24px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(234,88,12,0.6), 0 0 0 1px rgba(234,88,12,0.5)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.3)")}
            >
              Get Started — Free
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "14px 36px", borderRadius: 14, fontSize: 14,
                fontWeight: 600, cursor: "pointer",
                background: "var(--glass-bg)", border: "1px solid var(--border-subtle)",
                color: "rgb(var(--text-muted))", fontFamily: mono, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(234,88,12,0.5)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-primary))"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-muted))"
              }}
            >
              See Features ↓
            </button>
          </div>

          {/* New Hero Visual: Staggered Glass Cards */}
          <div style={{
            marginTop: 80, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap",
            width: "100%", maxWidth: 1000, position: "relative", zIndex: 10
          }}>
            {[
              { 
                title: "PvP Arena", desc: "Live algorithm battles", color: "#ea580c", offset: 20,
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                )
              },
              { 
                title: "AI Resumes", desc: "ATS scoring & feedback", color: "#f59e0b", offset: -10,
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                    <path d="M22 4l-2 2l2 2l-2-2l-2-2l2 2z" /> 
                  </svg>
                )
              },
              { 
                title: "Grandmaster", desc: "Real-time sandbox", color: "#ef4444", offset: 20,
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                )
              },
            ].map((card, i) => (
              <div key={i} style={{
                background: "rgba(255,237,213,0.03)", border: "1px solid var(--border-subtle)",
                padding: "24px 32px", borderRadius: 24, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 12, minWidth: 220,
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                boxShadow: `0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                transform: `translateY(${card.offset}px)`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "default"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `translateY(${card.offset - 8}px)`
                e.currentTarget.style.borderColor = `rgba(234,88,12,0.4)`
                e.currentTarget.style.background = `rgba(255,237,213,0.06)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `translateY(${card.offset}px)`
                e.currentTarget.style.borderColor = `var(--border-subtle)`
                e.currentTarget.style.background = `rgba(255,237,213,0.03)`
              }}
              >
                <div style={{ color: card.color, filter: `drop-shadow(0 0 12px ${card.color}60)`, marginBottom: 4 }}>
                  {card.icon}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "rgb(var(--text-primary))", fontWeight: 700, fontFamily: mono, fontSize: 16 }}>{card.title}</div>
                  <div style={{ color: "rgb(var(--text-muted))", fontFamily: mono, fontSize: 13, marginTop: 6 }}>{card.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ════════════════════════════════════════════
            STATS
        ════════════════════════════════════════════ */}
        <section style={{ padding: "60px 24px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2,
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                textAlign: "center", padding: "28px 16px",
                borderRight: i < STATS.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <div style={{
                  fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900,
                  background: "linear-gradient(135deg, #ea580c, #f59e0b)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  fontFamily: mono, lineHeight: 1,
                }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginTop: 8, fontFamily: mono }}>
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
                display: "inline-block", fontSize: 11, color: "#ea580c",
                border: "1px solid rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.1)",
                padding: "4px 14px", borderRadius: 99, marginBottom: 16,
              }}>
                Everything you need
              </div>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "rgb(var(--text-primary))", fontFamily: mono }}>
                7 features. 1 platform.
              </h2>
              <p style={{ fontSize: 14, color: "rgb(var(--text-muted))", marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>
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
                    background: hoveredFeature === i ? "rgba(255,237,213,0.08)" : "var(--glass-bg)",
                    border: `1px solid ${hoveredFeature === i ? f.color + "40" : "var(--border-subtle)"}`,
                    borderRadius: 20, padding: 28,
                    transition: "all 0.25s",
                    cursor: "default",
                    boxShadow: hoveredFeature === i ? `0 8px 32px ${f.color}15` : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <span style={{
                      fontSize: 10, padding: "3px 10px", borderRadius: 99, fontFamily: mono,
                      background: f.color + "15", color: f.color, border: `1px solid ${f.color}30`,
                    }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgb(var(--text-primary))", marginBottom: 10, fontFamily: mono }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "rgb(var(--text-muted))", lineHeight: 1.8, fontFamily: mono }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ════════════════════════════════════════════
            CTA
        ════════════════════════════════════════════ */}
        <section id="cta" style={{ padding: "100px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{
            maxWidth: 700, margin: "0 auto", textAlign: "center",
            background: "linear-gradient(135deg, rgba(234,88,12,0.05), rgba(217,119,6,0.02))",
            border: "1px solid rgba(234,88,12,0.3)",
            borderRadius: 28, padding: "64px 40px",
            boxShadow: "0 0 80px rgba(234,88,12,0.1), 0 24px 64px rgba(0,0,0,0.4)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow behind card */}
            <div style={{
              position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
              width: 400, height: 400,
              background: "radial-gradient(circle, rgba(234,88,12,0.2), transparent 70%)",
              borderRadius: "50%", pointerEvents: "none",
            }} />

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, color: "#ea580c" }}>
                <Anvil size={48} strokeWidth={2} />
              </div>
              <h2 style={{
                fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900,
                color: "rgb(var(--text-primary))", marginBottom: 16, fontFamily: mono,
              }}>
                Ready to level up?
              </h2>
              <p style={{ fontSize: 14, color: "rgb(var(--text-muted))", lineHeight: 1.8, marginBottom: 40, fontFamily: mono }}>
                Join DevForge. Practice daily. Battle weekly.
                <br />Get your resume interview-ready. Land the job.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleCTA}
                  style={{
                    padding: "14px 40px", borderRadius: 14, fontSize: 14,
                    fontWeight: 700, cursor: "pointer", border: "none",
                    background: "linear-gradient(135deg, #ea580c, #d97706)",
                    color: "rgb(var(--text-primary))", fontFamily: mono,
                    boxShadow: "0 4px 24px rgba(234,88,12,0.4)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(234,88,12,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(234,88,12,0.4)")}
                >
                  Start for Free →
                </button>
                <button
                  onClick={() => window.open("https://github.com/yourusername/devforge", "_blank")}
                  style={{
                    padding: "14px 40px", borderRadius: 14, fontSize: 14,
                    fontWeight: 600, cursor: "pointer",
                    background: "transparent", border: "1px solid var(--border-subtle)",
                    color: "rgb(var(--text-muted))", fontFamily: mono, transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(234,88,12,0.5)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-primary))"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--text-muted))"
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
          borderTop: "1px solid var(--border-subtle)", padding: "40px 24px",
          background: "var(--bg-base)",
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
                background: "linear-gradient(135deg, #ea580c, #d97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Anvil size={14} className="text-white" strokeWidth={3} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "rgb(var(--text-primary))", fontFamily: mono }}>
                Dev<span style={{ color: "#ea580c" }}>Forge</span>
              </span>
            </div>



            {/* Credit */}
            <p style={{ fontSize: 11, color: "rgb(var(--text-muted))", fontFamily: mono }}>
              Built by{" "}
              <span style={{ color: "#ea580c" }}>Gourav Sharma</span>
              {" "}· {new Date().getFullYear()}
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}
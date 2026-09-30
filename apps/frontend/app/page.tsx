"use client"

import { useAuthStore } from "@/store/auth.store"
import { useEffect, useRef, useState } from "react"
import dynamic from 'next/dynamic'
const BelowFold = dynamic(() => import('@/components/landing/BelowFold'), { ssr: false })
import { useRouter } from "next/navigation"
import { Anvil, Code2, Swords, FileText, BrainCircuit, Newspaper, Map, Sparkles, CheckCircle2, Award, Radar, Cpu, Terminal, ShieldAlert } from "lucide-react"

// ─── Tiny reusable styles ────────────────────────────────────────────────────
const mono = "JetBrains Mono, monospace"

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
    <div style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none", zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  )
}

// ─── Zig-Zag Feature Component ────────────────────────────────────────────────
export function HeroCollage() {
  return (
    <div className="relative w-full max-w-[700px] h-[550px] flex-shrink-0 animate-fade-in-up delay-400 z-10 mx-auto md:ml-auto font-mono" style={{ perspective: "1200px" }}>
      {/* Deep near-black background with subtle warm amber radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-80 z-0 pointer-events-none rounded-full blur-[80px]" style={{ background: "radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)" }} />
      
      {/* Dot-grid pattern */}
      <div 
        className="absolute inset-[-50px] z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* 1. Terminal Pill - z-10 */}
      <div className="absolute top-[8%] left-[10%] bg-[#0d0806]/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(234,88,12,0.15)] flex items-center gap-3 z-10 cursor-default" style={{ animation: "floatCard1 5s ease-in-out infinite" }}>
        <Terminal size={14} className="text-orange-500" />
        <span className="text-orange-400/90 text-sm font-bold tracking-wide">$ forge --rank</span>
      </div>

      {/* 2. Code Editor Card - z-20 */}
      <div className="absolute top-[18%] right-[2%] w-full max-w-[480px] bg-[#0d0806]/80 backdrop-blur-xl border border-white/10 rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(234,88,12,0.15)] overflow-hidden z-20 cursor-default" style={{ animation: "floatCard2 6s ease-in-out infinite 0.5s" }}>
        <div className="h-10 bg-black/40 border-b border-white/10 flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-4 text-xs text-white/40 font-mono">two_sum.ts</span>
        </div>
        {/* Added massive bottom padding so overlapping cards at the bottom corners don't hit text */}
        <div className="p-5 pb-[100px] pl-[30px] pr-[40px] text-sm leading-[1.7] font-mono">
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">1</span><span className="truncate"><span className="text-orange-400">function</span>&nbsp;<span className="text-emerald-400">twoSum</span><span className="text-white/70">(nums:&nbsp;</span><span className="text-teal-400">number[]</span><span className="text-white/70">, target:&nbsp;</span><span className="text-teal-400">number</span><span className="text-white/70">) {'{'}</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">2</span><span className="truncate"><span className="text-white/70 ml-4">const map = new&nbsp;</span><span className="text-emerald-400">Map</span><span className="text-white/70">&lt;</span><span className="text-teal-400">number</span><span className="text-white/70">,&nbsp;</span><span className="text-teal-400">number</span><span className="text-white/70">&gt;();</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">3</span><span className="truncate"><span className="text-white/70 ml-4">for (let i = 0; i &lt; nums.length; i++) {'{'}</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">4</span><span className="truncate"><span className="text-white/70 ml-8">const comp = target - nums[i];</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">5</span><span className="truncate"><span className="text-emerald-500/70 ml-8 font-normal italic">// O(n) pass</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">6</span><span className="truncate"><span className="text-orange-400 ml-8">if</span>&nbsp;<span className="text-white/70">(map.has(comp)) return [map.get(comp), i];</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">7</span><span className="truncate"><span className="text-white/70 ml-8">map.set(nums[i], i);</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">8</span><span className="truncate"><span className="text-white/70 ml-4">{'}'}</span></span></div>
          <div className="flex truncate"><span className="text-white/20 w-6 text-right mr-4 select-none shrink-0">9</span><span className="truncate"><span className="text-white/70">{'}'}</span></span></div>
        </div>
      </div>

      {/* 3. LIVE BATTLE Card - z-30 */}
      {/* Positioned bottom-left, overlapping the empty bottom-left padding of code editor */}
      <div className="absolute bottom-[2%] left-[0%] w-[320px] bg-[#0d0806]/80 backdrop-blur-xl border border-white/10 rounded-[16px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(234,88,12,0.15)] z-30 cursor-default" style={{ animation: "floatCard3 7s ease-in-out infinite 1s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Swords size={16} className="text-orange-500" />
          </div>
          <span className="text-orange-500 font-bold tracking-wider text-sm font-mono">LIVE BATTLE</span>
        </div>
        
        <div className="flex flex-col gap-4 mb-6">
          {/* You */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/80 font-mono">you</span>
              <span className="text-orange-400 font-mono">4/5</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[80%] rounded-full shadow-[0_0_10px_#ea580c]" />
            </div>
          </div>
          {/* Opponent */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40 font-mono">opponent</span>
              <span className="text-white/40 font-mono">3/5</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white/20 w-[60%] rounded-full" />
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-white/10">
          <div className="text-white text-3xl font-bold tracking-tight tabular-nums font-mono" style={{ textShadow: "0 0 20px rgba(234,88,12,0.3)" }}>
            00:47<span className="text-orange-500/80">.31</span>
          </div>
        </div>
      </div>

      {/* 4. ATS SCORE Card - z-40 (frontmost) */}
      {/* Offset leftward and upward, overlapping the empty bottom-right padding of code editor */}
      <div className="absolute bottom-[10%] right-[20%] w-[260px] bg-[#141110]/80 backdrop-blur-xl border border-white/10 rounded-[16px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(245,158,11,0.15)] z-40 cursor-default" style={{ animation: "floatCard4 5.5s ease-in-out infinite 1.5s" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <span className="text-emerald-500 font-bold tracking-wider text-sm font-mono">ATS SCORE</span>
        </div>
        
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-white text-4xl font-bold tabular-nums font-mono" style={{ textShadow: "0 0 20px rgba(74,222,128,0.2)" }}>94</span>
          <span className="text-white/30 text-lg font-mono">/100</span>
        </div>
        <div className="text-white/40 text-xs font-mono">Senior Frontend · optimized</div>
      </div>
      
    </div>
  )
}


export default function LandingPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

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
    return <div style={{ background: "#171210", minHeight: "100vh" }} />
  }

  return (
    <div style={{ background: "#171210", minHeight: "100vh", color: "#fdf6f0", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(200%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shine 4s infinite;
        }

        @keyframes floatDashboard {
          0%, 100% { transform: rotateX(15deg) rotateY(-20deg) rotateZ(2deg) scale(0.95) translateY(0); }
          50% { transform: rotateX(18deg) rotateY(-18deg) rotateZ(1deg) scale(0.95) translateY(-20px); }
        }
        @keyframes floatCard1 { 
          0%, 100% { transform: translateY(0px) rotateY(-12deg) rotateX(4deg); } 
          50% { transform: translateY(-8px) rotateY(-12deg) rotateX(4deg); } 
        }
        @keyframes floatCard2 { 
          0%, 100% { transform: translateY(0px) rotateY(-15deg) rotateX(2deg); } 
          50% { transform: translateY(-12px) rotateY(-15deg) rotateX(2deg); } 
        }
        @keyframes floatCard3 { 
          0%, 100% { transform: translateY(0px) rotateY(-14deg) rotateX(5deg); } 
          50% { transform: translateY(-10px) rotateY(-14deg) rotateX(5deg); } 
        }
        @keyframes floatCard4 { 
          0%, 100% { transform: translateY(0px) rotateY(-10deg) rotateX(3deg); } 
          50% { transform: translateY(-6px) rotateY(-10deg) rotateX(3deg); } 
        }
        @keyframes scanRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulseData {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Background Shader ── */}
      <HeroShader />

      {/* ── Ambient Radial Glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: "80vw", height: "80vw", maxWidth: 800, maxHeight: 800,
          background: "radial-gradient(circle, rgba(234,88,12,0.15), transparent 70%)",
          borderRadius: "50%", mixBlendMode: "screen"
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════ */}
        <section style={{
          minHeight: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "80px 24px 60px", overflow: "hidden"
        }}>
          <div className="max-w-[1400px] w-full mx-auto flex flex-col md:flex-row items-center gap-8 lg:gap-12">
            
            {/* ── Left Column: Text & CTAs ── */}
            <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", zIndex: 20 }}>
              
              {/* Badge */}
              <div className="animate-fade-in-up" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 20px", borderRadius: 99,
                border: "1px solid rgba(234,88,12,0.3)", background: "rgba(234,88,12,0.1)",
                backdropFilter: "blur(8px)", marginBottom: 40,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c", display: "inline-block", boxShadow: "0 0 12px #ea580c" }} />
                <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 600, fontFamily: mono, letterSpacing: "0.5px" }}>DevForge v2.0 Live</span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up delay-100" style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 900, lineHeight: 1.1,
                color: "#fdf6f0", marginBottom: 24, maxWidth: 800, letterSpacing: "-2px"
              }}>
                Forge Your Legacy as a <br />
                <span style={{
                  background: "linear-gradient(135deg, #ea580c, #f59e0b)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  Master of Code
                </span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-in-up delay-200" style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "#d4a373", maxWidth: 600, lineHeight: 1.6,
                marginBottom: 48, fontFamily: mono
              }}>
                Command your technical growth. Battle in the real-time PvP arena, compile flawless AI resumes, and conquer algorithmic mock interviews in a deeply immersive environment.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-in-up delay-300" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "flex-start" }}>
                <button
                  onClick={handleCTA}
                  className="btn-shine"
                  style={{
                    padding: "16px 40px", borderRadius: 14, fontSize: 15,
                    fontWeight: 700, cursor: "pointer", border: "none",
                    background: "linear-gradient(135deg, #ea580c, #d97706)",
                    color: "#fdf6f0", fontFamily: mono,
                    boxShadow: "0 8px 32px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.5) inset",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 12px 48px rgba(234,88,12,0.6), 0 0 0 1px rgba(234,88,12,0.6) inset"
                    e.currentTarget.style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.5) inset"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  Enter DevForge
                </button>
                <button
                  onClick={() => document.getElementById("bento")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    padding: "16px 40px", borderRadius: 14, fontSize: 15,
                    fontWeight: 600, cursor: "pointer",
                    background: "rgba(255,237,213,0.05)", border: "1px solid rgba(255,180,120,0.14)",
                    color: "#d4a373", fontFamily: mono, backdropFilter: "blur(12px)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(234,88,12,0.5)"
                    e.currentTarget.style.color = "#fdf6f0"
                    e.currentTarget.style.background = "rgba(234,88,12,0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,180,120,0.14)"
                    e.currentTarget.style.color = "#d4a373"
                    e.currentTarget.style.background = "rgba(255,237,213,0.05)"
                  }}
                >
                  Explore Features
                </button>
              </div>
            </div>

            {/* ── Right Column: Floating Dashboard Mockup (Animated) ── */}
            <HeroCollage />
        </div>
      </section>

        <BelowFold handleCTA={handleCTA} />

      </div>
    </div>
  )
}

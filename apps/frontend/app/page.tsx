"use client"

import { useAuthStore } from "@/store/auth.store"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Anvil, Code2, Swords, FileText, BrainCircuit, Newspaper, Map, Sparkles, CheckCircle2, Award, Radar, Cpu, Terminal, ShieldAlert } from "lucide-react"

// ─── Tiny reusable styles ────────────────────────────────────────────────────
const mono = "JetBrains Mono, monospace"

const BENTO_FEATURES = [
  {
    id: "arena",
    title: "PvP Arena",
    desc: "Real-time 1v1 coding battles via WebSockets. Same problem, race to pass all tests first.",
    tag: "Multiplayer",
    color: "#ef4444",
    icon: <Swords size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    rowSpan: "row-span-1 md:row-span-2",
    extraContent: (
      <div style={{ position: "relative", height: 160, display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
        <style>{`
          @keyframes typeCode {
            0% { width: 0%; opacity: 1; }
            40% { width: 100%; opacity: 1; }
            50% { opacity: 0; }
            100% { width: 0%; opacity: 0; }
          }
          @keyframes typeCodeReverse {
            0% { width: 0%; opacity: 1; }
            30% { width: 100%; opacity: 1; }
            40% { opacity: 0; }
            100% { width: 0%; opacity: 0; }
          }
          @keyframes drainHealth {
            0% { width: 100%; }
            20% { width: 85%; }
            50% { width: 40%; }
            80% { width: 15%; }
            100% { width: 100%; }
          }
          @keyframes pulseVS {
            0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(234,88,12,0.4); }
            50% { transform: scale(1.15); box-shadow: 0 0 24px rgba(234,88,12,0.8); }
          }
          @keyframes laserLeft {
            0% { transform: translateX(0) scaleX(0); opacity: 0; }
            10% { transform: translateX(0) scaleX(1); opacity: 1; }
            30% { transform: translateX(40px) scaleX(0); opacity: 0; }
            100% { opacity: 0; }
          }
          @keyframes laserRight {
            0% { transform: translateX(0) scaleX(0); opacity: 0; }
            10% { transform: translateX(0) scaleX(1); opacity: 1; }
            30% { transform: translateX(-40px) scaleX(0); opacity: 0; }
            100% { opacity: 0; }
          }
        `}</style>
        
        {/* Player 1 (Red) */}
        <div style={{ flex: 1, height: "100%", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11, color: "#ef4444", fontFamily: mono, fontWeight: 700, letterSpacing: "-0.5px" }}>
            <span>P1: GUEST</span>
            <span>120 WPM</span>
          </div>
          {/* Health Bar */}
          <div style={{ height: 6, background: "rgba(239, 68, 68, 0.15)", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#ef4444", width: "100%", animation: "drainHealth 5s infinite ease-in-out", boxShadow: "0 0 8px #ef4444" }} />
          </div>
          {/* Code Lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 6, background: "#ef4444", borderRadius: 3, animation: "typeCode 2s infinite steps(15, end)" }} />
            <div style={{ height: 6, background: "rgba(239, 68, 68, 0.3)", borderRadius: 3, width: "80%" }} />
            <div style={{ height: 6, background: "rgba(239, 68, 68, 0.3)", borderRadius: 3, width: "50%" }} />
            <div style={{ height: 6, background: "rgba(239, 68, 68, 0.3)", borderRadius: 3, width: "90%" }} />
          </div>
          {/* Data Attack Particle */}
          <div style={{ position: "absolute", right: -4, top: "60%", width: 24, height: 2, background: "#ef4444", transformOrigin: "left", animation: "laserLeft 1.2s infinite", boxShadow: "0 0 8px #ef4444" }} />
        </div>

        {/* VS Badge */}
        <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #ef4444, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, color: "#fff", fontWeight: 900, fontSize: 14, fontStyle: "italic", animation: "pulseVS 1s infinite alternate" }}>
          VS
        </div>

        {/* Player 2 (Orange) */}
        <div style={{ flex: 1, height: "100%", background: "rgba(249, 115, 22, 0.05)", border: "1px solid rgba(249, 115, 22, 0.2)", borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11, color: "#f97316", fontFamily: mono, fontWeight: 700, letterSpacing: "-0.5px" }}>
            <span>P2: MASTER</span>
            <span>210 WPM</span>
          </div>
          {/* Health Bar */}
          <div style={{ height: 6, background: "rgba(249, 115, 22, 0.15)", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#f97316", width: "80%", boxShadow: "0 0 8px #f97316" }} />
          </div>
          {/* Code Lines (right aligned) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ height: 6, background: "#f97316", borderRadius: 3, animation: "typeCodeReverse 1.8s infinite steps(15, end)" }} />
            <div style={{ height: 6, background: "rgba(249, 115, 22, 0.3)", borderRadius: 3, width: "85%" }} />
            <div style={{ height: 6, background: "rgba(249, 115, 22, 0.3)", borderRadius: 3, width: "60%" }} />
            <div style={{ height: 6, background: "rgba(249, 115, 22, 0.3)", borderRadius: 3, width: "95%" }} />
          </div>
          {/* Data Attack Particle */}
          <div style={{ position: "absolute", left: -4, top: "70%", width: 24, height: 2, background: "#f97316", transformOrigin: "right", animation: "laserRight 1.5s infinite", boxShadow: "0 0 8px #f97316" }} />
        </div>
      </div>
    )
  },
  {
    id: "grandmaster",
    title: "Mock Interview",
    desc: "AI builds a 9-question interview from your actual resume. Answer, get scored, get feedback.",
    tag: "AI Powered",
    color: "#ea580c",
    icon: <BrainCircuit size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    rowSpan: "row-span-1",
    extraContent: (
      <div style={{ position: "relative", height: 170, marginTop: 24, padding: 12, display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.2)", borderRadius: 16, overflow: "hidden", fontFamily: mono, fontSize: 11 }}>
        <style>{`
          @keyframes chatSequence {
            0% { opacity: 0; transform: translateY(10px); }
            5% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            95% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 0; }
          }
          @keyframes audioWave {
            0%, 100% { height: 4px; }
            50% { height: 16px; }
          }
        `}</style>
        
        {/* AI Question */}
        <div style={{ alignSelf: "flex-start", background: "rgba(234, 88, 12, 0.1)", border: "1px solid rgba(234, 88, 12, 0.2)", padding: "8px 12px", borderRadius: "12px 12px 12px 0", color: "#ea580c", animation: "chatSequence 9s infinite", opacity: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>DevForge AI</div>
          "Explain the JS Event Loop."
        </div>

        {/* User Answer (Voice Waveform) */}
        <div style={{ alignSelf: "flex-end", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "12px", borderRadius: "12px 12px 0 12px", display: "flex", alignItems: "center", gap: 4, animation: "chatSequence 9s infinite 2.5s", opacity: 0, height: 32 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ width: 3, background: "#d4a373", borderRadius: 2, animation: `audioWave 0.6s infinite ${i * 0.1}s` }} />
          ))}
        </div>

        {/* AI Feedback */}
        <div style={{ alignSelf: "flex-start", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "8px 12px", borderRadius: "12px 12px 12px 0", color: "#10b981", animation: "chatSequence 9s infinite 5.5s", opacity: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Feedback</div>
          Score: 9.5/10. Optimal answer.
        </div>
      </div>
    )
  },
  {
    id: "resume",
    title: "Resume Studio",
    desc: "Build a new resume from scratch, scan existing resumes for ATS scores, and get AI-powered improvement suggestions.",
    tag: "Career Profile",
    color: "#f97316",
    icon: <FileText size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    rowSpan: "row-span-1",
    extraContent: (
      <div style={{ position: "relative", height: 180, overflow: "hidden", marginTop: 24, borderRadius: 16, border: "1px solid rgba(249, 115, 22, 0.1)", background: "rgba(0,0,0,0.2)" }}>
        <style>{`
          @keyframes stageCarousel {
            0%, 5% { transform: translateY(0); opacity: 0; }
            10%, 28% { transform: translateY(0); opacity: 1; }
            33%, 61% { transform: translateY(-180px); opacity: 1; }
            66%, 94% { transform: translateY(-360px); opacity: 1; }
            98%, 100% { transform: translateY(-360px); opacity: 0; }
          }
          @keyframes scanLine {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes fillRing {
            0%, 20% { stroke-dashoffset: 251; }
            60%, 100% { stroke-dashoffset: 5; }
          }
          @keyframes pulseScore {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
        `}</style>
        
        <div style={{ width: "100%", animation: "stageCarousel 12s infinite cubic-bezier(0.4, 0, 0.2, 1)" }}>
          
          {/* Stage 1: Parsing */}
          <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 140, height: 130, border: "1px dashed rgba(249, 115, 22, 0.4)", borderRadius: 8, padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: "#ea580c", marginBottom: 12, fontFamily: mono, fontWeight: 700 }}>[PARSING...]</div>
              <div style={{ width: "80%", height: 4, background: "rgba(249, 115, 22, 0.2)", marginBottom: 8, borderRadius: 2 }} />
              <div style={{ width: "100%", height: 4, background: "rgba(249, 115, 22, 0.2)", marginBottom: 8, borderRadius: 2 }} />
              <div style={{ width: "60%", height: 4, background: "rgba(249, 115, 22, 0.2)", marginBottom: 8, borderRadius: 2 }} />
              <div style={{ width: "90%", height: 4, background: "rgba(249, 115, 22, 0.2)", marginBottom: 8, borderRadius: 2 }} />
              <div style={{ position: "absolute", left: -10, right: -10, height: 2, background: "#f97316", boxShadow: "0 0 12px #f97316", animation: "scanLine 1.5s infinite linear" }} />
            </div>
          </div>

          {/* Stage 2: ATS Score */}
          <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="130" height="130" viewBox="0 0 100 100" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="6" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="251" strokeDashoffset="251" strokeLinecap="round" style={{ animation: "fillRing 4s infinite" }} />
              </svg>
              <div style={{ textAlign: "center", animation: "pulseScore 2s infinite" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#10b981", fontFamily: mono, lineHeight: 1 }}>98</div>
                <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, letterSpacing: "0.5px", marginTop: 4 }}>ATS SCORE</div>
              </div>
            </div>
          </div>

          {/* Stage 3: AI Rewrite */}
          <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 220, background: "rgba(249, 115, 22, 0.05)", border: "1px solid rgba(249, 115, 22, 0.2)", borderRadius: 12, padding: "16px", position: "relative" }}>
              <div style={{ position: "absolute", top: -14, right: -14, background: "#171210", border: "1px solid #f97316", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", boxShadow: "0 0 16px rgba(249,115,22,0.4)" }}>
                <Sparkles size={16} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontFamily: mono }}>Original:</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 12, textDecoration: "line-through", fontFamily: mono }}>Made a dashboard in React.</div>
              
              <div style={{ fontSize: 10, color: "#10b981", marginBottom: 4, fontFamily: mono, fontWeight: 700 }}>Optimized:</div>
              <div style={{ fontSize: 11, color: "#10b981", padding: "10px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, fontFamily: mono, lineHeight: 1.4 }}>
                Spearheaded development of a scalable React dashboard...
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  },
  {
    id: "dsa",
    title: "DSA Practice",
    desc: "LeetCode-style problems with a Monaco Editor. Real code execution in a local sandbox.",
    tag: "Sandbox",
    color: "#f59e0b",
    icon: <Code2 size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    rowSpan: "row-span-1",
    extraContent: (
      <div style={{ position: "relative", height: 180, width: "100%", maxWidth: 360, marginTop: 24, borderRadius: 12, border: "1px solid rgba(245, 158, 11, 0.3)", background: "#171210", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <style>{`
          @keyframes codeHighlight {
            0%, 10% { transform: translateY(0); }
            20%, 30% { transform: translateY(18px); }
            40%, 50% { transform: translateY(36px); }
            60%, 70% { transform: translateY(54px); }
            80%, 90% { transform: translateY(72px); }
            100% { transform: translateY(0); }
          }
          @keyframes n1 { 0%, 15%, 85%, 100% { fill: rgba(245,158,11,0.2); } 5%, 10% { fill: #f59e0b; filter: drop-shadow(0 0 8px #f59e0b); } }
          @keyframes n2 { 0%, 35%, 100% { fill: rgba(245,158,11,0.2); } 25%, 30% { fill: #f59e0b; filter: drop-shadow(0 0 8px #f59e0b); } }
          @keyframes n3 { 0%, 55%, 100% { fill: rgba(245,158,11,0.2); } 45%, 50% { fill: #f59e0b; filter: drop-shadow(0 0 8px #f59e0b); } }
          @keyframes n4 { 0%, 75%, 100% { fill: rgba(245,158,11,0.2); } 65%, 70% { fill: #f59e0b; filter: drop-shadow(0 0 8px #f59e0b); } }
          @keyframes n5 { 0%, 95%, 100% { fill: rgba(245,158,11,0.2); } 85%, 90% { fill: #f59e0b; filter: drop-shadow(0 0 8px #f59e0b); } }
          @keyframes pathFlow {
            0% { stroke-dashoffset: 40; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
        
        {/* Fake IDE Header */}
        <div style={{ height: 28, background: "rgba(245, 158, 11, 0.1)", borderBottom: "1px solid rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}/>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}/>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}/>
          <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#d4a373", fontFamily: mono, marginRight: 34 }}>dfs.js</div>
        </div>

        {/* Split Body */}
        <div style={{ display: "flex", flex: 1 }}>
          
          {/* Code Left */}
          <div style={{ flex: 1, borderRight: "1px solid rgba(245, 158, 11, 0.1)", padding: "12px", position: "relative", fontFamily: mono, fontSize: 10, color: "#d4a373", lineHeight: "18px" }}>
            {/* Moving Highlight */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 12, height: 18, background: "rgba(245, 158, 11, 0.15)", borderLeft: "2px solid #f59e0b", animation: "codeHighlight 5s infinite" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ color: "#f59e0b" }}>function <span style={{ color: "#fdf6f0" }}>dfs</span>(node) {'{'}</div>
              <div style={{ paddingLeft: 12 }}>if (!node) return;</div>
              <div style={{ paddingLeft: 12 }}>visit(node.val);</div>
              <div style={{ paddingLeft: 12 }}>dfs(node.left);</div>
              <div style={{ paddingLeft: 12 }}>dfs(node.right);</div>
              <div>{'}'}</div>
            </div>
          </div>

          {/* Graph Right */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
             <svg width="120" height="120" viewBox="0 0 120 120">
                {/* Flowing Edges */}
                <path d="M60 20 L30 60" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 4" style={{ animation: "pathFlow 1s linear infinite" }} />
                <path d="M60 20 L90 60" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 4" style={{ animation: "pathFlow 1s linear infinite" }} />
                <path d="M30 60 L15 100" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 4" style={{ animation: "pathFlow 1s linear infinite" }} />
                <path d="M30 60 L45 100" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 4" style={{ animation: "pathFlow 1s linear infinite" }} />
                <path d="M90 60 L105 100" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 4" style={{ animation: "pathFlow 1s linear infinite" }} />
                
                {/* Nodes */}
                <circle cx="60" cy="20" r="10" style={{ animation: "n1 5s infinite" }} />
                <circle cx="30" cy="60" r="10" style={{ animation: "n2 5s infinite" }} />
                <circle cx="15" cy="100" r="10" style={{ animation: "n3 5s infinite" }} />
                <circle cx="45" cy="100" r="10" style={{ animation: "n4 5s infinite" }} />
                <circle cx="90" cy="60" r="10" style={{ animation: "n5 5s infinite" }} />
                <circle cx="105" cy="100" r="10" style={{ fill: "rgba(245,158,11,0.2)" }} />
             </svg>
          </div>

        </div>
      </div>
    )
  },
  {
    id: "paths",
    title: "Learning Paths",
    desc: "Structured skill tracks. Track progress, earn XP, go from beginner to job-ready.",
    tag: "Curriculum",
    color: "#10b981",
    icon: <Map size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 lg:col-span-1",
    rowSpan: "row-span-1",
    extraContent: (
      <div style={{ position: "relative", height: 180, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, borderRadius: 16, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(16, 185, 129, 0.1)", overflow: "hidden" }}>
        <style>{`
          @keyframes drawPath {
            0%, 5% { stroke-dashoffset: 350; }
            85%, 100% { stroke-dashoffset: 0; }
          }
          @keyframes nodeActivate1 { 0%, 15% { fill: rgba(16,185,129,0.1); stroke: rgba(16,185,129,0.3); filter: none; } 20%, 100% { fill: #10b981; stroke: #fff; filter: drop-shadow(0 0 12px #10b981); } }
          @keyframes nodeActivate2 { 0%, 45% { fill: rgba(16,185,129,0.1); stroke: rgba(16,185,129,0.3); filter: none; } 50%, 100% { fill: #10b981; stroke: #fff; filter: drop-shadow(0 0 12px #10b981); } }
          @keyframes nodeActivate3 { 0%, 75% { fill: rgba(16,185,129,0.1); stroke: rgba(16,185,129,0.3); filter: none; } 80%, 100% { fill: #10b981; stroke: #fff; filter: drop-shadow(0 0 16px #10b981); } }
          
          @keyframes xpPop1 { 0%, 15% { opacity: 0; transform: translateY(0) scale(0.5); } 20%, 30% { opacity: 1; transform: translateY(-15px) scale(1.1); } 35%, 100% { opacity: 0; transform: translateY(-20px) scale(1); } }
          @keyframes xpPop2 { 0%, 45% { opacity: 0; transform: translateY(0) scale(0.5); } 50%, 60% { opacity: 1; transform: translateY(-15px) scale(1.1); } 65%, 100% { opacity: 0; transform: translateY(-20px) scale(1); } }
          @keyframes xpPop3 { 0%, 75% { opacity: 0; transform: translateY(0) scale(0.5); } 80%, 90% { opacity: 1; transform: translateY(-15px) scale(1.2); } 95%, 100% { opacity: 0; transform: translateY(-20px) scale(1); } }
        `}</style>
        
        <svg width="200" height="160" viewBox="0 0 200 160" style={{ overflow: "visible" }}>
           {/* Background Track */}
           <path d="M 40 130 C 40 90, 160 130, 160 80 C 160 30, 40 70, 40 20" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="12" strokeLinecap="round" />
           <path d="M 40 130 C 40 90, 160 130, 160 80 C 160 30, 40 70, 40 20" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 8" />
           
           {/* Animated Fill Track */}
           <path d="M 40 130 C 40 90, 160 130, 160 80 C 160 30, 40 70, 40 20" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeDasharray="350" strokeDashoffset="350" style={{ animation: "drawPath 6s infinite linear" }} />
           
           {/* Nodes */}
           {/* Node 1 */}
           <circle cx="40" cy="130" r="12" style={{ animation: "nodeActivate1 6s infinite" }} strokeWidth="3" />
           <text x="65" y="134" fill="rgba(255,255,255,0.8)" fontSize="11" fontFamily={mono} fontWeight="600">Basics</text>
           <g style={{ animation: "xpPop1 6s infinite" }}>
             <text x="30" y="110" fill="#10b981" fontSize="13" fontWeight="800" fontFamily="sans-serif">+50 XP</text>
           </g>

           {/* Node 2 */}
           <circle cx="160" cy="80" r="14" style={{ animation: "nodeActivate2 6s infinite" }} strokeWidth="3" />
           <text x="95" y="84" fill="rgba(255,255,255,0.8)" fontSize="11" fontFamily={mono} fontWeight="600">Advanced</text>
           <g style={{ animation: "xpPop2 6s infinite" }}>
             <text x="145" y="55" fill="#10b981" fontSize="14" fontWeight="900" fontFamily="sans-serif">+100 XP</text>
           </g>

           {/* Node 3 */}
           <circle cx="40" cy="20" r="16" style={{ animation: "nodeActivate3 6s infinite" }} strokeWidth="3" />
           <text x="70" y="25" fill="#10b981" fontSize="13" fontWeight="800" fontFamily={mono}>Mastery</text>
           <g style={{ animation: "xpPop3 6s infinite" }}>
             <text x="30" y="-8" fill="#f59e0b" fontSize="16" fontWeight="900" fontFamily="sans-serif">+500 XP</text>
           </g>
        </svg>
      </div>
    )
  },
  {
    id: "news",
    title: "Tech Pulse",
    desc: "Curated AI & tech articles refreshed every 6 hours from top sources.",
    tag: "Workers",
    color: "#d97706",
    icon: <Newspaper size={32} strokeWidth={1.5} />,
    colSpan: "col-span-1 lg:col-span-1",
    rowSpan: "row-span-1",
    extraContent: (
      <div style={{ position: "relative", height: 180, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, overflow: "hidden", borderRadius: 16, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(217, 119, 6, 0.1)" }}>
        <style>{`
          @keyframes radarSpin { 100% { transform: rotate(360deg); } }
          @keyframes slideInRight1 {
            0%, 5% { transform: translateX(110%); opacity: 0; }
            15%, 85% { transform: translateX(0); opacity: 1; }
            95%, 100% { transform: translateX(-110%); opacity: 0; }
          }
          @keyframes slideInRight2 {
            0%, 10% { transform: translateX(110%); opacity: 0; }
            20%, 80% { transform: translateX(0); opacity: 1; }
            90%, 100% { transform: translateX(-110%); opacity: 0; }
          }
          @keyframes tldrExpand {
            0%, 30% { max-height: 0; opacity: 0; margin-top: 0; padding-top: 0; padding-bottom: 0; border-color: transparent; }
            40%, 75% { max-height: 80px; opacity: 1; margin-top: 8px; padding-top: 8px; padding-bottom: 8px; border-color: rgba(16, 185, 129, 0.2); }
            85%, 100% { max-height: 0; opacity: 0; margin-top: 0; padding-top: 0; padding-bottom: 0; border-color: transparent; }
          }
          @keyframes pulseRed { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>

        <div style={{ width: "100%", height: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "#d97706", fontFamily: mono, fontWeight: 700, letterSpacing: 1 }}>DEVFORGE_PULSE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#ef4444", fontFamily: mono, fontWeight: 700, animation: "pulseRed 2s infinite" }}>
              <Radar size={12} style={{ animation: "radarSpin 3s linear infinite" }} />
              LIVE
            </div>
          </div>

          {/* Article 1 */}
          <div style={{ background: "rgba(217, 119, 6, 0.05)", border: "1px solid rgba(217, 119, 6, 0.2)", borderRadius: 8, padding: "10px 12px", animation: "slideInRight1 12s infinite cubic-bezier(0.4, 0, 0.2, 1)" }}>
             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
               <div style={{ fontSize: 11, color: "#fdf6f0", fontWeight: 700 }}>React 19 RC is Now Available</div>
               <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>2m ago</div>
             </div>
             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>The first release candidate for React 19 brings...</div>
             
             {/* AI TLDR Expansion */}
             <div style={{ overflow: "hidden", animation: "tldrExpand 12s infinite cubic-bezier(0.4, 0, 0.2, 1)", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 6, paddingLeft: 8, paddingRight: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#10b981", fontSize: 9, fontWeight: 700, marginBottom: 4, fontFamily: mono }}>
                  <Sparkles size={10} /> AI TL;DR
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                  React Compiler introduces auto-memoization, eliminating the need for useMemo and useCallback in most cases.
                </div>
             </div>
          </div>

          {/* Article 2 */}
          <div style={{ background: "rgba(217, 119, 6, 0.02)", border: "1px solid rgba(217, 119, 6, 0.1)", borderRadius: 8, padding: "10px 12px", animation: "slideInRight2 12s infinite cubic-bezier(0.4, 0, 0.2, 1)" }}>
             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
               <div style={{ fontSize: 11, color: "rgba(253, 246, 240, 0.8)", fontWeight: 700 }}>Next.js 15 Introduces Turbopack</div>
               <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>1h ago</div>
             </div>
             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Vercel's latest framework update promises...</div>
          </div>

        </div>
      </div>
    )
  },
]

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
    <div style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none", zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  )
}

// ─── Zig-Zag Feature Component ────────────────────────────────────────────────
function ZigZagFeature({ feature, index }: { feature: any, index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const isLeftAnimation = index % 2 === 0

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex flex-col gap-12 md:gap-24 items-center ${isLeftAnimation ? "md:flex-row-reverse" : "md:flex-row"}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Text Section */}
      <div className="flex-1 w-full" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : (isLeftAnimation ? "translateX(40px)" : "translateX(-40px)"),
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ color: feature.color, padding: 12, borderRadius: 16, background: feature.color + "15", border: `1px solid ${feature.color}30` }}>
            {feature.icon}
          </div>
          <span style={{
            fontSize: 12, padding: "6px 16px", borderRadius: 99, fontFamily: mono, fontWeight: 700,
            background: feature.color + "15", color: feature.color, border: `1px solid ${feature.color}30`,
          }}>
            {feature.tag}
          </span>
        </div>
        <h3 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#fdf6f0", marginBottom: 16, fontFamily: mono, letterSpacing: "-1px" }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#d4a373", lineHeight: 1.6, fontFamily: mono, maxWidth: 500 }}>
          {feature.desc}
        </p>
      </div>

      {/* Animation Section */}
      <div className="flex-1 w-full" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : (isLeftAnimation ? "translateX(-40px)" : "translateX(40px)"),
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
        background: isHovered ? "rgba(255,237,213,0.05)" : "rgba(255,237,213,0.02)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${isHovered ? feature.color + "50" : "rgba(255,180,120,0.1)"}`,
        borderRadius: 32,
        padding: "32px 24px",
        boxShadow: isHovered ? `0 20px 60px ${feature.color}15, inset 0 1px 0 rgba(255,255,255,0.05)` : "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 400, transform: "scale(1.1)", transformOrigin: "center" }}>
          {feature.extraContent && feature.extraContent}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

        {/* ════════════════════════════════════════════
            SOCIAL PROOF / STATS
        ════════════════════════════════════════════ */}
        <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,180,120,0.05)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, textAlign: "center" }}>
            {[
              { stat: "10k+", label: "Active Engineers" },
              { stat: "150+", label: "DSA Challenges" },
              { stat: "1M+", label: "Lines of Code Executed" },
              { stat: "4.9/5", label: "Average Mock Interview Score" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#ea580c", fontFamily: mono, letterSpacing: "-0.5px" }}>
                  {s.stat}
                </div>
                <div style={{ fontSize: 13, color: "#d4a373", marginTop: 4, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════ */}
        <section style={{ padding: "60px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#fdf6f0", letterSpacing: "-1px" }}>
                Mastery Through Practice
              </h2>
              <p style={{ fontSize: 16, color: "#d4a373", marginTop: 16, maxWidth: 600, margin: "16px auto 0", fontFamily: mono }}>
                A streamlined, gamified workflow designed to turn you into an algorithmic weapon.
              </p>
            </div>
            
            <div className="relative">
              {/* Connecting Line for Desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-y-1/2 z-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {[
                  { step: "01", title: "Learn & Prepare", desc: "Follow structured roadmaps and absorb high-quality tech news to build a strong foundational knowledge base.", icon: <BrainCircuit className="mb-6 text-emerald-500" size={40} strokeWidth={1.5} /> },
                  { step: "02", title: "Execute & Battle", desc: "Test your skills in the secure local sandbox or race against fellow developers in the real-time PvP arena.", icon: <Swords className="mb-6 text-red-500" size={40} strokeWidth={1.5} /> },
                  { step: "03", title: "Analyze & Interview", desc: "Upload your resume for AI gap-analysis and pass a grueling technical mock interview to prove your worth.", icon: <Sparkles className="mb-6 text-amber-500" size={40} strokeWidth={1.5} /> }
                ].map((item, idx) => (
                  <div key={idx} className="group relative overflow-hidden" style={{ 
                    background: "rgba(23,18,16,0.8)", 
                    border: "1px solid rgba(234,88,12,0.1)", 
                    borderRadius: 24, padding: "32px 24px",
                    backdropFilter: "blur(20px)",
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "default"
                  }}>
                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[24px]" style={{ background: "radial-gradient(circle at center, rgba(234,88,12,0.15) 0%, transparent 70%)" }} />
                    {/* Hover Border & Inner Shadow */}
                    <div className="absolute inset-0 rounded-[24px] border border-[#ea580c] opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none shadow-[0_0_30px_rgba(234,88,12,0.2)_inset]" />
                    
                    {/* Background Number */}
                    <div className="absolute top-4 right-6 text-[80px] font-black text-white/[0.05] group-hover:text-orange-500/[0.1] transition-colors duration-500 pointer-events-none select-none z-0 leading-none">
                      {item.step}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 ease-out filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                        {item.icon}
                      </div>
                      <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 800, letterSpacing: 2, marginBottom: 16, fontFamily: mono }}>PHASE {item.step}</div>
                      <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fdf6f0", marginBottom: 16, fontFamily: mono }} className="group-hover:text-orange-400 transition-colors duration-500">
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 14, color: "rgba(253, 246, 240, 0.6)", lineHeight: 1.6, fontFamily: mono }} className="group-hover:text-[rgba(253,246,240,0.9)] transition-colors duration-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            ZIG-ZAG FEATURES
        ════════════════════════════════════════════ */}
        <section id="features" style={{ padding: "60px 24px 100px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#fdf6f0", letterSpacing: "-1px" }}>
                Command Center Capabilities
              </h2>
              <p style={{ fontSize: 15, color: "#d4a373", marginTop: 12, maxWidth: 600, margin: "12px auto 0", fontFamily: mono }}>
                Everything you need to master your craft and dominate the technical interview, built into one cohesive platform.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
              {BENTO_FEATURES.map((feature, idx) => (
                <ZigZagFeature key={feature.id} feature={feature} index={idx} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            TERMINAL MARQUEE
        ════════════════════════════════════════════ */}
        <section style={{ borderTop: "1px solid rgba(255,180,120,0.1)", borderBottom: "1px solid rgba(255,180,120,0.1)", background: "rgba(0,0,0,0.2)", padding: "20px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", whiteSpace: "nowrap", animation: "scrollLeft 30s linear infinite", fontFamily: mono, fontSize: 13, color: "#ea580c" }}>
            <style>{`
              @keyframes scrollLeft {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 40, paddingRight: 40 }}>
                <span>&gt;_ DevForge System: ONLINE</span>
                <span>[INFO] BullMQ workers synchronized</span>
                <span>[WARN] PvP Arena queue highly active</span>
                <span>[SUCCESS] Gemini models responding</span>
                <span>&gt;_ Executing runInSandbox() ... OK</span>
                <span>[INFO] PII Redaction layer active</span>
                <span>[STATUS] All systems nominal</span>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            BOTTOM CTA
        ════════════════════════════════════════════ */}
        <section style={{ padding: "80px 24px 100px", textAlign: "center", background: "linear-gradient(180deg, transparent, rgba(234,88,12,0.05))" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#fdf6f0", letterSpacing: "-1px", marginBottom: 20 }}>
              Ready to <span style={{ color: "#ea580c" }}>Level Up</span>?
            </h2>
            <p style={{ fontSize: 16, color: "#d4a373", marginBottom: 32, fontFamily: mono }}>
              Join the elite arena today and prove your skills.
            </p>
            <button
              onClick={handleCTA}
              className="btn-shine"
              style={{
                padding: "16px 40px", borderRadius: 12, fontSize: 16,
                fontWeight: 700, cursor: "pointer", border: "none",
                background: "linear-gradient(135deg, #ea580c, #d97706)",
                color: "#fdf6f0", fontFamily: mono,
                boxShadow: "0 8px 32px rgba(234,88,12,0.4), 0 0 0 1px rgba(234,88,12,0.5) inset",
                transition: "all 0.3s",
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
              Start For Free
            </button>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════ */}
        <footer style={{ padding: "60px 24px", background: "#171210", position: "relative", zIndex: 10 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #ea580c, #d97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(234,88,12,0.4)"
              }}>
                <Anvil size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#fdf6f0", letterSpacing: "-0.5px" }}>
                Dev<span style={{ color: "#ea580c" }}>Forge</span>
              </span>
            </div>

            <p style={{ fontSize: 13, color: "#d4a373", fontFamily: mono }}>
              Engineered by <span style={{ color: "#ea580c", fontWeight: 600 }}>Gourav Sharma</span> &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}

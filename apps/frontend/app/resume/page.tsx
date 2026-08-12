"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { nanoid } from "nanoid"
import { ModernProfessional, CreativeMinimalist, ExecutiveProfile, TechInnovator } from "@/components/resume-templates"

const mono = "JetBrains Mono, monospace"

const DEFAULT_SECTIONS = [
  {
    id: "personal", type: "personal", title: "Personal Info", enabled: true, removable: false,
    data: { name: "John Doe", title: "Software Engineer", email: "john.doe@example.com", phone: "+1 234 567 8900", location: "San Francisco, CA", linkedin: "linkedin.com/in/johndoe" },
  },
  {
    id: "summary", type: "summary", title: "Professional Summary", enabled: true, removable: true,
    data: { text: "Passionate software engineer with 5+ years of experience building scalable web applications. Proficient in modern JavaScript frameworks and cloud technologies, with a strong focus on delivering high-performance, user-centric solutions." },
  },
  {
    id: "experience", type: "experience", title: "Work Experience", enabled: true, removable: true,
    data: { items: [
      { id: nanoid(6), company: "TechNova Solutions", position: "Senior Frontend Developer", startDate: "Jan 2021", endDate: "Present", current: true, location: "Remote", bullets: ["Led a team of 4 engineers to rebuild the core SaaS platform using React.", "Improved application load times by 40% through code splitting and lazy loading."] },
      { id: nanoid(6), company: "Global Systems Inc.", position: "Software Engineer", startDate: "Jun 2018", endDate: "Dec 2020", current: false, location: "New York, NY", bullets: ["Developed and maintained RESTful APIs using Node.js and Express.", "Integrated third-party payment gateways for seamless transactions."] }
    ] },
  },
  {
    id: "education", type: "education", title: "Education", enabled: true, removable: true,
    data: { items: [
      { id: nanoid(6), institution: "State University", degree: "B.S.", field: "Computer Science", startDate: "Aug 2014", endDate: "May 2018", gpa: "3.8", location: "Boston, MA" }
    ] },
  },
  {
    id: "skills", type: "skills", title: "Skills", enabled: true, removable: true,
    data: { items: [
      { id: nanoid(6), category: "Languages", skills: "JavaScript, TypeScript, Python, HTML, CSS" },
      { id: nanoid(6), category: "Frameworks", skills: "React, Next.js, Node.js, Express" },
      { id: nanoid(6), category: "Tools", skills: "Git, Docker, AWS, Webpack" }
    ] },
  }
]

const TEMPLATES = [
  { id: "modern", name: "Modern Professional", author: "DevForge", component: ModernProfessional },
  { id: "creative", name: "Creative Minimalist", author: "DevForge", component: CreativeMinimalist },
  { id: "executive", name: "Executive Profile", author: "DevForge", component: ExecutiveProfile, hasPhoto: true },
  { id: "innovator", name: "Tech Innovator", author: "DevForge", component: TechInnovator, hasPhoto: true }
]

export default function ResumeHubPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>("modern")
  
  const [previewScale, setPreviewScale] = useState(0.75)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Auto-scale preview based on container size
  useEffect(() => {
    if (!previewContainerRef.current) return
    const resizeObs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      const scaleW = width / (595 + 80)
      const scaleH = height / (842 + 80)
      setPreviewScale(Math.min(scaleW, scaleH))
    })
    resizeObs.observe(previewContainerRef.current)
    return () => resizeObs.disconnect()
  }, [])

  if (!hydrated || !token) return null

  const activeSections = DEFAULT_SECTIONS
  const PreviewComponent = TEMPLATES.find(t => t.id === selectedPreviewId)?.component || ModernProfessional

  return (
    <main style={{ display: "flex", height: "calc(100vh - 56px)", background: "#171210" }}>
      
      {/* ── Left Column: Template Gallery ── */}
      <div style={{ width: "55%", minWidth: 600, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,180,120,0.1)" }}>
        
        {/* Header */}
        <div style={{ padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,180,120,0.05)", background: "rgba(255,255,255,0.02)" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fdf6f0", fontFamily: mono, margin: 0, letterSpacing: -0.5 }}>Resume Templates</h1>
            <p style={{ fontSize: 13, color: "#8a7a6a", marginTop: 8, fontFamily: mono, maxWidth: 380, lineHeight: 1.5 }}>
              Choose a template below to start building your targeted resume.
            </p>
          </div>
        </div>



        {/* Template Grid */}
        <div style={{ padding: "32px 40px", flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 32, alignContent: "start" }}>
          {TEMPLATES.map(t => (
            <div 
              key={t.id} 
              onMouseEnter={() => setHoveredTemplate(t.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Card Thumbnail */}
              <div style={{ 
                position: "relative",
                aspectRatio: "595/842", borderRadius: 12, background: "#fff", 
                border: selectedPreviewId === t.id ? "2px solid #ea580c" : "1px solid rgba(255,180,120,0.1)",
                transition: "all 0.2s", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
              }}>
                {/* Mini Preview rendering */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 595, height: 842, transform: "scale(0.35)", transformOrigin: "top left", pointerEvents: "none" }}>
                  <t.component sections={DEFAULT_SECTIONS} />
                </div>

                {/* Hover Overlay */}
                {hoveredTemplate === t.id && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 12px 12px 12px",
                    background: "linear-gradient(to top, rgba(17,13,12,0.95), transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                    <button 
                      onClick={() => setSelectedPreviewId(t.id)} 
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: mono }}
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => router.push(`/resume/builder?template=${t.id}`)} 
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", background: "#ea580c", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: mono, boxShadow: "0 2px 8px rgba(234,88,12,0.4)" }}
                    >
                      Use this
                    </button>
                  </div>
                )}
                
                {t.hasPhoto && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "4px 8px",
                    borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#fdf6f0", fontFamily: mono,
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    Photo
                  </div>
                )}
              </div>

              {/* Meta */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fdf6f0", margin: 0, fontFamily: "Inter, sans-serif" }}>{t.name}</h3>
                <p style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4, margin: 0, fontFamily: mono }}>By {t.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Column: Live A4 Preview ── */}
      <div ref={previewContainerRef} style={{ flex: 1, background: "#0a0807", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
        
        {/* Subtle grid background for the right pane */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
        
        {/* The Scaling A4 Paper */}
        <div style={{
          width: 595, height: 842, background: "#fff",
          transform: `scale(${previewScale})`, transformOrigin: "center center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          transition: "transform 0.2s ease-out"
        }}>
          <PreviewComponent sections={activeSections} />
        </div>
      </div>
      

    </main>
  )
}
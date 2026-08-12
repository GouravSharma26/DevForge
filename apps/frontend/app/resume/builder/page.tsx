"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { useResumeBuilder, useSaveResumeBuilder, useAIFillResume } from "@/hooks/useResumeBuilder"
import { useResumes, useUploadResume } from "@/hooks/useResume"
import type { Resume } from "@devforge/shared-types"
import { nanoid } from "nanoid"
import { ModernProfessional, CreativeMinimalist, ExecutiveProfile, TechInnovator } from "@/components/resume-templates"

const mono = "JetBrains Mono, monospace"

// ─── Default sections ─────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  {
    id: "personal", type: "personal", title: "Personal Info", enabled: true, removable: false,
    data: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
  },
  {
    id: "summary", type: "summary", title: "Professional Summary", enabled: true, removable: true,
    data: { text: "" },
  },
  {
    id: "experience", type: "experience", title: "Work Experience", enabled: true, removable: true,
    data: { items: [{ id: nanoid(6), company: "", position: "", startDate: "", endDate: "", current: false, location: "", bullets: [""] }] },
  },
  {
    id: "education", type: "education", title: "Education", enabled: true, removable: true,
    data: { items: [{ id: nanoid(6), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", location: "" }] },
  },
  {
    id: "skills", type: "skills", title: "Skills", enabled: true, removable: true,
    data: { items: [{ id: nanoid(6), category: "Programming Languages", skills: "" }] },
  },
  {
    id: "projects", type: "projects", title: "Projects", enabled: true, removable: true,
    data: { items: [{ id: nanoid(6), name: "", description: "", tech: "", link: "", github: "", bullets: [""] }] },
  },
  {
    id: "certifications", type: "certifications", title: "Certifications", enabled: false, removable: true,
    data: { items: [{ id: nanoid(6), name: "", issuer: "", date: "", link: "" }] },
  },
]

const AVAILABLE_SECTIONS = [
  { type: "certifications", title: "Certifications" },
  { type: "achievements",   title: "Achievements" },
  { type: "languages",      title: "Languages" },
  { type: "volunteer",      title: "Volunteer Work" },
  { type: "publications",   title: "Publications" },
]

const TEMPLATES = [
  { id: "modern", name: "Modern Professional", author: "DevForge", component: ModernProfessional },
  { id: "creative", name: "Creative Minimalist", author: "DevForge", component: CreativeMinimalist },
  { id: "executive", name: "Executive Profile", author: "DevForge", component: ExecutiveProfile, hasPhoto: true },
  { id: "innovator", name: "Tech Innovator", author: "DevForge", component: TechInnovator, hasPhoto: true }
]

// ─── Shared input style ───────────────────────────────────────────────────────
const inp = (focused = false): React.CSSProperties => ({
  width: "100%", padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
  border: `1px solid ${focused ? "rgba(234,88,12,0.6)" : "var(--border-subtle)"}`,
  background: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, fontFamily: mono,
  outline: "none", transition: "all 0.2s",
  boxShadow: focused ? "0 0 0 3px rgba(234,88,12,0.15)" : "none",
})

function Input({ value, onChange, placeholder, style = {} }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...inp(focused), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inp(focused), resize: "vertical" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// ─── Section editors ──────────────────────────────────────────────────────────

function PersonalEditor({ data, onChange }: any) {
  const fields = [
    { key: "name",       label: "Full Name",       placeholder: "Gourav Sharma" },
    { key: "title",      label: "Job Title",        placeholder: "Full Stack Developer" },
    { key: "email",      label: "Email",            placeholder: "gourav@example.com" },
    { key: "phone",      label: "Phone",            placeholder: "+91 98765 43210" },
    { key: "location",   label: "Location",         placeholder: "Chennai, India" },
    { key: "linkedin",   label: "LinkedIn",         placeholder: "linkedin.com/in/gourav" },
    { key: "github",     label: "GitHub",           placeholder: "github.com/gourav" },
    { key: "website",    label: "Website",          placeholder: "gourav.dev" },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {fields.map(f => (
        <div key={f.key}>
          <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
          <Input value={data[f.key]} onChange={(e: any) => onChange({ ...data, [f.key]: e.target.value })} placeholder={f.placeholder} />
        </div>
      ))}
    </div>
  )
}

function SummaryEditor({ data, onChange }: any) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Summary</label>
      <Textarea value={data.text} onChange={(e: any) => onChange({ text: e.target.value })} placeholder="A results-driven Full Stack Developer with 2+ years of experience..." rows={5} />
    </div>
  )
}

function ExperienceEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), company: "", position: "", startDate: "", endDate: "", current: false, location: "", bullets: [""] }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  function updateBullet(itemId: string, idx: number, val: string) {
    const item = data.items.find((i: any) => i.id === itemId)
    const bullets = [...item.bullets]
    bullets[idx] = val
    updateItem(itemId, "bullets", bullets)
  }
  function addBullet(itemId: string) {
    const item = data.items.find((i: any) => i.id === itemId)
    updateItem(itemId, "bullets", [...item.bullets, ""])
  }
  function removeBullet(itemId: string, idx: number) {
    const item = data.items.find((i: any) => i.id === itemId)
    updateItem(itemId, "bullets", item.bullets.filter((_: any, i: number) => i !== idx))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.items.map((item: any, idx: number) => (
        <div key={item.id} style={{ background: "var(--glass-bg)", borderRadius: 10, padding: 14, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#ea580c", fontFamily: mono }}>Experience #{idx + 1}</span>
            {data.items.length > 1 && (
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: mono }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Company</label>
              <Input value={item.company} onChange={(e: any) => updateItem(item.id, "company", e.target.value)} placeholder="Google" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Position</label>
              <Input value={item.position} onChange={(e: any) => updateItem(item.id, "position", e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Start Date</label>
              <Input value={item.startDate} onChange={(e: any) => updateItem(item.id, "startDate", e.target.value)} placeholder="Jun 2023" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>End Date</label>
              <Input value={item.current ? "Present" : item.endDate} onChange={(e: any) => updateItem(item.id, "endDate", e.target.value)} placeholder="Present" style={{ opacity: item.current ? 0.5 : 1 }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Location</label>
              <Input value={item.location} onChange={(e: any) => updateItem(item.id, "location", e.target.value)} placeholder="Mountain View, CA" />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={item.current} onChange={(e) => updateItem(item.id, "current", e.target.checked)} id={`current-${item.id}`} />
              <label htmlFor={`current-${item.id}`} style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: mono, cursor: "pointer" }}>Currently working here</label>
            </div>
          </div>
          {/* Bullets */}
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 6 }}>Bullet Points</label>
            {item.bullets.map((b: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <span style={{ color: "#ea580c", fontFamily: mono, fontSize: 12, marginTop: 8, flexShrink: 0 }}>•</span>
                <Input value={b} onChange={(e: any) => updateBullet(item.id, i, e.target.value)} placeholder="Engineered a feature that reduced load time by 40%" />
                {item.bullets.length > 1 && (
                  <button onClick={() => removeBullet(item.id, i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addBullet(item.id)} style={{ background: "none", border: "1px dashed var(--border-subtle)", borderRadius: 6, padding: "5px 12px", color: "var(--text-muted)", fontSize: 11, fontFamily: mono, cursor: "pointer", marginTop: 4 }}>
              + Add bullet
            </button>
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Experience
      </button>
    </div>
  )
}

function EducationEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", location: "" }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.items.map((item: any, idx: number) => (
        <div key={item.id} style={{ background: "var(--glass-bg)", borderRadius: 10, padding: 14, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#ea580c", fontFamily: mono }}>Education #{idx + 1}</span>
            {data.items.length > 1 && (
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: mono }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { key: "institution", label: "Institution", placeholder: "IIT Madras", col: "span 2" },
              { key: "degree",      label: "Degree",      placeholder: "B.Tech" },
              { key: "field",       label: "Field",       placeholder: "Computer Science" },
              { key: "startDate",   label: "Start Date",  placeholder: "2020" },
              { key: "endDate",     label: "End Date",    placeholder: "2024" },
              { key: "gpa",         label: "GPA / %",     placeholder: "8.5 / 10" },
              { key: "location",    label: "Location",    placeholder: "Chennai, India" },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.col || "auto" }}>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
                <Input value={item[f.key]} onChange={(e: any) => updateItem(item.id, f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Education
      </button>
    </div>
  )
}

function SkillsEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), category: "", skills: "" }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((item: any) => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Category</label>
            <Input value={item.category} onChange={(e: any) => updateItem(item.id, "category", e.target.value)} placeholder="Languages" />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Skills (comma-separated)</label>
            <Input value={item.skills} onChange={(e: any) => updateItem(item.id, "skills", e.target.value)} placeholder="Python, JavaScript, TypeScript" />
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ padding: "8px 10px", background: "none", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Skill Category
      </button>
    </div>
  )
}

function ProjectsEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), name: "", description: "", tech: "", link: "", github: "", bullets: [""] }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  function updateBullet(itemId: string, idx: number, val: string) {
    const item = data.items.find((i: any) => i.id === itemId)
    const bullets = [...item.bullets]; bullets[idx] = val
    updateItem(itemId, "bullets", bullets)
  }
  function addBullet(itemId: string) {
    const item = data.items.find((i: any) => i.id === itemId)
    updateItem(itemId, "bullets", [...item.bullets, ""])
  }
  function removeBullet(itemId: string, idx: number) {
    const item = data.items.find((i: any) => i.id === itemId)
    updateItem(itemId, "bullets", item.bullets.filter((_: any, i: number) => i !== idx))
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.items.map((item: any, idx: number) => (
        <div key={item.id} style={{ background: "var(--glass-bg)", borderRadius: 10, padding: 14, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#ea580c", fontFamily: mono }}>Project #{idx + 1}</span>
            {data.items.length > 1 && (
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: mono }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Project Name</label>
              <Input value={item.name} onChange={(e: any) => updateItem(item.id, "name", e.target.value)} placeholder="DevForge" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Tech Stack</label>
              <Input value={item.tech} onChange={(e: any) => updateItem(item.id, "tech", e.target.value)} placeholder="Next.js, Fastify, PostgreSQL" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Live Link</label>
              <Input value={item.link} onChange={(e: any) => updateItem(item.id, "link", e.target.value)} placeholder="devforge.vercel.app" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>GitHub</label>
              <Input value={item.github} onChange={(e: any) => updateItem(item.id, "github", e.target.value)} placeholder="github.com/gourav/devforge" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 6 }}>Bullet Points</label>
            {item.bullets.map((b: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <span style={{ color: "#ea580c", fontFamily: mono, fontSize: 12, marginTop: 8, flexShrink: 0 }}>•</span>
                <Input value={b} onChange={(e: any) => updateBullet(item.id, i, e.target.value)} placeholder="Built real-time PvP feature with Socket.io serving 100+ concurrent users" />
                {item.bullets.length > 1 && (
                  <button onClick={() => removeBullet(item.id, i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addBullet(item.id)} style={{ background: "none", border: "1px dashed var(--border-subtle)", borderRadius: 6, padding: "5px 12px", color: "var(--text-muted)", fontSize: 11, fontFamily: mono, cursor: "pointer", marginTop: 4 }}>
              + Add bullet
            </button>
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Project
      </button>
    </div>
  )
}

function CertificationsEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), name: "", issuer: "", date: "", link: "" }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((item: any) => (
        <div key={item.id} style={{ background: "var(--glass-bg)", borderRadius: 10, padding: 12, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { key: "name",   label: "Certification Name", placeholder: "AWS Solutions Architect", col: "span 2" },
              { key: "issuer", label: "Issuer",             placeholder: "Amazon Web Services" },
              { key: "date",   label: "Date",               placeholder: "Dec 2024" },
              { key: "link",   label: "Credential URL",     placeholder: "credly.com/...", col: "span 2" },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.col || "auto" }}>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
                <Input value={item[f.key]} onChange={(e: any) => updateItem(item.id, f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: mono, textAlign: "left" }}>✕ Remove</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Certification
      </button>
    </div>
  )
}

function CustomEditor({ data, onChange }: any) {
  function updateItem(id: string, field: string, val: any) {
    onChange({ items: data.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item) })
  }
  function addItem() {
    onChange({ items: [...data.items, { id: nanoid(6), title: "", subtitle: "", date: "", description: "" }] })
  }
  function removeItem(id: string) {
    onChange({ items: data.items.filter((i: any) => i.id !== id) })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.items.map((item: any) => (
        <div key={item.id} style={{ background: "var(--glass-bg)", borderRadius: 10, padding: 12, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Title</label>
              <Input value={item.title} onChange={(e: any) => updateItem(item.id, "title", e.target.value)} placeholder="Achievement title" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Subtitle</label>
              <Input value={item.subtitle} onChange={(e: any) => updateItem(item.id, "subtitle", e.target.value)} placeholder="Organisation" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Date</label>
              <Input value={item.date} onChange={(e: any) => updateItem(item.id, "date", e.target.value)} placeholder="2024" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: mono, display: "block", marginBottom: 4 }}>Description</label>
              <Textarea value={item.description} onChange={(e: any) => updateItem(item.id, "description", e.target.value)} placeholder="Describe this achievement..." rows={2} />
            </div>
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: mono, textAlign: "left" }}>✕ Remove</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed rgba(234,88,12,0.4)", background: "rgba(234,88,12,0.08)", color: "#ea580c", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
        + Add Item
      </button>
    </div>
  )
}

// ─── Resume Preview ───────────────────────────────────────────────────────────
function ResumePreview({ sections }: { sections: any[] }) {
  const enabled   = sections.filter(s => s.enabled)
  const personal  = enabled.find(s => s.type === "personal")?.data
  const summary   = enabled.find(s => s.type === "summary")?.data
  const exp       = enabled.find(s => s.type === "experience")?.data
  const edu       = enabled.find(s => s.type === "education")?.data
  const skills    = enabled.find(s => s.type === "skills")?.data
  const projects  = enabled.find(s => s.type === "projects")?.data
  const certs     = enabled.find(s => s.type === "certifications")?.data
  const customs   = enabled.filter(s => !["personal","summary","experience","education","skills","projects","certifications"].includes(s.type))

  const h2: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase",
    letterSpacing: 1.5, borderBottom: "2px solid #ea580c", paddingBottom: 4,
    marginBottom: 10, marginTop: 0,
  }
  const h3: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: "#1a1a2e", margin: "0 0 2px",
  }
  const p: React.CSSProperties = {
    fontSize: 11, color: "#444", lineHeight: 1.6, margin: "0 0 4px",
  }
  const small: React.CSSProperties = {
    fontSize: 10, color: "#888",
  }

  return (
    <div id="resume-preview" style={{
      background: "#fff", width: "100%", minHeight: "297mm",
      fontFamily: "Georgia, serif", color: "#1a1a2e",
      padding: "24px 28px", boxSizing: "border-box",
      boxShadow: "0 4px 40px rgba(0,0,0,0.3)",
      borderRadius: 4,
    }}>
      {/* Header */}
      {personal && (
        <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "1px solid #e0e0e0", paddingBottom: 12 }}>
          {personal.name && <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#1a1a2e", fontFamily: "Georgia, serif" }}>{personal.name}</h1>}
          {personal.title && <p style={{ fontSize: 13, color: "#ea580c", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>{personal.title}</p>}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px 16px", fontSize: 10, color: "#555" }}>
            {personal.email && (
              <a href={`mailto:${personal.email}`} style={{ color: "#555", textDecoration: "none" }}>
                ✉ {personal.email}
              </a>
            )}
            {personal.phone && <span>📞 {personal.phone}</span>}
            {personal.location && <span>📍 {personal.location}</span>}
            {personal.linkedin && (() => {
              const raw  = personal.linkedin.replace(/^https?:\/\//, "").replace(/\/$/, "")
              const href = `https://${raw}`
              // Extract username: linkedin.com/in/username → username
              const username = raw.split("/in/")[1] || raw.split("/").pop() || raw
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c", textDecoration: "none" }}>
                  🔗 {username}
                </a>
              )
            })()}
            {personal.github && (() => {
              const raw      = personal.github.replace(/^https?:\/\//, "").replace(/\/$/, "")
              const href     = `https://${raw}`
              // Extract username: github.com/username → username
              const username = raw.replace(/^github\.com\//, "").split("/")[0] || raw
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "none" }}>
                  ⌨ {username}
                </a>
              )
            })()}
            {personal.website && (() => {
              const raw  = personal.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
              const href = `https://${raw}`
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "none" }}>
                  🌐 {raw}
                </a>
              )
            })()}
          </div>
        </div>
      )}

      {/* Summary */}
      {summary?.text && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Summary</h2>
          <p style={{ ...p, lineHeight: 1.7 }}>{summary.text}</p>
        </div>
      )}

      {/* Experience */}
      {exp?.items?.some((i: any) => i.company || i.position) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Experience</h2>
          {exp.items.filter((i: any) => i.company || i.position).map((item: any) => (
            <div key={item.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  {item.position && <h3 style={h3}>{item.position}</h3>}
                  {item.company && <p style={{ ...p, color: "#ea580c", margin: "0 0 2px", fontWeight: 600 }}>{item.company}{item.location && ` · ${item.location}`}</p>}
                </div>
                <span style={small}>{item.startDate}{item.startDate && (item.endDate || item.current) ? " – " : ""}{item.current ? "Present" : item.endDate}</span>
              </div>
              {item.bullets?.filter((b: string) => b).length > 0 && (
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {item.bullets.filter((b: string) => b).map((b: string, i: number) => (
                    <li key={i} style={{ ...p, marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects?.items?.some((i: any) => i.name) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Projects</h2>
          {projects.items.filter((i: any) => i.name).map((item: any) => (
            <div key={item.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={h3}>
                    {item.name}
                    {item.link && (
                      <a
                        href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                        target="_blank" rel="noopener noreferrer"
                        title={item.link}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 16, height: 16, borderRadius: 3, marginLeft: 6,
                          background: "rgba(234,88,12,0.1)", color: "#ea580c",
                          fontSize: 9, textDecoration: "none", fontWeight: 700,
                          border: "1px solid rgba(234,88,12,0.25)", flexShrink: 0,
                        }}
                      >
                        ↗
                      </a>
                    )}
                    {item.github && (
                      <a
                        href={item.github.startsWith("http") ? item.github : `https://${item.github}`}
                        target="_blank" rel="noopener noreferrer"
                        title={item.github}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 16, height: 16, borderRadius: 3, marginLeft: 4,
                          background: "#88888820", color: "#555",
                          fontSize: 9, textDecoration: "none", fontWeight: 700,
                          border: "1px solid #88888840", flexShrink: 0,
                        }}
                      >
                        ⌨
                      </a>
                    )}
                  </h3>
                  {item.tech && <p style={{ ...p, color: "#ea580c", margin: "0 0 2px", fontSize: 10 }}>{item.tech}</p>}
                </div>
              </div>
              {item.bullets?.filter((b: string) => b).length > 0 && (
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {item.bullets.filter((b: string) => b).map((b: string, i: number) => (
                    <li key={i} style={{ ...p, marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {edu?.items?.some((i: any) => i.institution) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Education</h2>
          {edu.items.filter((i: any) => i.institution).map((item: any) => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={h3}>{item.institution}</h3>
                  <p style={{ ...p, margin: "0 0 2px" }}>
                    {[item.degree, item.field].filter(Boolean).join(" in ")}
                    {item.gpa && <span style={{ color: "#ea580c" }}> · {item.gpa}</span>}
                  </p>
                </div>
                <span style={small}>{item.startDate}{item.startDate && item.endDate ? " – " : ""}{item.endDate}{item.location && ` · ${item.location}`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills?.items?.some((i: any) => i.skills || i.category) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Skills</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {skills.items.filter((i: any) => i.skills || i.category).map((item: any) => (
              <p key={item.id} style={{ ...p, margin: 0 }}>
                {item.category && <strong style={{ color: "#1a1a2e" }}>{item.category}: </strong>}
                {item.skills}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certs?.items?.some((i: any) => i.name) && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={h2}>Certifications</h2>
          {certs.items.filter((i: any) => i.name).map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{item.name}</span>
                {item.issuer && <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>· {item.issuer}</span>}
              </div>
              <span style={small}>{item.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom sections */}
      {customs.map(section => (
        <div key={section.id} style={{ marginBottom: 14 }}>
          <h2 style={h2}>{section.title}</h2>
          {section.data?.items?.map((item: any) => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {item.title && <h3 style={h3}>{item.title}</h3>}
                {item.date && <span style={small}>{item.date}</span>}
              </div>
              {item.subtitle && <p style={{ ...p, color: "#ea580c", margin: "0 0 2px" }}>{item.subtitle}</p>}
              {item.description && <p style={p}>{item.description}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const router    = useRouter()
  const searchParams = useSearchParams()
  const token     = useAuthStore((s) => s.token)
  const hydrated  = useAuthStore((s) => s.hydrated)
  const { data: saved, isLoading } = useResumeBuilder()
  const { data: resumes }          = useResumes()
  const saveBuilder = useSaveResumeBuilder()
  const aiFill      = useAIFillResume()
  const upload      = useUploadResume()

  const fileRef = useRef<HTMLInputElement>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get("template") || "modern")

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [sections, setSections]             = useState<any[]>(DEFAULT_SECTIONS)
  const [activeSection, setActiveSection]   = useState<string>("personal")
  const [activeTab, setActiveTab]           = useState<string>("Core Sections")
  const [showAddPanel, setShowAddPanel]     = useState(false)
  const [customName, setCustomName]         = useState("")
  const [saved_, setSaved_]                 = useState(false)
  const [aiError, setAiError]               = useState<string | null>(null)
  
  // New layout state
  const [zoom, setZoom] = useState(0.7)
  const [autoscale, setAutoscale] = useState(true)

  const previewRef = useRef<HTMLDivElement>(null)
  const rightPaneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Load saved data
  useEffect(() => {
    if (saved?.sections) setSections(saved.sections)
  }, [saved])

  // Handle auto-fill from query params
  useEffect(() => {
    const autoFillId = searchParams.get("autoFillId")
    if (autoFillId && !aiFill.isPending) {
      aiFill.mutateAsync({ sections: DEFAULT_SECTIONS, resumeId: autoFillId }).then(parsed => {
        if (Array.isArray(parsed)) {
          setSections(parsed)
          saveBuilder.mutate({ sections: parsed, template: selectedTemplate })
        }
      }).catch(err => setAiError("Failed to autofill from URL"))
      // Clean up the URL so it doesn't run again on refresh
      router.replace("/resume/builder")
    }
  }, [searchParams])

  // Autoscale effect
  useEffect(() => {
    if (!autoscale || !rightPaneRef.current) return
    const handleResize = () => {
      const width = rightPaneRef.current?.clientWidth || 800
      // Standard A4 width is ~794px in our preview
      // Leave some padding
      const newZoom = Math.min((width - 60) / 794, 1.2)
      setZoom(newZoom)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [autoscale])

  function updateSectionData(id: string, data: any) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data } : s))
  }

  function toggleSection(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id))
    if (activeSection === id) setActiveSection("personal")
  }

  function addAvailableSection(type: string, title: string) {
    const existing = sections.find(s => s.id === type)
    if (existing) {
      setSections(prev => prev.map(s => s.id === type ? { ...s, enabled: true } : s))
      setActiveSection(type)
    } else {
      const newSection = {
        id: type, type, title, enabled: true, removable: true,
        data: { items: [{ id: nanoid(6), title: "", subtitle: "", date: "", description: "" }] },
      }
      setSections(prev => [...prev, newSection])
      setActiveSection(type)
    }
    setShowAddPanel(false)
  }

  function addCustomSection() {
    if (!customName.trim()) return
    const id = nanoid(6)
    const newSection = {
      id, type: "custom", title: customName.trim(), enabled: true, removable: true,
      data: { items: [{ id: nanoid(6), title: "", subtitle: "", date: "", description: "" }] },
    }
    setSections(prev => [...prev, newSection])
    setActiveSection(id)
    setCustomName("")
    setShowAddPanel(false)
  }

  async function handleSave() {
    await saveBuilder.mutateAsync({ sections, template: selectedTemplate })
    setSaved_(true)
    setTimeout(() => setSaved_(false), 2000)
  }

  async function handleAIFill() {
    setAiError(null)
    try {
      const filled = await aiFill.mutateAsync({ sections, resumeId: selectedResumeId || undefined })
      if (Array.isArray(filled)) setSections(filled)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to generate AI content"
      setAiError(msg)
    }
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") return alert("Please upload a PDF file")
    try {
      const newResume = await upload.mutateAsync({ file, skipAI: false })
      setSelectedResumeId(newResume.id)
      
      const parsed = await aiFill.mutateAsync({ sections: DEFAULT_SECTIONS, resumeId: newResume.id })
      if (Array.isArray(parsed)) {
        setSections(parsed)
        saveBuilder.mutate({ sections: parsed, template: selectedTemplate })
      }
    } catch (e: any) {
      console.error("Failed to parse resume", e)
      const msg = e?.response?.data?.error || "Failed to process resume automatically."
      alert(msg)
    } finally {
      setShowUploadModal(false)
    }
  }

  function handleExportPDF() {
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #print-resume { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 99999; }
      }
      @page { margin: 0; size: A4; }
    `
    document.head.appendChild(style)
    const div = document.createElement("div")
    div.id = "print-resume"
    div.style.display = "none"
    div.innerHTML = document.getElementById("resume-preview")?.innerHTML || ""
    document.body.appendChild(div)
    window.print()
    setTimeout(() => {
      document.body.removeChild(div)
      document.head.removeChild(style)
    }, 1000)
  }

  const calculateCompletion = () => {
    let score = 0
    sections.forEach(s => {
      if (!s.enabled) return
      if (s.type === 'personal' && s.data.name) score += 15
      if (s.type === 'summary' && s.data.text?.length > 10) score += 15
      if (s.type === 'experience' && s.data.items[0]?.company) score += 25
      if (s.type === 'education' && s.data.items[0]?.institution) score += 20
      if (s.type === 'skills' && s.data.items[0]?.skills) score += 10
      if (s.type === 'projects' && s.data.items[0]?.name) score += 15
    })
    return Math.min(100, score)
  }

  const activeS = sections.find(s => s.id === activeSection)
  const completionScore = calculateCompletion()

  if (!hydrated || !token) return null
  if (isLoading) return (
    <div className="bg-base">
      <p style={{ color: "var(--text-muted)", fontFamily: mono }}>Loading builder...</p>
    </div>
  )

  const TABS = ["Core Sections", "More Sections", "Customize", "Templates"]
  const coreSectionTypes = ["personal", "summary", "experience", "education", "projects", "skills"]
  const activeSectionObj = sections.find(s => s.id === activeSection)

  return (
    <div className="bg-base">
      
      {/* ── Top Bar ── */}
      <div style={{
        height: 60, flexShrink: 0, borderBottom: "1px solid var(--border-subtle)",
        background: "#110d0c", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 24px", zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
          </button>
          
          {/* Autofill & Score Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: "8px 16px", borderRadius: 12, border: "1px dashed rgba(255,180,120,0.4)",
                background: "rgba(var(--glass-bg-rgb),0.02)", color: "var(--text-muted)", fontSize: 12,
                fontFamily: mono, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8
              }}
            >
              📄 Autofill existing resume
            </button>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            
            <button
              onClick={() => alert("Coming soon!")}
              style={{
                padding: "8px 16px", borderRadius: 12,
                background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.4)",
                color: "#ea580c", fontSize: 12,
                fontFamily: mono, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8
              }}
            >
              🎯 Check Resume Score
            </button>
          </div>
          
          {aiError && <span style={{ color: "#ef4444", fontSize: 11 }}>⚠️ {aiError}</span>}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {/* Zoom Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)", fontFamily: mono }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={autoscale} onChange={e => setAutoscale(e.target.checked)} style={{ accentColor: "#ea580c" }} />
              Autoscale
            </label>
            <input 
              type="range" min="0.3" max="1.5" step="0.05" 
              value={zoom} 
              onChange={e => { setAutoscale(false); setZoom(parseFloat(e.target.value)) }} 
              style={{ width: 100, accentColor: "#ea580c" }} 
            />
            <span style={{ width: 36 }}>{Math.round(zoom * 100)}%</span>
          </div>
          
          <div style={{ width: 1, height: 20, background: "var(--border-subtle)" }} />

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saveBuilder.isPending} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: saved_ ? "#10b98120" : "transparent", color: saved_ ? "#10b981" : "var(--text-primary)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
              {saved_ ? "✓ Saved" : "Save"}
            </button>
            <button onClick={handleExportPDF} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--text-primary)", color: "#171210", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* ── Left Sidebar (Tabs) ── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border-subtle)", background: "#140f0e", display: "flex", flexDirection: "column", padding: "16px 12px" }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                // If clicking Core Sections, auto-select Personal
                if (tab === "Core Sections" && !coreSectionTypes.includes(activeSectionObj?.type || "")) setActiveSection("personal")
              }}
              style={{
                padding: "10px 14px", borderRadius: 8, border: "none",
                background: activeTab === tab ? "rgba(234,88,12,0.15)" : "transparent",
                color: activeTab === tab ? "#ea580c" : "var(--text-muted)",
                fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4
              }}
            >
              {tab === "Core Sections" && "📝"}
              {tab === "More Sections" && "➕"}
              {tab === "Customize" && "🎨"}
              {tab === "Templates" && "📄"}
              {tab}
            </button>
          ))}

          {/* Sub-navigation for sections (Pills) */}
          {(activeTab === "Core Sections" || activeTab === "More Sections") && (
            <div style={{ marginTop: 12, marginLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {sections
                .filter(s => activeTab === "Core Sections" ? coreSectionTypes.includes(s.type) : !coreSectionTypes.includes(s.type))
                .map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 99,
                    background: activeSection === s.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: activeSection === s.id ? "var(--text-primary)" : "var(--text-muted)",
                    fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}
                >
                  {s.title}
                  {!s.enabled && <span style={{ opacity: 0.5 }}>Hidden</span>}
                </div>
              ))}
              
              {/* Add Custom Section Button */}
              {activeTab === "More Sections" && (
                <button
                  onClick={() => setShowAddPanel(!showAddPanel)}
                  style={{ marginTop: 8, padding: "6px 12px", borderRadius: 99, border: "1px dashed rgba(255,180,120,0.3)", background: "transparent", color: "#ea580c", fontSize: 12, cursor: "pointer", textAlign: "left" }}
                >
                  + Add Custom Section
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Middle Pane (Form Editor) ── */}
        <div style={{ width: 450, flexShrink: 0, borderRight: "1px solid var(--border-subtle)", background: "var(--bg-base)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          {/* Editor Content */}
          {activeTab === "Core Sections" || activeTab === "More Sections" ? (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {activeS && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                      {activeS.title}
                    </h2>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button
                        onClick={() => toggleSection(activeS.id)}
                        style={{ background: "none", border: "none", color: activeS.enabled ? "#10b981" : "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
                      >
                        {activeS.enabled ? "✅ Enabled" : "❌ Disabled"}
                      </button>
                      <button onClick={() => {
                        // Reset logic: just clear data based on type
                        if (confirm("Reset this section?")) updateSectionData(activeS.id, DEFAULT_SECTIONS.find(d => d.type === activeS.type)?.data || { items: [] })
                      }} style={{ padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(255,180,120,0.2)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Render the specific editor form */}
                  {activeS.type === "personal"       && <PersonalEditor       data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "summary"         && <SummaryEditor        data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "experience"      && <ExperienceEditor     data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "education"       && <EducationEditor      data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "skills"          && <SkillsEditor         data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "projects"        && <ProjectsEditor       data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {activeS.type === "certifications"  && <CertificationsEditor data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                  {!coreSectionTypes.includes(activeS.type) && activeS.type !== "certifications" && (
                    <CustomEditor data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />
                  )}
                </>
              )}

              {/* Add Custom Section Panel overlay */}
              {showAddPanel && (
                <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", marginTop: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add New Section</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {AVAILABLE_SECTIONS.map(s => (
                      <button key={s.type} onClick={() => addAvailableSection(s.type, s.title)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-primary)", fontSize: 12, textAlign: "left", cursor: "pointer" }}>
                        + {s.title}
                      </button>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Custom name..." style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(234,88,12,0.4)", background: "#0a0807", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
                      <button onClick={addCustomSection} style={{ padding: "0 16px", borderRadius: 8, border: "none", background: "#ea580c", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "Templates" ? (
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Choose Template</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {TEMPLATES.map(t => {
                  const isSelected = selectedTemplate === t.id
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTemplate(t.id)} 
                      style={{ border: isSelected ? "2px solid #ea580c" : "1px solid rgba(255,180,120,0.2)", borderRadius: 12, padding: 4, cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <div style={{ aspectRatio: "794/1123", background: "#fff", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                         <div style={{ position: "absolute", top: 0, left: 0, width: "794px", height: "1123px", transform: "scale(0.243)", transformOrigin: "top left", pointerEvents: "none" }}>
                            <t.component sections={sections.length > 0 ? sections : DEFAULT_SECTIONS} />
                         </div>
                      </div>
                      <p style={{ textAlign: "center", fontSize: 11, fontWeight: isSelected ? 600 : 500, marginTop: 8, color: isSelected ? "#ea580c" : "var(--text-muted)" }}>{t.name}</p>
                    </div>
                  )
                })}

                <button style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 8, border: "1px dashed rgba(234,88,12,0.5)", background: "rgba(234,88,12,0.05)", color: "#ea580c", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                   🎨 Import from Canva
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24 }}>
               <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Customize</h2>
               <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Custom fonts, spacing, and accent colors coming soon!</p>
            </div>
          )}
        </div>

        {/* ── Right Pane (Live Preview A4) ── */}
        <div ref={rightPaneRef} style={{ flex: 1, background: "#1f1a18", overflowY: "auto", position: "relative" }}>
          <div style={{ 
            minHeight: "100%", padding: "40px 0", 
            display: "flex", justifyContent: "center", alignItems: "flex-start" 
          }}>
            <div style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: "top center", 
              transition: autoscale ? "none" : "transform 0.2s" 
            }}>
              <div ref={previewRef} style={{ 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", 
                background: "#fff",
                // A4 sizing approx 210mm x 297mm 
              }}>
                {(() => {
                  const PreviewComponent = TEMPLATES.find(t => t.id === selectedTemplate)?.component || ModernProfessional
                  return <PreviewComponent sections={sections} />
                })()}
              </div>
            </div>
          </div>

          {/* Floating Completion Pill */}
          <div style={{
            position: "fixed", bottom: 32, right: 32,
            background: "rgba(10, 8, 7, 0.8)", backdropFilter: "blur(12px)",
            border: "1px solid var(--border-subtle)", borderRadius: 99,
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)", zIndex: 50
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Completion</div>
            <div style={{ width: 100, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${completionScore}%`, height: "100%", background: completionScore > 80 ? "#10b981" : "#ea580c", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", minWidth: 32 }}>{completionScore}%</div>
          </div>
        </div>
      </div>
      
      {/* ── Modal Overlay ── */}
      {showUploadModal && (
         <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999
         }}>
            <div className="bg-base">
               <button 
                  onClick={() => setShowUploadModal(false)}
                  style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)", fontFamily: mono }}
               >
                  ✕
               </button>
               
               <div style={{
                  border: "2px dashed rgba(234,88,12,0.4)", borderRadius: 16, padding: "40px 20px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  background: "rgba(var(--glass-bg-rgb),0.02)"
               }}>
                  <div style={{ fontSize: 48 }}>📄</div>
                  <h2 style={{ fontSize: 18, color: "var(--text-primary)", margin: 0, fontWeight: 600, fontFamily: mono }}>
                     Browse a pdf file or drop it here
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: mono }}>
                     🔒 File data is securely parsed directly into your builder session
                  </p>
                  
                  <button
                     onClick={() => fileRef.current?.click()}
                     disabled={upload.isPending || aiFill.isPending}
                     style={{
                        padding: "10px 24px", borderRadius: 12, border: "1px solid rgba(234,88,12,0.4)",
                        background: "rgba(234,88,12,0.15)",
                        color: "#ea580c", fontSize: 12,
                        fontFamily: mono, cursor: "pointer", fontWeight: 600, marginTop: 12
                     }}
                  >
                     {upload.isPending ? "Uploading..." : aiFill.isPending ? "Parsing with AI ✨..." : "Browse file"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}
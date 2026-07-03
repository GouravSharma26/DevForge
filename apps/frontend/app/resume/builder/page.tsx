"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { useResumeBuilder, useSaveResumeBuilder, useAIFillResume } from "@/hooks/useResumeBuilder"
import { nanoid } from "nanoid"

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

// ─── Shared input style ───────────────────────────────────────────────────────
const inp = (focused = false): React.CSSProperties => ({
  width: "100%", padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
  border: `1px solid ${focused ? "#7c3aed60" : "#1f1f45"}`,
  background: "#0d0d1a", color: "#f1f0ff", fontSize: 12, fontFamily: mono,
  outline: "none", transition: "all 0.2s",
  boxShadow: focused ? "0 0 0 3px #7c3aed15" : "none",
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
          <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
          <Input value={data[f.key]} onChange={(e: any) => onChange({ ...data, [f.key]: e.target.value })} placeholder={f.placeholder} />
        </div>
      ))}
    </div>
  )
}

function SummaryEditor({ data, onChange }: any) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Summary</label>
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
        <div key={item.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: 14, border: "1px solid #1f1f45", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: mono }}>Experience #{idx + 1}</span>
            {data.items.length > 1 && (
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: mono }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Company</label>
              <Input value={item.company} onChange={(e: any) => updateItem(item.id, "company", e.target.value)} placeholder="Google" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Position</label>
              <Input value={item.position} onChange={(e: any) => updateItem(item.id, "position", e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Start Date</label>
              <Input value={item.startDate} onChange={(e: any) => updateItem(item.id, "startDate", e.target.value)} placeholder="Jun 2023" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>End Date</label>
              <Input value={item.current ? "Present" : item.endDate} onChange={(e: any) => updateItem(item.id, "endDate", e.target.value)} placeholder="Present" style={{ opacity: item.current ? 0.5 : 1 }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Location</label>
              <Input value={item.location} onChange={(e: any) => updateItem(item.id, "location", e.target.value)} placeholder="Mountain View, CA" />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={item.current} onChange={(e) => updateItem(item.id, "current", e.target.checked)} id={`current-${item.id}`} />
              <label htmlFor={`current-${item.id}`} style={{ fontSize: 11, color: "#a09dc0", fontFamily: mono, cursor: "pointer" }}>Currently working here</label>
            </div>
          </div>
          {/* Bullets */}
          <div>
            <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 6 }}>Bullet Points</label>
            {item.bullets.map((b: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <span style={{ color: "#7c3aed", fontFamily: mono, fontSize: 12, marginTop: 8, flexShrink: 0 }}>•</span>
                <Input value={b} onChange={(e: any) => updateBullet(item.id, i, e.target.value)} placeholder="Engineered a feature that reduced load time by 40%" />
                {item.bullets.length > 1 && (
                  <button onClick={() => removeBullet(item.id, i)} style={{ background: "none", border: "none", color: "#5a5780", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addBullet(item.id)} style={{ background: "none", border: "1px dashed #2a2a5a", borderRadius: 6, padding: "5px 12px", color: "#5a5780", fontSize: 11, fontFamily: mono, cursor: "pointer", marginTop: 4 }}>
              + Add bullet
            </button>
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
        <div key={item.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: 14, border: "1px solid #1f1f45", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: mono }}>Education #{idx + 1}</span>
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
                <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
                <Input value={item[f.key]} onChange={(e: any) => updateItem(item.id, f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
            <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Category</label>
            <Input value={item.category} onChange={(e: any) => updateItem(item.id, "category", e.target.value)} placeholder="Languages" />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Skills (comma-separated)</label>
            <Input value={item.skills} onChange={(e: any) => updateItem(item.id, "skills", e.target.value)} placeholder="Python, JavaScript, TypeScript" />
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ padding: "8px 10px", background: "none", border: "1px solid #ef444430", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
        <div key={item.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: 14, border: "1px solid #1f1f45", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: mono }}>Project #{idx + 1}</span>
            {data.items.length > 1 && (
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: mono }}>✕ Remove</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Project Name</label>
              <Input value={item.name} onChange={(e: any) => updateItem(item.id, "name", e.target.value)} placeholder="DevForge" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Tech Stack</label>
              <Input value={item.tech} onChange={(e: any) => updateItem(item.id, "tech", e.target.value)} placeholder="Next.js, Fastify, PostgreSQL" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Live Link</label>
              <Input value={item.link} onChange={(e: any) => updateItem(item.id, "link", e.target.value)} placeholder="devforge.vercel.app" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>GitHub</label>
              <Input value={item.github} onChange={(e: any) => updateItem(item.id, "github", e.target.value)} placeholder="github.com/gourav/devforge" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 6 }}>Bullet Points</label>
            {item.bullets.map((b: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <span style={{ color: "#7c3aed", fontFamily: mono, fontSize: 12, marginTop: 8, flexShrink: 0 }}>•</span>
                <Input value={b} onChange={(e: any) => updateBullet(item.id, i, e.target.value)} placeholder="Built real-time PvP feature with Socket.io serving 100+ concurrent users" />
                {item.bullets.length > 1 && (
                  <button onClick={() => removeBullet(item.id, i)} style={{ background: "none", border: "none", color: "#5a5780", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addBullet(item.id)} style={{ background: "none", border: "1px dashed #2a2a5a", borderRadius: 6, padding: "5px 12px", color: "#5a5780", fontSize: 11, fontFamily: mono, cursor: "pointer", marginTop: 4 }}>
              + Add bullet
            </button>
          </div>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
        <div key={item.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: 12, border: "1px solid #1f1f45", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { key: "name",   label: "Certification Name", placeholder: "AWS Solutions Architect", col: "span 2" },
              { key: "issuer", label: "Issuer",             placeholder: "Amazon Web Services" },
              { key: "date",   label: "Date",               placeholder: "Dec 2024" },
              { key: "link",   label: "Credential URL",     placeholder: "credly.com/...", col: "span 2" },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.col || "auto" }}>
                <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>{f.label}</label>
                <Input value={item[f.key]} onChange={(e: any) => updateItem(item.id, f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: mono, textAlign: "left" }}>✕ Remove</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
        <div key={item.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: 12, border: "1px solid #1f1f45", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Title</label>
              <Input value={item.title} onChange={(e: any) => updateItem(item.id, "title", e.target.value)} placeholder="Achievement title" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Subtitle</label>
              <Input value={item.subtitle} onChange={(e: any) => updateItem(item.id, "subtitle", e.target.value)} placeholder="Organisation" />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Date</label>
              <Input value={item.date} onChange={(e: any) => updateItem(item.id, "date", e.target.value)} placeholder="2024" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, color: "#5a5780", fontFamily: mono, display: "block", marginBottom: 4 }}>Description</label>
              <Textarea value={item.description} onChange={(e: any) => updateItem(item.id, "description", e.target.value)} placeholder="Describe this achievement..." rows={2} />
            </div>
          </div>
          {data.items.length > 1 && (
            <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: mono, textAlign: "left" }}>✕ Remove</button>
          )}
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "10px", borderRadius: 10, border: "1px dashed #7c3aed40", background: "#7c3aed08", color: "#a855f7", fontSize: 12, fontFamily: mono, cursor: "pointer" }}>
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
    letterSpacing: 1.5, borderBottom: "2px solid #7c3aed", paddingBottom: 4,
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
          {personal.title && <p style={{ fontSize: 13, color: "#7c3aed", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>{personal.title}</p>}
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
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed", textDecoration: "none" }}>
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
                  {item.company && <p style={{ ...p, color: "#7c3aed", margin: "0 0 2px", fontWeight: 600 }}>{item.company}{item.location && ` · ${item.location}`}</p>}
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
                          background: "#7c3aed20", color: "#7c3aed",
                          fontSize: 9, textDecoration: "none", fontWeight: 700,
                          border: "1px solid #7c3aed40", flexShrink: 0,
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
                  {item.tech && <p style={{ ...p, color: "#7c3aed", margin: "0 0 2px", fontSize: 10 }}>{item.tech}</p>}
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
                    {item.gpa && <span style={{ color: "#7c3aed" }}> · {item.gpa}</span>}
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
              {item.subtitle && <p style={{ ...p, color: "#7c3aed", margin: "0 0 2px" }}>{item.subtitle}</p>}
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
  const token     = useAuthStore((s) => s.token)
  const hydrated  = useAuthStore((s) => s.hydrated)
  const { data: saved, isLoading } = useResumeBuilder()
  const saveBuilder = useSaveResumeBuilder()
  const aiFill      = useAIFillResume()

  const [sections, setSections]             = useState<any[]>(DEFAULT_SECTIONS)
  const [activeSection, setActiveSection]   = useState<string>("personal")
  const [showAddPanel, setShowAddPanel]     = useState(false)
  const [customName, setCustomName]         = useState("")
  const [saved_, setSaved_]                 = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  // Load saved data
  useEffect(() => {
    if (saved?.sections) setSections(saved.sections)
  }, [saved])

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
    await saveBuilder.mutateAsync({ sections, template: "modern" })
    setSaved_(true)
    setTimeout(() => setSaved_(false), 2000)
  }

  async function handleAIFill() {
    const filled = await aiFill.mutateAsync(sections)
    if (Array.isArray(filled)) setSections(filled)
  }

  function handleExportPDF() {
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #print-resume { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; }
      }
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

  const activeS = sections.find(s => s.id === activeSection)

  if (!hydrated || !token) return null

  if (isLoading) return (
    <div style={{ background: "#0d0d1a", minHeight: "calc(100vh-56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5a5780", fontFamily: mono }}>Loading builder...</p>
    </div>
  )

  return (
    <div style={{ background: "#0d0d1a", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0, borderBottom: "1px solid #1f1f45",
        background: "#12122b", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/resume")}
            style={{ background: "#1c1c45", border: "1px solid #2a2a5a", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#a09dc0", fontSize: 11, fontFamily: mono }}
          >
            ← Resume
          </button>
          <div style={{ width: 1, height: 20, background: "#1f1f45" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f0ff", fontFamily: mono }}>Resume Builder</span>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: "#7c3aed15", color: "#a855f7", border: "1px solid #7c3aed30", fontFamily: mono }}>
            Live Preview
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* AI Fill */}
          <button
            onClick={handleAIFill}
            disabled={aiFill.isPending}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid #7c3aed40",
              background: "#7c3aed15", color: aiFill.isPending ? "#5a5780" : "#a855f7",
              fontSize: 12, fontFamily: mono, cursor: aiFill.isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {aiFill.isPending ? "✨ Generating..." : "✨ AI Fill"}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveBuilder.isPending}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid #2a2a5a",
              background: saved_ ? "#10b98120" : "#1c1c45",
              color: saved_ ? "#10b981" : "#a09dc0",
              fontSize: 12, fontFamily: mono, cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {saved_ ? "✓ Saved" : saveBuilder.isPending ? "Saving..." : "Save"}
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "#fff", fontSize: 12, fontFamily: mono, cursor: "pointer",
              boxShadow: "0 2px 12px #7c3aed30",
            }}
          >
            ↓ Export PDF
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Section Manager + Editor ── */}
        <div style={{ width: "46%", borderRight: "1px solid #1f1f45", display: "flex", overflow: "hidden" }}>

          {/* Section list */}
          <div style={{
            width: 200, flexShrink: 0, borderRight: "1px solid #1f1f45",
            background: "#0a0a14", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #1f1f45" }}>
              <p style={{ fontSize: 10, color: "#3a3760", fontFamily: mono, textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>Sections</p>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {sections.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", cursor: "pointer", transition: "all 0.15s",
                    background: activeSection === s.id ? "#7c3aed15" : "transparent",
                    borderLeft: `2px solid ${activeSection === s.id ? "#7c3aed" : "transparent"}`,
                    opacity: s.enabled ? 1 : 0.4,
                  }}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span style={{ flex: 1, fontSize: 12, color: activeSection === s.id ? "#a855f7" : "#a09dc0", fontFamily: mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </span>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {/* Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSection(s.id) }}
                      title={s.enabled ? "Hide" : "Show"}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: s.enabled ? "#5a5780" : "#3a3760", fontSize: 10, padding: "2px 3px",
                      }}
                    >
                      {s.enabled ? "👁" : "👁"}
                    </button>
                    {/* Remove */}
                    {s.removable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(s.id) }}
                        title="Remove"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#3a3760", fontSize: 10, padding: "2px 3px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3760")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add section */}
            <div style={{ padding: 10, borderTop: "1px solid #1f1f45" }}>
              {showAddPanel ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Preset sections */}
                  {AVAILABLE_SECTIONS.map(s => (
                    <button
                      key={s.type}
                      onClick={() => addAvailableSection(s.type, s.title)}
                      style={{
                        padding: "6px 8px", borderRadius: 6, border: "1px solid #1f1f45",
                        background: "#16163a", color: "#a09dc0", fontSize: 11,
                        fontFamily: mono, cursor: "pointer", textAlign: "left",
                      }}
                    >
                      + {s.title}
                    </button>
                  ))}
                  {/* Custom section */}
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomSection()}
                      placeholder="Custom name..."
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid #7c3aed40", background: "#0d0d1a", color: "#f1f0ff", fontSize: 11, fontFamily: mono, outline: "none" }}
                    />
                    <button onClick={addCustomSection} style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "#7c3aed", color: "#fff", fontSize: 11, cursor: "pointer" }}>+</button>
                  </div>
                  <button
                    onClick={() => setShowAddPanel(false)}
                    style={{ padding: "5px", borderRadius: 6, border: "1px solid #1f1f45", background: "none", color: "#5a5780", fontSize: 11, fontFamily: mono, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPanel(true)}
                  style={{
                    width: "100%", padding: "8px", borderRadius: 8,
                    border: "1px dashed #7c3aed40", background: "#7c3aed08",
                    color: "#a855f7", fontSize: 11, fontFamily: mono, cursor: "pointer",
                  }}
                >
                  + Add Section
                </button>
              )}
            </div>
          </div>

          {/* Section editor */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {activeS && (
              <>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f0ff", fontFamily: mono, margin: 0 }}>{activeS.title}</h2>
                  {activeS.removable && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                      <span style={{ fontSize: 10, color: "#5a5780", fontFamily: mono }}>{activeS.enabled ? "Visible" : "Hidden"}</span>
                      <div
                        onClick={() => toggleSection(activeS.id)}
                        style={{
                          width: 36, height: 20, borderRadius: 99, cursor: "pointer",
                          background: activeS.enabled ? "#7c3aed" : "#1f1f45",
                          position: "relative", transition: "all 0.2s",
                        }}
                      >
                        <div style={{
                          position: "absolute", top: 3, left: activeS.enabled ? 18 : 3,
                          width: 14, height: 14, borderRadius: "50%", background: "#fff",
                          transition: "all 0.2s",
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form */}
                {activeS.type === "personal"       && <PersonalEditor       data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "summary"         && <SummaryEditor        data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "experience"      && <ExperienceEditor     data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "education"       && <EducationEditor      data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "skills"          && <SkillsEditor         data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "projects"        && <ProjectsEditor       data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {activeS.type === "certifications"  && <CertificationsEditor data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />}
                {!["personal","summary","experience","education","skills","projects","certifications"].includes(activeS.type) && (
                  <CustomEditor data={activeS.data} onChange={(d: any) => updateSectionData(activeS.id, d)} />
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div style={{ flex: 1, background: "#07070f", overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div ref={previewRef}>
              <ResumePreview sections={sections} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
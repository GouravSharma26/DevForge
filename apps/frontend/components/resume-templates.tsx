import React from "react"

// Helper to find a section by type
const getSection = (sections: any[], type: string) => sections.find(s => s.type === type && s.enabled)

// Mock Photo Component
const ProfilePhoto = ({ size = 80 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #cbd5e1" }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </div>
)

// 1. Modern Professional (Standard, no photo)
export const ModernProfessional = ({ sections }: { sections: any[] }) => {
  const personal = getSection(sections, "personal")?.data
  const summary = getSection(sections, "summary")?.data
  const experience = getSection(sections, "experience")?.data
  const education = getSection(sections, "education")?.data
  const skills = getSection(sections, "skills")?.data
  const projects = getSection(sections, "projects")?.data

  return (
    <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#1f2937", background: "#fff", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px 0", color: "#111827", textTransform: "uppercase" }}>{personal?.name || "Your Name"}</h1>
        <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>{personal?.title || "Professional Title"}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          {personal?.email && <span>{personal.email}</span>}
          {personal?.phone && <span>{personal.phone}</span>}
          {personal?.location && <span>{personal.location}</span>}
          {personal?.linkedin && <span>{personal.linkedin}</span>}
        </div>
      </div>

      <div style={{ borderBottom: "2px solid #111827", marginBottom: "16px" }}></div>

      {/* Summary */}
      {summary?.text && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.5, margin: 0 }}>{summary.text}</p>
        </div>
      )}

      {/* Experience */}
      {experience?.items?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", color: "#111827" }}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {experience.items.map((item: any, i: number) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "13px" }}>{item.position}</strong>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{item.startDate} - {item.current ? "Present" : item.endDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "#374151" }}>{item.company}</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{item.location}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#4b5563" }}>
                  {item.bullets.map((b: string, j: number) => <li key={j} style={{ marginBottom: "2px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education?.items?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", color: "#111827" }}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {education.items.map((item: any, i: number) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "13px" }}>{item.institution}</strong>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{item.startDate} - {item.endDate}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#374151" }}>{item.degree} in {item.field}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Projects */}
      {projects?.items?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", color: "#111827" }}>Projects</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {projects.items.map((item: any, i: number) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "13px" }}>{item.name}</strong>
                  {item.tech && <span style={{ fontSize: "12px", color: "#4b5563" }}>{item.tech}</span>}
                </div>
                {item.description && <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }}>{item.description}</div>}
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#4b5563" }}>
                  {item.bullets.map((b: string, j: number) => <li key={j} style={{ marginBottom: "2px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills?.items?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", color: "#111827" }}>Skills</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {skills.items.map((item: any, i: number) => (
              <div key={i} style={{ fontSize: "13px" }}>
                <strong>{item.category}:</strong> <span style={{ color: "#4b5563" }}>{item.skills}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 2. Creative Minimalist (Left-aligned, very clean, no photo)
export const CreativeMinimalist = ({ sections }: { sections: any[] }) => {
  const personal = getSection(sections, "personal")?.data
  const experience = getSection(sections, "experience")?.data
  const education = getSection(sections, "education")?.data
  const skills = getSection(sections, "skills")?.data

  return (
    <div style={{ padding: "40px", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#333", background: "#fcfcfc", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "4px solid #ea580c", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>{personal?.name || "Your Name"}</h1>
          <div style={{ fontSize: "16px", color: "#ea580c", fontWeight: 600 }}>{personal?.title || "Professional Title"}</div>
        </div>
        <div style={{ fontSize: "11px", color: "#666", textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
          {personal?.email && <div>{personal.email}</div>}
          {personal?.phone && <div>{personal.phone}</div>}
          {personal?.location && <div>{personal.location}</div>}
        </div>
      </div>

      {/* Experience */}
      {experience?.items?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111" }}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {experience.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "16px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>
                  {item.startDate} — <br/>{item.current ? "Present" : item.endDate}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{item.position}</div>
                  <div style={{ fontSize: "13px", color: "#ea580c", marginBottom: "4px", fontWeight: 500 }}>{item.company}</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>
                    {item.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education?.items?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111" }}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {education.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "16px" }}>
                <div style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>
                  {item.startDate} — {item.endDate}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{item.institution}</div>
                  <div style={{ fontSize: "13px", color: "#555" }}>{item.degree} in {item.field}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Skills */}
      {skills?.items?.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111" }}>Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {skills.items.map((item: any, i: number) => (
              <div key={i} style={{ background: "#f1f1f1", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "#333" }}>
                {item.category}: <span style={{ fontWeight: 400 }}>{item.skills}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 3. Executive Profile (Two columns, sidebar on left with photo)
export const ExecutiveProfile = ({ sections }: { sections: any[] }) => {
  const personal = getSection(sections, "personal")?.data
  const summary = getSection(sections, "summary")?.data
  const experience = getSection(sections, "experience")?.data
  const education = getSection(sections, "education")?.data
  const skills = getSection(sections, "skills")?.data

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "'Roboto', sans-serif", color: "#2d3748", background: "#fff", boxSizing: "border-box" }}>
      {/* Left Sidebar */}
      <div style={{ width: "30%", background: "#1a202c", color: "#fff", padding: "30px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <ProfilePhoto size={100} />
        </div>
        
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: 700, borderBottom: "1px solid #4a5568", paddingBottom: "4px", marginBottom: "12px", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "1px" }}>Contact</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#e2e8f0" }}>
            {personal?.email && <div>{personal.email}</div>}
            {personal?.phone && <div>{personal.phone}</div>}
            {personal?.location && <div>{personal.location}</div>}
            {personal?.linkedin && <div>{personal.linkedin}</div>}
          </div>
        </div>

        {education?.items?.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "12px", fontWeight: 700, borderBottom: "1px solid #4a5568", paddingBottom: "4px", marginBottom: "12px", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "1px" }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {education.items.map((item: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{item.degree}</div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1" }}>{item.institution}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{item.startDate} - {item.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {skills?.items?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "12px", fontWeight: 700, borderBottom: "1px solid #4a5568", paddingBottom: "4px", marginBottom: "12px", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "1px" }}>Expertise</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {skills.items.map((item: any, i: number) => (
                <div key={i} style={{ fontSize: "11px", color: "#e2e8f0" }}>
                  <strong>{item.category}</strong><br/>
                  <span style={{ color: "#cbd5e1" }}>{item.skills}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 4px 0", color: "#1a202c" }}>{personal?.name || "Your Name"}</h1>
          <div style={{ fontSize: "16px", color: "#4a5568", fontWeight: 500 }}>{personal?.title || "Professional Title"}</div>
        </div>

        {summary?.text && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "2px solid #edf2f7", paddingBottom: "4px", marginBottom: "12px", color: "#2d3748", textTransform: "uppercase" }}>Profile</h2>
            <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0, color: "#4a5568" }}>{summary.text}</p>
          </div>
        )}

        {experience?.items?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, borderBottom: "2px solid #edf2f7", paddingBottom: "4px", marginBottom: "12px", color: "#2d3748", textTransform: "uppercase" }}>Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {experience.items.map((item: any, i: number) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                    <strong style={{ fontSize: "14px", color: "#1a202c" }}>{item.position}</strong>
                    <span style={{ fontSize: "12px", color: "#718096", fontWeight: 500 }}>{item.startDate} - {item.current ? "Present" : item.endDate}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#4a5568", fontWeight: 500, marginBottom: "8px" }}>{item.company} | {item.location}</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#4a5568", lineHeight: 1.5 }}>
                    {item.bullets.map((b: string, j: number) => <li key={j} style={{ marginBottom: "4px" }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 4. Tech Innovator (Two columns, sidebar on right with photo, modern styling)
export const TechInnovator = ({ sections }: { sections: any[] }) => {
  const personal = getSection(sections, "personal")?.data
  const summary = getSection(sections, "summary")?.data
  const experience = getSection(sections, "experience")?.data
  const education = getSection(sections, "education")?.data
  const skills = getSection(sections, "skills")?.data
  const projects = getSection(sections, "projects")?.data

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "'Nunito', sans-serif", color: "#1e293b", background: "#f8fafc", boxSizing: "border-box" }}>
      
      {/* Left Content */}
      <div style={{ flex: 1, padding: "40px 30px 40px 40px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 900, margin: "0 0 4px 0", color: "#0f172a", letterSpacing: "-1px" }}>{personal?.name || "Your Name"}</h1>
          <div style={{ fontSize: "18px", color: "#3b82f6", fontWeight: 700 }}>{personal?.title || "Professional Title"}</div>
        </div>

        {summary?.text && (
          <div style={{ marginBottom: "24px", background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0, color: "#475569" }}>{summary.text}</p>
          </div>
        )}

        {experience?.items?.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "24px", height: "4px", background: "#3b82f6", display: "inline-block", borderRadius: "2px" }}></span>
              Experience
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {experience.items.map((item: any, i: number) => (
                <div key={i} style={{ position: "relative", paddingLeft: "16px", borderLeft: "2px solid #e2e8f0" }}>
                  <div style={{ position: "absolute", left: "-5px", top: "4px", width: "8px", height: "8px", background: "#3b82f6", borderRadius: "50%" }}></div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{item.position}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{item.company}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, background: "#f1f5f9", padding: "2px 8px", borderRadius: "10px" }}>{item.startDate} - {item.current ? "Present" : item.endDate}</div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                    {item.bullets.map((b: string, j: number) => <li key={j} style={{ marginBottom: "4px" }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects?.items?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "24px", height: "4px", background: "#3b82f6", display: "inline-block", borderRadius: "2px" }}></span>
              Projects
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {projects.items.map((item: any, i: number) => (
                <div key={i} style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{item.name}</strong>
                    {item.tech && <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700 }}>{item.tech}</span>}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                    {item.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div style={{ width: "28%", background: "#0f172a", color: "#fff", padding: "40px 20px", display: "flex", flexDirection: "column", gap: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ProfilePhoto size={120} />
        </div>
        
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#cbd5e1" }}>
            {personal?.email && <div>{personal.email}</div>}
            {personal?.phone && <div>{personal.phone}</div>}
            {personal?.location && <div>{personal.location}</div>}
            {personal?.linkedin && <div>{personal.linkedin}</div>}
          </div>
        </div>

        {skills?.items?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skills.items.map((item: any, i: number) => (
                <React.Fragment key={i}>
                  {item.skills.split(',').map((s: string, j: number) => (
                    <span key={`${i}-${j}`} style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", color: "#f8fafc" }}>
                      {s.trim()}
                    </span>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {education?.items?.length > 0 && (
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {education.items.map((item: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#f8fafc" }}>{item.degree}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{item.institution}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.startDate} - {item.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

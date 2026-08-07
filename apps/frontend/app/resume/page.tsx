"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useResumes, useUploadResume } from "@/hooks/useResume"
import { useResumeBuilder } from "@/hooks/useResumeBuilder"
import { useAuthStore } from "@/store/auth.store"
import type { Resume } from "@devforge/shared-types"

const mono = "JetBrains Mono, monospace"

export default function ResumeHubPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  const { data: resumes, isLoading } = useResumes()
  const { data: builtResume } = useResumeBuilder()
  const upload = useUploadResume()

  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token])

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") return alert("Please upload a PDF file")
    const newResume = await upload.mutateAsync(file)
    // Instantly route them to the new detailed view after upload
    router.push(`/resume/${newResume.id}`)
  }

  if (!hydrated || !token) return null

  return (
    <main style={{
      background: "radial-gradient(circle at 30% 20%, #c2591b33, transparent 60%), radial-gradient(circle at 80% 80%, #7c2d1233, transparent 60%), #171210",
      minHeight: "calc(100vh - 56px)"
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fdf6f0", fontFamily: mono, margin: 0 }}>Resume Intelligence</h1>
            <p style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4, fontFamily: mono }}>
              Manage your targeted resumes and practice mock interviews
            </p>
          </div>
          <button
            onClick={() => router.push("/resume/builder")}
            style={{
              padding: "10px 18px", borderRadius: 12,
              background: "rgba(217,119,6,0.18)", border: "1px solid rgba(253,186,116,0.45)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              color: "#fed7aa", fontSize: 12,
              fontFamily: mono, cursor: "pointer", fontWeight: 600, flexShrink: 0,
            }}
          >
            ✏️ Resume Builder
          </button>
        </div>

        {/* ── Upload Zone ── */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
          style={{
            border: `2px dashed ${dragOver ? "#ea580c" : "rgba(255,180,120,0.14)"}`,
            borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(234,88,12,0.08)" : "rgba(255,237,213,0.05)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            transition: "all 0.2s",
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {upload.isPending ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <p style={{ fontSize: 14, color: "#fdf6f0", fontFamily: mono, margin: 0 }}>Analyzing PDF...</p>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea580c", animation: `bounce 1s ease infinite ${i * 0.15}s` }} />)}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <p style={{ fontSize: 14, color: "#fdf6f0", fontFamily: mono, margin: 0 }}>Drop a new resume to scan</p>
              <p style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4, fontFamily: mono }}>PDF only · Max 5MB</p>
            </>
          )}
        </div>

        {/* ── Saved Resumes Grid ── */}
        {isLoading ? (
          <p style={{ color: "#8a7a6a", fontFamily: mono, fontSize: 12, textAlign: "center" }}>Loading your profiles...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {resumes?.map((res: Resume) => (
              <div
                key={res.id}
                onClick={() => router.push(`/resume/${res.id}`)}
                style={{
                  background: "rgba(255,237,213,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,180,120,0.14)", borderRadius: 16, padding: 20,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(234,88,12,0.5)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,180,120,0.14)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fdf6f0", fontFamily: mono, margin: "0 0 4px" }}>
                      {res.profileName}
                    </h3>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#1c1712", color: "#d4a373", fontFamily: mono }}>
                      {res.targetRole || "General Target"}
                    </span>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,180,120,0.08)",
                    color: res.score >= 80 ? "#10b981" : res.score >= 60 ? "#eab308" : "#ef4444",
                    border: "1px solid rgba(255,180,120,0.18)",
                    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                    fontFamily: mono, fontWeight: 800, fontSize: 13
                  }}>
                    {res.score}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "#8a7a6a", margin: 0, fontFamily: mono }}>
                  Scanned {new Date(res.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
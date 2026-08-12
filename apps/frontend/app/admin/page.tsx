"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Settings, Server, Activity, Bot } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { AppShell } from "@/components/ui/AppShell"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function AdminDashboard() {
  const router = useRouter()
  const { user, token, hydrated } = useAuthStore()
  
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!hydrated) return

    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }

    fetchConfig()
  }, [user, hydrated, router])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/config`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/config`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error("Failed to save")
      // Optionally show a success toast here
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || loading || !config) return null

  return (
    <AppShell>
      <div style={{ minHeight: "100%", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={24} color="#ea580c" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}>Admin Command Center</h1>
              <p style={{ color: "rgb(var(--text-muted))", fontSize: 14 }}>Global system configuration and bot tuning.</p>
            </div>
          </div>

          <div style={{ background: "#1c1815", border: "1px solid #332b26", borderRadius: 16, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid #332b26", paddingBottom: 16 }}>
              <Bot size={20} color="#ea580c" />
              <h2 style={{ fontSize: 18, color: "rgb(var(--text-primary))", fontWeight: 600 }}>PvP Arena AI Bots</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              {/* Left Column */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 24 }}>
                  <input 
                    type="checkbox" 
                    checked={config.botEnabled}
                    onChange={e => setConfig({...config, botEnabled: e.target.checked})}
                    style={{ width: 18, height: 18, accentColor: "#ea580c" }}
                  />
                  <span style={{ color: "rgb(var(--text-primary))", fontWeight: 500 }}>Enable Bot Injection</span>
                </label>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "rgb(var(--text-muted))", fontSize: 13, marginBottom: 8 }}>Queue Wait Time (seconds)</label>
                  <input 
                    type="number" 
                    value={config.botQueueWaitTime}
                    onChange={e => setConfig({...config, botQueueWaitTime: Number(e.target.value)})}
                    style={{ width: "100%", background: "rgb(var(--bg-base))", border: "1px solid #332b26", borderRadius: 8, padding: "10px 14px", color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}
                  />
                  <p style={{ fontSize: 11, color: "#5a5780", marginTop: 6 }}>How long to wait before injecting a bot if no human joins.</p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "rgb(var(--text-muted))", fontSize: 13, marginBottom: 8 }}>Base Time: EASY (seconds)</label>
                  <input 
                    type="number" 
                    value={config.baseTimeEasy}
                    onChange={e => setConfig({...config, baseTimeEasy: Number(e.target.value)})}
                    style={{ width: "100%", background: "rgb(var(--bg-base))", border: "1px solid #332b26", borderRadius: 8, padding: "10px 14px", color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "rgb(var(--text-muted))", fontSize: 13, marginBottom: 8 }}>Beginner Multiplier (Slower)</label>
                  <input 
                    type="number" step="0.1"
                    value={config.multBeginner}
                    onChange={e => setConfig({...config, multBeginner: Number(e.target.value)})}
                    style={{ width: "100%", background: "rgb(var(--bg-base))", border: "1px solid #332b26", borderRadius: 8, padding: "10px 14px", color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "rgb(var(--text-muted))", fontSize: 13, marginBottom: 8 }}>Intermediate Multiplier</label>
                  <input 
                    type="number" step="0.1"
                    value={config.multIntermediate}
                    onChange={e => setConfig({...config, multIntermediate: Number(e.target.value)})}
                    style={{ width: "100%", background: "rgb(var(--bg-base))", border: "1px solid #332b26", borderRadius: 8, padding: "10px 14px", color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "#ea580c", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Grandmaster Multiplier (Faster)</label>
                  <input 
                    type="number" step="0.1"
                    value={config.multGrandmaster}
                    onChange={e => setConfig({...config, multGrandmaster: Number(e.target.value)})}
                    style={{ width: "100%", background: "rgba(234,88,12,0.05)", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 8, padding: "10px 14px", color: "rgb(var(--text-primary))", fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  background: saving ? "#b44408" : "#ea580c", 
                  color: "#fff", 
                  border: "none", 
                  padding: "12px 24px", 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Settings size={18} />
                {saving ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </AppShell>
  )
}

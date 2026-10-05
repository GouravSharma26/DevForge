"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Settings, Server, Activity, Bot, Users, Swords, FileText, Mic, Target, RefreshCw } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { AppShell } from "@/components/ui/AppShell"

// API is proxied through Next.js
export default function AdminDashboard() {
  const router = useRouter()
  const { user, token, hydrated } = useAuthStore()
  
  const [config, setConfig] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }
    fetchData()
  }, [user, hydrated, router])

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch(`/api/admin/config`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      if (!configRes.ok || !statsRes.ok) throw new Error("Failed to fetch")
      
      const [configData, statsData] = await Promise.all([
        configRes.json(),
        statsRes.json()
      ])
      
      setConfig(configData)
      setStats(statsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/config`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error("Failed to save")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || loading || !config || !stats) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-full p-6 md:p-10 font-sans selection:bg-accent/30 text-primary">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-surface-theme/50 backdrop-blur-xl border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.15)]">
                <Shield size={32} className="text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-3">
                  System Core
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest border border-red-500/20">Admin Only</span>
                </h1>
                <p className="text-muted mt-1">Global system configuration and telemetry.</p>
              </div>
            </div>
            <button 
              onClick={fetchData} 
              disabled={refreshing}
              className="relative z-10 flex items-center gap-2 px-4 py-2 bg-card hover:bg-surface-theme border border-border rounded-xl font-mono text-xs uppercase tracking-wider text-muted hover:text-primary transition-all"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-accent" : ""} />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                <Activity className="text-accent" /> Telemetry
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-accent/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Total Users</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-[#84cc16]/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Swords size={24} />
                  </div>
                  <div>
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Arena Matches</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalMatches.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-[#eab308]/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-[#eab308]/10 text-[#eab308] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Resumes Analyzed</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalResumes.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-purple-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic size={24} />
                  </div>
                  <div>
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Interviews Taken</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalInterviews.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-pink-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Problems Available</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalProblems.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Recent Users List */}
              <div className="bg-surface-theme border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold font-mono text-muted uppercase tracking-wider mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {stats.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-mono text-sm">{u.username}</p>
                        <p className="text-[10px] text-muted">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-card text-muted border border-border'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column - Config */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                <Server className="text-accent" /> System Configuration
              </h2>

              <div className="bg-surface-theme border border-border rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Bot size={20} className="text-accent" />
                  </div>
                  <h2 className="text-xl font-bold font-mono">PvP Arena AI Bots</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Controls */}
                  <div className="space-y-6">
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border hover:border-accent/30 bg-card/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={config.botEnabled}
                        onChange={e => setConfig({...config, botEnabled: e.target.checked})}
                        className="w-5 h-5 accent-accent"
                      />
                      <div>
                        <span className="font-bold block">Enable Bot Injection</span>
                        <span className="text-xs text-muted">Allow AI bots to join queue if no players found.</span>
                      </div>
                    </label>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Queue Wait Time (s)</label>
                      <input 
                        type="number" 
                        value={config.botQueueWaitTime}
                        onChange={e => setConfig({...config, botQueueWaitTime: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
                      />
                      <p className="text-[10px] text-muted mt-2">Time before a bot is spawned to play against the user.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Base Time: EASY (s)</label>
                      <input 
                        type="number" 
                        value={config.baseTimeEasy}
                        onChange={e => setConfig({...config, baseTimeEasy: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Beginner Multiplier</label>
                      <input 
                        type="number" step="0.1"
                        value={config.multBeginner}
                        onChange={e => setConfig({...config, multBeginner: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
                      />
                      <p className="text-[10px] text-muted mt-2">Bot solving speed multiplier (Higher = Slower).</p>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Intermediate Multiplier</label>
                      <input 
                        type="number" step="0.1"
                        value={config.multIntermediate}
                        onChange={e => setConfig({...config, multIntermediate: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-accent mb-2 uppercase tracking-wider flex items-center justify-between">
                        Grandmaster Multiplier
                        <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-500">DANGER</span>
                      </label>
                      <input 
                        type="number" step="0.1"
                        value={config.multGrandmaster}
                        onChange={e => setConfig({...config, multGrandmaster: Number(e.target.value)})}
                        className="w-full bg-accent/5 border border-accent/30 focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors text-highlight"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-highlight text-white rounded-xl font-bold font-mono transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] disabled:opacity-50"
                  >
                    <Settings size={18} className={saving ? "animate-spin" : ""} />
                    {saving ? "Deploying..." : "Deploy Configuration"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  )
}

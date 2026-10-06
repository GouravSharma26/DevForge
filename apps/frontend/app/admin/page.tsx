"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Shield, Settings, Activity, Bot, Users, Swords, FileText, Mic, Target, RefreshCw, Code, Zap, PlayCircle } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"
import { api } from "@/lib/api"

// API is proxied through Next.js
export default function AdminDashboard() {
  const router = useRouter()
  const { user, hydrated } = useAuthStore()
  
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [configRes, statsRes] = await Promise.all([
        api.get(`/admin/config`),
        api.get(`/admin/stats`)
      ])
      
      setConfig(configRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 500)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [user, hydrated, router, fetchData])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/config`, config)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || loading || !config || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-56px)]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full p-6 md:p-10 font-sans selection:bg-accent/30 text-primary overflow-x-hidden">
      <div className="w-full max-w-[1600px] space-y-8">
          
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
              className="relative z-10 flex items-center gap-2 px-4 py-2 bg-card hover:bg-surface-theme border border-border rounded-xl font-mono text-xs uppercase tracking-wider text-muted hover:text-primary transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-accent" : ""} />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Main Content Column */}
            <div className="xl:col-span-3 space-y-8">
              
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-accent/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Users size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Users size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Total Users</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-[#84cc16]/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Swords size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Swords size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Arena Matches</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalMatches.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-[#eab308]/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Activity size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#eab308]/10 text-[#eab308] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Activity size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Total XP Earned</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalXp.toLocaleString()} XP</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <FileText size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <FileText size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Resumes Scanned</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalResumes.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Mic size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Mic size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Interviews</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalInterviews.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-pink-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Target size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Target size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Active Problems</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalProblems.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Code size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Code size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Submissions</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalSubmissions?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-orange-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Zap size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Zap size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">AI Requests</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalAiRequests?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-surface-theme border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <PlayCircle size={64} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <PlayCircle size={24} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-muted text-xs font-mono uppercase tracking-widest">Active Matches</p>
                    <p className="text-2xl font-bold font-mono">{stats.activeMatches?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Bot Config */}
              <div className="bg-surface-theme border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Bot size={24} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-mono">PvP Arena AI Bots</h2>
                    <p className="text-xs text-muted mt-1">Configure bot injection parameters and difficulty scalers.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Left Controls */}
                  <div className="space-y-6">
                    <label className="flex items-center gap-4 cursor-pointer p-5 rounded-2xl border border-border hover:border-accent/50 bg-card/50 transition-all group hover:shadow-[0_0_20px_rgba(234,88,12,0.1)]">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${config.botEnabled ? 'bg-accent border-accent' : 'border-muted bg-transparent'}`}>
                        {config.botEnabled && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={config.botEnabled}
                        onChange={e => setConfig({...config, botEnabled: e.target.checked})}
                        className="hidden"
                      />
                      <div>
                        <span className="font-bold block text-sm">Enable Bot Injection</span>
                        <span className="text-xs text-muted">Allow AI bots to join queue if no players found.</span>
                      </div>
                    </label>

                    <div className="bg-card/30 p-5 rounded-2xl border border-border">
                      <label className="block text-[11px] font-mono text-muted mb-3 uppercase tracking-widest font-bold">Queue Wait Time (s)</label>
                      <input 
                        type="number" 
                        value={config.botQueueWaitTime}
                        onChange={e => setConfig({...config, botQueueWaitTime: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors shadow-inner"
                      />
                      <p className="text-[10px] text-muted mt-3">Time before a bot is spawned to play against the user.</p>
                    </div>

                    <div className="bg-card/30 p-5 rounded-2xl border border-border">
                      <label className="block text-[11px] font-mono text-muted mb-3 uppercase tracking-widest font-bold">Base Time: EASY (s)</label>
                      <input 
                        type="number" 
                        value={config.baseTimeEasy}
                        onChange={e => setConfig({...config, baseTimeEasy: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="space-y-6">
                    <div className="bg-card/30 p-5 rounded-2xl border border-border">
                      <label className="block text-[11px] font-mono text-muted mb-3 uppercase tracking-widest font-bold">Beginner Multiplier</label>
                      <input 
                        type="number" step="0.1"
                        value={config.multBeginner}
                        onChange={e => setConfig({...config, multBeginner: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors shadow-inner"
                      />
                      <p className="text-[10px] text-muted mt-3">Bot solving speed multiplier (Higher = Slower).</p>
                    </div>

                    <div className="bg-card/30 p-5 rounded-2xl border border-border">
                      <label className="block text-[11px] font-mono text-muted mb-3 uppercase tracking-widest font-bold">Intermediate Multiplier</label>
                      <input 
                        type="number" step="0.1"
                        value={config.multIntermediate}
                        onChange={e => setConfig({...config, multIntermediate: Number(e.target.value)})}
                        className="w-full bg-card border border-border focus:border-accent rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors shadow-inner"
                      />
                    </div>

                    <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-red-500/20 transition-colors" />
                      <label className="text-[11px] font-mono font-bold text-red-400 mb-3 uppercase tracking-widest flex items-center justify-between relative z-10">
                        Grandmaster Multiplier
                        <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-500 border border-red-500/30">DANGER</span>
                      </label>
                      <input 
                        type="number" step="0.1"
                        value={config.multGrandmaster}
                        onChange={e => setConfig({...config, multGrandmaster: Number(e.target.value)})}
                        className="w-full bg-card/80 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors text-white relative z-10 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-highlight text-white rounded-xl font-bold font-mono transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] disabled:opacity-50 hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] hover:-translate-y-0.5"
                  >
                    <Settings size={18} className={saving ? "animate-spin" : ""} />
                    {saving ? "Deploying Updates..." : "Deploy Configuration"}
                  </button>
                </div>
              </div>

            </div>

            {/* Sidebar Column */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Server Health Widget */}
              <div className="bg-surface-theme border border-border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                <h3 className="text-[11px] font-bold font-mono text-muted uppercase tracking-widest mb-6 flex items-center justify-between">
                  Server Health
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    ONLINE
                  </span>
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-muted">Memory Usage</span>
                      <span className="text-white">{Math.round(stats.serverStats.memory.used / 1024 / 1024)}MB / {Math.round(stats.serverStats.memory.total / 1024 / 1024)}MB</span>
                    </div>
                    <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${(stats.serverStats.memory.used / stats.serverStats.memory.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted font-mono uppercase tracking-widest">Uptime</p>
                      <p className="text-sm font-mono mt-1 text-white">{Math.floor(stats.serverStats.uptime / 3600)}h {Math.floor((stats.serverStats.uptime % 3600) / 60)}m</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-mono uppercase tracking-widest">Node.js</p>
                      <p className="text-sm font-mono mt-1 text-white">{stats.serverStats.nodeVersion}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Matches */}
              <div className="bg-surface-theme border border-border rounded-2xl p-6">
                <h3 className="text-[11px] font-bold font-mono text-muted uppercase tracking-widest mb-5 flex items-center justify-between">
                  Recent Matches
                </h3>
                <div className="space-y-4">
                  {stats.recentMatches.map((m: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white max-w-[150px] truncate">{m.problem?.title || 'Unknown Problem'}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${m.problem?.difficulty === 'EASY' ? 'text-green-400' : m.problem?.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {m.problem?.difficulty || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-muted">
                            {m.player1?.username || 'Unknown'}
                          </span>
                          <span className="text-muted/50 text-[10px]">vs</span>
                          <span className="text-muted">
                            {m.player2?.username || 'Bot'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.recentMatches.length === 0 && (
                    <p className="text-xs text-muted text-center py-4 font-mono">No matches recorded</p>
                  )}
                </div>
              </div>

              {/* Recent Users List */}
              <div className="bg-surface-theme border border-border rounded-2xl p-6">
                <h3 className="text-[11px] font-bold font-mono text-muted uppercase tracking-widest mb-5">New Recruits</h3>
                <div className="space-y-4">
                  {stats.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-mono text-xs font-medium text-white">{u.username}</p>
                        <p className="text-[10px] text-muted">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-card text-muted border border-border'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  )
}

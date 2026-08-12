"use client"

import { useState } from "react"
import { useMe } from "@/hooks/useUser"
import { useAuthStore } from "@/store/auth.store"
import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { User, Lock, Mail, ArrowRight } from "lucide-react"

export default function SettingsPage() {
  const { data: user, isLoading } = useMe()
  const token = useAuthStore(s => s.token)
  const logout = useAuthStore(s => s.logout)
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState("General")
  
  // Local state for editing fields
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  
  const [passwordData, setPasswordData] = useState({ current: "", new: "" })
  const [deleteConfirm, setDeleteConfirm] = useState("")

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch("/user/me", data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] })
      setEditingField(null)
    }
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put("/user/me/password", {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      }, { headers: { Authorization: `Bearer ${token}` } })
      return res.data
    },
    onSuccess: () => {
      setEditingField(null)
      setPasswordData({ current: "", new: "" })
      alert("Password updated successfully!")
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Failed to update password")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/user/me", { headers: { Authorization: `Bearer ${token}` } })
    },
    onSuccess: () => {
      logout()
      window.location.href = "/"
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <p className="text-muted font-mono">Failed to load profile. Please log in.</p>
      </div>
    )
  }

  const handleSaveField = (field: string) => {
    updateMutation.mutate({ [field]: editValue })
  }

  const TABS = ["Account", "Privacy", "Subscription", "Points", "Notifications"]

  return (
    <main className="min-h-screen bg-base text-primary flex justify-center py-10 px-4 md:px-8 font-sans">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-12 mt-8">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <h1 className="text-2xl font-bold mb-6 tracking-tight">Settings</h1>
          <nav className="flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? "bg-surface-theme text-primary" 
                    : "text-muted hover:bg-surface-theme hover:text-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-3xl">
          {activeTab === "Account" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div>
                <h2 className="text-lg font-bold mb-2">General</h2>
                <p className="text-sm text-muted">You can log in using your email or DevForge ID.</p>
              </div>

              {/* Data List */}
              <div className="rounded-xl border border-border bg-surface-theme/50 divide-y divide-white/5">
                
                {/* ID / Username */}
                <div className="p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-colors">
                  <div className="flex items-center gap-4">
                    <User size={18} className="text-muted" />
                    <div>
                      <span className="font-semibold text-sm">DevForge ID</span>
                      <span className="ml-3 text-sm text-muted">{user.username}</span>
                    </div>
                  </div>
                  {editingField === "username" ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)}
                        className="bg-card border border-accent/30 rounded-md px-3 py-1.5 text-sm outline-none w-32 focus:border-accent transition-colors" 
                      />
                      <button onClick={() => handleSaveField("username")} className="px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-md text-xs font-bold transition-colors">Save</button>
                      <button onClick={() => setEditingField(null)} className="px-3 py-1.5 bg-card hover:bg-card rounded-md text-xs transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField("username"); setEditValue(user.username) }} className="text-muted hover:text-primary transition-colors p-1">
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Email */}
                <div className="p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-colors">
                  <div className="flex items-center gap-4">
                    <Mail size={18} className="text-muted" />
                    <div>
                      <span className="font-semibold text-sm">Email</span>
                      <span className="ml-3 text-sm text-muted">{user.email}</span>
                    </div>
                  </div>
                  {editingField === "email" ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)}
                        className="bg-card border border-accent/30 rounded-md px-3 py-1.5 text-sm outline-none w-48 focus:border-accent transition-colors" 
                      />
                      <button onClick={() => handleSaveField("email")} className="px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-md text-xs font-bold transition-colors">Save</button>
                      <button onClick={() => setEditingField(null)} className="px-3 py-1.5 bg-card hover:bg-card rounded-md text-xs transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField("email"); setEditValue(user.email) }} className="text-muted hover:text-primary transition-colors p-1">
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {/* Password */}
                <div className="p-4 md:px-6 flex flex-col gap-4 group transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Lock size={18} className="text-muted" />
                      <span className="font-semibold text-sm">Password</span>
                      <span className="ml-3 text-sm text-muted tracking-widest">••••••••</span>
                    </div>
                    {editingField !== "password" && (
                      <button onClick={() => setEditingField("password")} className="text-muted hover:text-primary transition-colors p-1">
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingField === "password" && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-border mt-1 animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.current} 
                        onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                        className="bg-card border border-border rounded-md px-3 py-2 text-sm outline-none w-full max-w-sm focus:border-accent/50 transition-colors" 
                      />
                      <input 
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new} 
                        onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                        className="bg-card border border-border rounded-md px-3 py-2 text-sm outline-none w-full max-w-sm focus:border-accent/50 transition-colors" 
                      />
                      <div className="flex gap-2">
                        <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !passwordData.current || !passwordData.new} className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:bg-[#ea580c]/50 disabled:cursor-not-allowed rounded-md text-xs font-bold transition-colors">
                          {passwordMutation.isPending ? "Updating..." : "Update Password"}
                        </button>
                        <button onClick={() => setEditingField(null)} className="px-4 py-2 bg-card hover:bg-card rounded-md text-xs transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Accounts (Mock) */}
              <div className="pt-8">
                <h3 className="text-sm font-semibold mb-1">Social Accounts</h3>
                <p className="text-xs text-muted mb-4">Connect a social account to sign in to DevForge.</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-theme/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-card flex items-center justify-center font-bold font-mono">G</div>
                      <span className="text-sm font-medium">Google</span>
                    </div>
                    <button className="px-4 py-1.5 rounded-lg bg-card hover:bg-card text-xs font-medium text-muted transition-colors">Connect</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-theme/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-card flex items-center justify-center font-bold font-mono">Gh</div>
                      <span className="text-sm font-medium">GitHub</span>
                    </div>
                    <button className="px-4 py-1.5 rounded-lg bg-card hover:bg-card text-xs font-medium text-muted transition-colors">Connect</button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-12">
                <h3 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h3>
                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
                  {editingField === "delete" ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-sm text-red-400">Are you absolutely sure? This action cannot be undone. Type <span className="font-mono font-bold text-white">delete my account</span> to confirm.</p>
                      <input 
                        value={deleteConfirm} 
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="delete my account"
                        className="bg-card border border-red-500/30 rounded-md px-3 py-2 text-sm outline-none w-full max-w-sm focus:border-red-500 transition-colors block" 
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => deleteMutation.mutate()} 
                          disabled={deleteConfirm !== "delete my account" || deleteMutation.isPending}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed rounded-md text-xs font-bold transition-colors"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
                        </button>
                        <button onClick={() => { setEditingField(null); setDeleteConfirm("") }} className="px-4 py-2 bg-card hover:bg-card rounded-md text-xs transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 text-white">Delete Account</h4>
                        <p className="text-xs text-muted">Permanently delete your account and all associated data.</p>
                      </div>
                      <button onClick={() => setEditingField("delete")} className="shrink-0 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-colors text-sm font-bold">
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-2xl">
              <p className="text-muted font-mono text-sm">{activeTab} settings coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

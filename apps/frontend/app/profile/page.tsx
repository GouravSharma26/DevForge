"use client"
import { useState } from "react"

import { useMe, useUpdateMe } from "@/hooks/useUser"
import { useResumes, useDeleteResume, useUploadResume } from "@/hooks/useResume"
import { useRouter } from "next/navigation"
import { Flame, Trophy, Star, Edit3, Mail, Target, Clock, Shield, FileText, Plus, Trash2, ArrowRight } from "lucide-react"
import { calculateRank } from "@/lib/rank"

export default function ProfilePage() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const deleteResume = useDeleteResume()
  const uploadResume = useUploadResume()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const updateMe = useUpdateMe()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ username: "", bio: "", targetRole: "", avatar: "" })

  const openEditModal = () => {
    if (user) {
      setEditForm({
        username: user.username || "",
        bio: user.bio || "",
        targetRole: user.targetRole || "",
        avatar: user.avatar || ""
      })
      setIsEditing(true)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateMe.mutateAsync(editForm)
      setIsEditing(false)
    } catch (err: any) {
      alert("Failed to update profile: " + err.message)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadResume.mutateAsync({ file, skipAI: true })
      alert("Resume uploaded successfully!")
    } catch (err: any) {
      alert("Upload failed: " + err.message)
    }
  }

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

  return (
    <main className="min-h-screen bg-base text-primary p-6 md:p-12 font-sans selection:bg-[#ea580c]/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header / Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-theme/50 backdrop-blur-xl shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[#ea580c]/10 to-transparent blur-3xl pointer-events-none"></div>
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {/* Avatar */}
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-32 h-32 rounded-full border-4 border-[#1f1a18] shadow-[0_0_40px_rgba(234,88,12,0.3)] object-cover shrink-0" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-[#1f1a18] bg-gradient-to-br from-accent to-highlight shadow-[0_0_40px_rgba(234,88,12,0.3)] flex items-center justify-center text-5xl font-bold font-mono tracking-tighter shrink-0 text-white">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">{user.username}</h1>
                <p className="text-secondary font-mono text-sm flex items-center justify-center md:justify-start gap-2">
                  <Mail size={14} />
                  {user.email}
                </p>
              </div>
              
              <p className="text-muted max-w-lg leading-relaxed text-sm">
                {user.bio || "No bio provided yet. Add a short bio to let others know who you are."}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted">
                  <Target size={12} className="text-accent" />
                  {user.targetRole || "No role set"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted">
                  <Shield size={12} className="text-accent" />
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted">
                  <Clock size={12} className="text-accent" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="shrink-0">
              <button 
                onClick={openEditModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card hover:bg-card/80 border border-border hover:border-accent transition-all font-medium text-sm text-primary"
              >
                <Edit3 size={16} className="text-accent" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-surface-theme/30 backdrop-blur-md flex items-center gap-5 hover:border-accent/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">Total XP</p>
              <p className="text-2xl font-bold font-mono">{user.xp.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-surface-theme/30 backdrop-blur-md flex items-center gap-5 hover:border-highlight/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-highlight/10 text-highlight flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">Current Streak</p>
              <p className="text-2xl font-bold font-mono">{user.streak} <span className="text-sm text-muted font-sans">days</span></p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-surface-theme/30 backdrop-blur-md flex items-center gap-5 hover:border-[#84cc16]/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            <div className="flex-1">
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">Rank</p>
              <p className="text-xl font-bold font-mono text-primary mb-1">
                {user ? calculateRank(user.xp).title : "Beginner 1"}
              </p>
              {user && calculateRank(user.xp).tier !== "Grandmaster" && (
                <div className="w-full">
                  <div className="flex justify-between text-[10px] text-muted font-mono mb-1">
                    <span>{calculateRank(user.xp).xpInCurrentLevel} XP</span>
                    <span>{calculateRank(user.xp).xpRequiredForNextLevel} XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#84cc16] rounded-full transition-all" 
                      style={{ width: `${calculateRank(user.xp).progressPercentage}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Activity / Placeholder */}
        <div className="p-8 rounded-3xl border border-border bg-surface-theme/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-accent"></span>
            Recent Activity
          </h2>
          <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <Shield size={24} className="text-muted" />
            </div>
            <p className="text-muted font-medium">No recent activity</p>
            <p className="text-muted text-sm mt-1">Start practicing or building your resume to see activity here.</p>
          </div>
        </div>

        {/* ── My Resumes Section ── */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
              <FileText className="text-accent" /> My Resumes
            </h2>
            <label className="cursor-pointer bg-accent hover:bg-[#ea580c]/80 text-white text-sm font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors">
              <Plus size={16} /> Upload Resume
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumesLoading ? (
              <p className="text-muted font-mono text-sm">Loading resumes...</p>
            ) : resumes.length === 0 ? (
              <div className="col-span-full p-8 border border-border rounded-2xl bg-surface-theme/30 text-center">
                <FileText className="mx-auto text-muted mb-3 opacity-50" size={32} />
                <p className="text-muted font-mono text-sm mb-4">No resumes uploaded yet.</p>
                <label className="cursor-pointer bg-card hover:bg-card text-primary border border-border px-4 py-2 rounded-lg text-sm transition-colors inline-block">
                  Upload your first PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            ) : (
              resumes.map(r => (
                <div key={r.id} className="p-5 rounded-2xl border border-border bg-surface-theme/50 backdrop-blur-md flex flex-col gap-4 group hover:border-border transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-primary group-hover:text-accent transition-colors">{r.profileName}</h3>
                      <p className="text-muted text-xs font-mono mt-1">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    {/* Score Badge */}
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted font-mono mb-1">Score</span>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        r.score === 0 ? 'bg-card text-muted border border-border' :
                        r.score >= 80 ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' :
                        r.score >= 60 ? 'bg-highlight/10 text-highlight border border-[#f59e0b]/20' :
                        'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                      }`}>
                        {r.score === 0 ? 'NA' : `${r.score}/100`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                    <button 
                      onClick={() => router.push(`/resume/builder?resumeId=${r.id}`)}
                      className="flex-1 py-2 bg-card hover:bg-card border border-border rounded-lg text-sm text-primary flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit3 size={14} /> Edit in Builder
                    </button>
                    <button 
                      onClick={() => router.push(`/resume/${r.id}`)}
                      className="flex-1 py-2 bg-accent/10 hover:bg-[#ea580c]/20 border border-[#ea580c]/20 rounded-lg text-sm text-accent flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      Check Score <ArrowRight size={14} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(r.id)}
                      className="w-10 h-[38px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-theme border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-primary font-mono mb-2">Delete Resume?</h3>
              <p className="text-muted text-sm">
                This action cannot be undone. This resume will be permanently removed from your profile.
              </p>
            </div>
            <div className="flex border-t border-border">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 text-sm font-bold text-muted hover:text-primary hover:bg-card transition-colors border-r border-border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteResume.mutate(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
                className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-theme border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary font-mono mb-6 flex items-center gap-2">
                <Edit3 className="text-accent" size={20} /> Edit Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={editForm.username} 
                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                    className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Target Role</label>
                  <input 
                    type="text" 
                    value={editForm.targetRole} 
                    onChange={e => setEditForm({...editForm, targetRole: e.target.value})}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Bio</label>
                  <textarea 
                    value={editForm.bio} 
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-primary outline-none focus:border-accent transition-colors resize-none h-24"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted mb-2 uppercase tracking-wider">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {editForm.avatar ? (
                       <img src={editForm.avatar} alt="Avatar preview" className="w-12 h-12 rounded-full object-cover border border-border" />
                    ) : (
                       <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-[10px] text-muted font-mono">None</div>
                    )}
                    <label className="cursor-pointer bg-card border border-border hover:border-accent text-primary px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-2">
                      <Plus size={14} /> Browse File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Image must be less than 2MB")
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setEditForm({...editForm, avatar: reader.result as string})
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                    {editForm.avatar && (
                       <button 
                         onClick={() => setEditForm({...editForm, avatar: ""})} 
                         className="text-red-500 text-xs font-bold font-mono hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                       >
                         Remove
                       </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex border-t border-border mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 text-sm font-bold text-muted hover:text-primary hover:bg-card transition-colors border-r border-border"
              >
                Cancel
              </button>
              <button
                disabled={updateMe.isPending}
                onClick={handleSaveProfile}
                className="flex-1 py-4 text-sm font-bold text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
              >
                {updateMe.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

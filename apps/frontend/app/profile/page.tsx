"use client"
import { useState } from "react"

import { useMe } from "@/hooks/useUser"
import { useResumes, useDeleteResume, useUploadResume } from "@/hooks/useResume"
import { useRouter } from "next/navigation"
import { Flame, Trophy, Star, Edit3, Mail, Target, Clock, Shield, FileText, Plus, Trash2, ArrowRight } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const deleteResume = useDeleteResume()
  const uploadResume = useUploadResume()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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
      <div className="flex h-screen items-center justify-center bg-[#171210]">
        <div className="w-8 h-8 border-2 border-[#ea580c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#171210]">
        <p className="text-[#8a7a6a] font-mono">Failed to load profile. Please log in.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#171210] text-[#fdf6f0] p-6 md:p-12 font-sans selection:bg-[#ea580c]/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header / Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#1c1614]/50 backdrop-blur-xl shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[#ea580c]/10 to-transparent blur-3xl pointer-events-none"></div>
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-[#1f1a18] bg-gradient-to-br from-[#ea580c] to-[#f59e0b] shadow-[0_0_40px_rgba(234,88,12,0.3)] flex items-center justify-center text-5xl font-bold font-mono tracking-tighter shrink-0">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">{user.username}</h1>
                <p className="text-[#d4a373] font-mono text-sm flex items-center justify-center md:justify-start gap-2">
                  <Mail size={14} />
                  {user.email}
                </p>
              </div>
              
              <p className="text-[#8a7a6a] max-w-lg leading-relaxed text-sm">
                {user.bio || "No bio provided yet. Add a short bio to let others know who you are."}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#a39486]">
                  <Target size={12} className="text-[#ea580c]" />
                  {user.targetRole || "No role set"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#a39486]">
                  <Shield size={12} className="text-[#ea580c]" />
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#a39486]">
                  <Clock size={12} className="text-[#ea580c]" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="shrink-0">
              <button 
                onClick={() => alert("Edit Profile form coming soon!")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-medium text-sm text-[#fdf6f0]"
              >
                <Edit3 size={16} className="text-[#ea580c]" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-[#1c1614]/30 backdrop-blur-md flex items-center gap-5 hover:border-[#ea580c]/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 text-[#ea580c] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-[#8a7a6a] text-xs font-mono uppercase tracking-wider mb-1">Total XP</p>
              <p className="text-2xl font-bold font-mono">{user.xp.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl border border-white/5 bg-[#1c1614]/30 backdrop-blur-md flex items-center gap-5 hover:border-[#f59e0b]/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-[#8a7a6a] text-xs font-mono uppercase tracking-wider mb-1">Current Streak</p>
              <p className="text-2xl font-bold font-mono">{user.streak} <span className="text-sm text-[#8a7a6a] font-sans">days</span></p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-[#1c1614]/30 backdrop-blur-md flex items-center gap-5 hover:border-[#84cc16]/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            <div>
              <p className="text-[#8a7a6a] text-xs font-mono uppercase tracking-wider mb-1">Rank</p>
              <p className="text-2xl font-bold font-mono capitalize">{user.experienceLevel.toLowerCase()}</p>
            </div>
          </div>
        </div>
        
        {/* Activity / Placeholder */}
        <div className="p-8 rounded-3xl border border-white/5 bg-[#1c1614]/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-[#ea580c]"></span>
            Recent Activity
          </h2>
          <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Shield size={24} className="text-[#8a7a6a]" />
            </div>
            <p className="text-[#a39486] font-medium">No recent activity</p>
            <p className="text-[#8a7a6a] text-sm mt-1">Start practicing or building your resume to see activity here.</p>
          </div>
        </div>

        {/* ── My Resumes Section ── */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono text-[#fdf6f0] flex items-center gap-2">
              <FileText className="text-[#ea580c]" /> My Resumes
            </h2>
            <label className="cursor-pointer bg-[#ea580c] hover:bg-[#ea580c]/80 text-white text-sm font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors">
              <Plus size={16} /> Upload Resume
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumesLoading ? (
              <p className="text-[#8a7a6a] font-mono text-sm">Loading resumes...</p>
            ) : resumes.length === 0 ? (
              <div className="col-span-full p-8 border border-white/5 rounded-2xl bg-[#1c1614]/30 text-center">
                <FileText className="mx-auto text-[#8a7a6a] mb-3 opacity-50" size={32} />
                <p className="text-[#8a7a6a] font-mono text-sm mb-4">No resumes uploaded yet.</p>
                <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-[#fdf6f0] border border-white/10 px-4 py-2 rounded-lg text-sm transition-colors inline-block">
                  Upload your first PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            ) : (
              resumes.map(r => (
                <div key={r.id} className="p-5 rounded-2xl border border-white/5 bg-[#1c1614]/50 backdrop-blur-md flex flex-col gap-4 group hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-[#fdf6f0] group-hover:text-[#ea580c] transition-colors">{r.profileName}</h3>
                      <p className="text-[#8a7a6a] text-xs font-mono mt-1">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    {/* Score Badge */}
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[#8a7a6a] font-mono mb-1">Score</span>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        r.score === 0 ? 'bg-white/5 text-[#8a7a6a] border border-white/10' :
                        r.score >= 80 ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' :
                        r.score >= 60 ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20' :
                        'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                      }`}>
                        {r.score === 0 ? 'NA' : `${r.score}/100`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    <button 
                      onClick={() => router.push(`/resume/builder?resumeId=${r.id}`)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-[#fdf6f0] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit3 size={14} /> Edit in Builder
                    </button>
                    <button 
                      onClick={() => router.push(`/resume/${r.id}`)}
                      className="flex-1 py-2 bg-[#ea580c]/10 hover:bg-[#ea580c]/20 border border-[#ea580c]/20 rounded-lg text-sm text-[#ea580c] flex items-center justify-center gap-2 transition-colors font-medium"
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
          <div className="bg-[#1c1614] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#fdf6f0] font-mono mb-2">Delete Resume?</h3>
              <p className="text-[#8a7a6a] text-sm">
                This action cannot be undone. This resume will be permanently removed from your profile.
              </p>
            </div>
            <div className="flex border-t border-white/5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 text-sm font-bold text-[#8a7a6a] hover:text-[#fdf6f0] hover:bg-white/5 transition-colors border-r border-white/5"
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

    </main>
  )
}

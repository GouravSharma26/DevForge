"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from "next/navigation"
import { usePath, useMarkComplete } from "@/hooks/usePaths"
import { useAuthStore } from "@/store/auth.store"
import { ArrowLeft, CheckCircle2, Lock, PlayCircle, X, MapPin } from "lucide-react"

export default function PathDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pathId = params.id as string

  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  
  const { data: path, isLoading, error } = usePath(pathId)
  const markComplete = useMarkComplete()

  const [activeTopic, setActiveTopic] = useState<any | null>(null)

  useEffect(() => {
    if (hydrated && !token) router.push("/login")
  }, [hydrated, token, router])

  if (!hydrated || !token) return null

  const { user } = useAuthStore()

  // Find the user's progress for this path
  const userProgress = (user as any)?.pathProgress?.find((p: any) => p.pathId === path?.id)
  const completedTopicIds = userProgress?.completedTopicIds || []

  // Create an array with lock status for UI rendering
  const topicsWithLockStatus = path?.topics.map((topic: any, index: number) => {
    const isCompleted = completedTopicIds.includes(topic.id)
    
    // In our linear progression, a topic is unlocked if it's the first topic OR the previous topic is completed
    const isUnlocked = index === 0 || completedTopicIds.includes(path.topics[index - 1].id)
    
    // The "current" topic is the first unlocked but uncompleted topic
    const isCurrent = isUnlocked && !isCompleted

    return {
      ...topic,
      isCompleted,
      isUnlocked,
      isCurrent,
      // For backwards compatibility with the UI code below
      completed: isCompleted
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#ea580c] font-mono animate-pulse">Loading Path Architecture...</div>
      </div>
    )
  }

  if (error || !path) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold font-mono mb-4 text-red-500">Path Not Found</h1>
        <button onClick={() => router.push('/paths')} className="text-sm font-mono text-[#ea580c] hover:underline">
          Return to Hub
        </button>
      </div>
    )
  }

  return (
    <main className="bg-[#050505] min-h-screen relative overflow-x-hidden pb-32 font-sans">
      {/* Premium Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ea580c]/5 via-[#050505] to-[#000]" />
      <div className="fixed inset-0 pointer-events-none -z-20 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 p-4 px-6 flex items-center justify-between">
        <button 
          onClick={() => router.push('/paths')}
          className="flex items-center text-sm font-mono text-[var(--text-secondary)] hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        <h1 className="text-sm font-bold text-white font-mono uppercase tracking-widest">{path.title}</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Tree / Mindmap Map */}
      <div className="max-w-4xl mx-auto mt-16 relative flex flex-col items-center">
        
        {/* Root Node */}
        <div className="relative w-full flex justify-center mb-12 z-20">
          <div className="bg-[#111] border border-white/10 px-8 py-3 rounded-md text-center shadow-lg">
            <h2 className="text-sm font-bold text-white font-mono tracking-widest uppercase">{path.title} Path</h2>
          </div>
          {/* Trunk descending from Root */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-12 bg-[#222] z-0" />
        </div>

        {topicsWithLockStatus?.map((topic: any, index: number) => {
          const isLeft = index % 2 === 0
          
          return (
            <div key={topic.id} className="relative w-full flex items-center mb-8 group">
              {/* Central Spine (Trunk) segment to next node */}
              {index < topicsWithLockStatus.length - 1 && (
                <div className={`absolute left-1/2 top-1/2 w-1 h-[calc(100%+2rem)] -translate-x-1/2 z-0
                  ${topic.completed ? 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'}
                `} />
              )}

              {/* Spine Intersection Node */}
              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#050505] border-[3px] z-20 transition-all duration-300
                ${topic.completed ? 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]' : topic.isCurrent ? 'border-[#ea580c] shadow-[0_0_20px_rgba(234,88,12,0.8)] scale-125' : 'border-white/20'}
              `} />
              {topic.isCurrent && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#ea580c]/30 rounded-full animate-ping z-10" />}

              {/* Left Side */}
              <div className={`w-1/2 flex justify-end pr-8 sm:pr-12 relative ${!isLeft && 'opacity-0 pointer-events-none'}`}>
                 {isLeft && (
                   <>
                     {/* Horizontal Branch connecting to Trunk */}
                     <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 sm:w-12 h-1 z-10 transition-colors
                        ${topic.completed ? 'bg-[#10b981]' : topic.isCurrent ? 'bg-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.5)]' : 'bg-white/10'}
                     `} />
                     
                     {/* Mindmap Box */}
                     <div 
                       onClick={() => { if (topic.isUnlocked) setActiveTopic(topic) }}
                       className={`w-full max-w-[340px] p-5 rounded-lg transition-all duration-300 relative backdrop-blur-md group-hover:scale-[1.02] group-hover:-translate-y-1 shadow-lg
                         ${topic.isUnlocked ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}
                         ${topic.completed ? 'bg-gradient-to-br from-[#10b981]/10 to-black/80 border border-white/10 border-r-[4px] border-r-[#10b981]' 
                           : topic.isCurrent ? 'bg-gradient-to-br from-[#ea580c]/20 to-black/80 border border-white/20 border-r-[4px] border-r-[#ea580c] shadow-[0_10px_30px_rgba(234,88,12,0.2)]' 
                           : 'bg-[#111]/80 border border-white/5 border-r-[4px] border-r-[#333] hover:bg-[#161616]/90'}
                       `}
                     >
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${topic.isCurrent ? 'bg-[#ea580c]/20 text-[#ea580c]' : 'bg-white/5 text-[var(--text-muted)]'}`}>Stage {index + 1}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">~{topic.estimatedMins}m</span>
                        </div>
                        <h3 className={`text-lg font-bold font-mono mb-2 ${topic.isCurrent ? 'text-white' : topic.isUnlocked ? 'text-white/90' : 'text-white/60'}`}>{topic.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] font-mono line-clamp-2">{topic.description}</p>
                     </div>
                   </>
                 )}
              </div>

              {/* Right Side */}
              <div className={`w-1/2 flex justify-start pl-8 sm:pl-12 relative ${isLeft && 'opacity-0 pointer-events-none'}`}>
                 {!isLeft && (
                   <>
                     {/* Horizontal Branch connecting to Trunk */}
                     <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 sm:w-12 h-1 z-10 transition-colors
                        ${topic.completed ? 'bg-[#10b981]' : topic.isCurrent ? 'bg-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.5)]' : 'bg-white/10'}
                     `} />
                     
                     {/* Mindmap Box */}
                     <div 
                       onClick={() => { if (topic.isUnlocked) setActiveTopic(topic) }}
                       className={`w-full max-w-[340px] p-5 rounded-lg transition-all duration-300 relative backdrop-blur-md group-hover:scale-[1.02] group-hover:-translate-y-1 shadow-lg
                         ${topic.isUnlocked ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}
                         ${topic.completed ? 'bg-gradient-to-br from-[#10b981]/10 to-black/80 border border-white/10 border-l-[4px] border-l-[#10b981]' 
                           : topic.isCurrent ? 'bg-gradient-to-br from-[#ea580c]/20 to-black/80 border border-white/20 border-l-[4px] border-l-[#ea580c] shadow-[0_10px_30px_rgba(234,88,12,0.2)]' 
                           : 'bg-[#111]/80 border border-white/5 border-l-[4px] border-l-[#333] hover:bg-[#161616]/90'}
                       `}
                     >
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${topic.isCurrent ? 'bg-[#ea580c]/20 text-[#ea580c]' : 'bg-white/5 text-[var(--text-muted)]'}`}>Stage {index + 1}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">~{topic.estimatedMins}m</span>
                        </div>
                        <h3 className={`text-lg font-bold font-mono mb-2 ${topic.isCurrent ? 'text-white' : topic.isUnlocked ? 'text-white/90' : 'text-white/60'}`}>{topic.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] font-mono line-clamp-2">{topic.description}</p>
                     </div>
                   </>
                 )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Topic Detail Modal Overlay */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setActiveTopic(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black text-white/70 hover:text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Content Area */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                {activeTopic.completed ? (
                  <CheckCircle2 size={24} className="text-[#10b981]" />
                ) : (
                  <PlayCircle size={24} className="text-[#ea580c]" />
                )}
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {activeTopic.title}
                </h2>
              </div>
              
              <div className="flex items-center space-x-4 mb-8 border-b border-white/10 pb-6">
                <div className="text-sm text-[var(--text-muted)] font-mono bg-white/5 px-3 py-1 rounded-md">
                  ~{activeTopic.estimatedMins} minutes
                </div>
                {activeTopic.completed && (
                  <div className="text-sm text-[#10b981] font-mono font-bold">
                    Completed
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest mb-3">Topic Overview</h3>
                <p className="text-[var(--text-secondary)] font-mono leading-relaxed">
                  {activeTopic.description}
                </p>
              </div>

              {/* Action Area */}
              <div className="mt-8 pt-6">
                {activeTopic.videoUrl ? (
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src={activeTopic.videoUrl.replace('watch?v=', 'embed/')}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-lg flex flex-col items-center justify-center border border-dashed border-white/20 bg-white/5">
                    <p className="text-[var(--text-muted)] font-mono">Video content unavailable</p>
                  </div>
                )}
                
                <div className="flex justify-end mt-6 space-x-4">
                  <button 
                    onClick={() => setActiveTopic(null)}
                    className="px-6 py-3 rounded-xl text-sm font-bold font-mono bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      markComplete.mutate({ topicId: activeTopic.id, completed: !activeTopic.completed })
                      setActiveTopic(null)
                    }}
                    disabled={markComplete.isPending}
                    className={`
                      px-8 py-3 rounded-xl text-sm font-bold font-mono transition-all
                      ${activeTopic.completed 
                        ? 'bg-transparent border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10' 
                        : 'bg-gradient-to-r from-[#ea580c] to-[#d97706] text-white shadow-[0_10px_25px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_35px_rgba(234,88,12,0.6)]'
                      }
                    `}
                  >
                    {markComplete.isPending ? 'Saving...' : activeTopic.completed ? 'Mark as Incomplete' : 'Complete Stage 🎉'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Required custom keyframes for the modal animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </main>
  )
}

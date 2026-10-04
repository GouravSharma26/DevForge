"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react"

export default function BlueprintPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // In a real app, we would fetch the specific blueprint data based on the ID.
  // For now, we render a generic blueprint template.

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#ff6b00] rounded-full blur-[150px] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <button 
          onClick={() => router.push('/learn')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          Back to Skill Tree
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center">
            <BookOpen size={32} className="text-[#ff6b00]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-space font-bold text-gray-100 mb-2">Blueprint: Core Fundamentals</h1>
            <p className="text-[#ff6b00] font-mono text-sm tracking-widest uppercase">Theory & Concepts</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            <div className="bg-[#161618] border border-white/5 rounded-2xl p-8 shadow-2xl leading-relaxed text-gray-300">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Understanding the Paradigm</h2>
              <p className="mb-4">
                Welcome to this Blueprint. In this sector, you will study the foundational theory required to advance through the forge. A strong understanding of these principles is critical before engaging in Anvil challenges.
              </p>
              <p className="mb-4">
                Algorithms and Data Structures form the backbone of modern computing. Your objective here is to absorb the structural patterns and time complexities associated with this module.
              </p>
              
              <div className="bg-black/50 border border-white/10 rounded-xl p-5 my-8 font-mono text-sm text-gray-400">
                <span className="text-[#ff6b00]">const</span> mastery = <span className="text-blue-400">await</span> <span className="text-green-400">absorbKnowledge</span>();<br/>
                if (!mastery) throw new Error(<span className="text-yellow-300">"Insufficient XP"</span>);
              </div>

              <h3 className="text-xl font-bold text-white mt-8 mb-4">Key Takeaways</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_8px_#ff6b00]"></div>
                  <span>Identify the correct data structure for O(1) lookups.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_8px_#ff6b00]"></div>
                  <span>Understand memory contiguity in low-level implementations.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161618] border border-[#ff6b00]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,107,0,0.05)]">
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">Status Terminal</h3>
              
              <button 
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all bg-[#ff6b00] text-black shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:bg-[#ff8533] flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Mark as Complete
              </button>
              
              <p className="text-[10px] text-gray-500 mt-4 text-center">
                Completing this blueprint unlocks subsequent Anvil challenges in the Skill Tree.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

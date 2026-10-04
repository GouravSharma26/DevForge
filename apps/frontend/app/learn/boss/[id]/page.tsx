"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShieldAlert, Swords } from "lucide-react"

export default function BossPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans relative overflow-hidden flex flex-col">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <button 
          onClick={() => router.push('/learn')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-wider self-start"
        >
          <ArrowLeft size={16} />
          Flee to Safety
        </button>

        <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-10vh]">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center relative z-10">
              <ShieldAlert size={64} className="text-red-500" />
            </div>
            <div className="absolute inset-0 bg-red-600 rounded-full blur-[50px] opacity-20"></div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-space font-bold text-gray-100 mb-4 tracking-tight">Grandmaster Trial</h1>
          <p className="text-red-500 font-mono text-sm tracking-[0.3em] uppercase font-bold mb-8">Boss Encounter Detected</p>
          
          <p className="text-gray-400 max-w-lg mx-auto mb-12 leading-relaxed">
            Warning: This sector contains a live mock interview challenge. You will be tested on all previous algorithmic concepts under severe time pressure.
          </p>

          <button 
            className="group relative px-8 py-4 bg-red-600 text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-red-500 hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
            <Swords size={20} />
            Engage Combat
          </button>
        </div>

      </div>
    </div>
  )
}

"use client"

import Link from 'next/link'
import { Terminal, ShieldAlert, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden font-sans">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff6b00]/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Error Code Glitch Container */}
        <div className="relative mb-8">
          <h1 className="text-[120px] md:text-[180px] font-bold font-mono leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#ff6b00] to-[#803500] drop-shadow-[0_0_40px_rgba(255,107,0,0.4)]">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-[#ff6b00]/50 blur-[2px] rotate-[-5deg]"></div>
        </div>

        {/* Messaging */}
        <div className="bg-[#111113]/80 backdrop-blur-md border border-[#ff6b00]/20 rounded-2xl p-8 w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-center gap-3 mb-4 text-[#ff6b00]">
            <ShieldAlert size={28} />
            <h2 className="text-2xl font-bold tracking-wider uppercase">Sector Not Found</h2>
          </div>
          
          <p className="text-gray-400 mb-6 font-mono text-sm leading-relaxed max-w-md mx-auto">
            The neural pathway you are attempting to traverse does not exist or has been corrupted. 
            <br/><br/>
            <span className="text-gray-500">{"// ERR_INVALID_COORDINATES"}</span>
          </p>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors w-full sm:w-auto"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <Link 
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide bg-[#ff6b00] hover:bg-[#ff8533] text-black shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all w-full sm:w-auto"
            >
              <Home size={16} />
              Return to Base
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

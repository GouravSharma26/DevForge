"use client"

import { HelpCircle, Star, Swords, Target, BookOpen, Mic, FileText, Zap, Trophy, Shield, ShieldQuestion } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-8 space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ea580c] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ea580c]/20">
          <HelpCircle size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-[#fdf6f0] tracking-tight">
          Welcome to DevForge
        </h1>
        <p className="text-[#8a7a6a] max-w-2xl text-lg">
          The ultimate platform to forge your skills, build standout resumes, and prove your mettle in the arena. Here is everything you need to know.
        </p>
      </div>

      {/* Feature Walkthrough */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#fdf6f0] flex items-center gap-3 font-mono border-b border-white/5 pb-4">
          <Target className="text-[#ea580c]" /> Core Features Walkthrough
        </h2>

        <div className="grid gap-6">
          <FeatureCard 
            icon={<FileText />}
            title="Resume Hub & Builder"
            description="Manage all your resumes in one place. Upload an existing PDF to instantly get an AI-powered ATS score breakdown, or use the Builder to craft a brand new one. The AI will automatically extract your skills, analyze your project impact, and suggest improvements."
          />
          <FeatureCard 
            icon={<Mic />}
            title="Interview Hub"
            description="Prepare for the real deal. DevForge uses cutting-edge AI to conduct realistic technical, behavioral, and system design interviews. It listens to your voice, evaluates your answers in real-time, and provides actionable feedback to help you ace your next big opportunity."
          />
          <FeatureCard 
            icon={<BookOpen />}
            title="Practice & Problems"
            description="Grind through our curated list of technical problems. From algorithms to system design, these challenges are tailored to your target role. Solving problems earns you XP, which contributes directly to your global rank."
          />
        </div>
      </section>

      {/* Ranking System */}
      <section className="space-y-6 mt-16">
        <h2 className="text-2xl font-bold text-[#fdf6f0] flex items-center gap-3 font-mono border-b border-white/5 pb-4">
          <Star className="text-[#84cc16]" /> The Ranking System
        </h2>
        
        <div className="p-6 rounded-2xl border border-white/5 bg-[#1c1614]/50 backdrop-blur-xl">
          <p className="text-[#8a7a6a] mb-6 leading-relaxed">
            Your journey on DevForge is tracked through a global ranking system. As you solve problems, complete interviews, and participate in the Arena, you earn <strong className="text-[#fdf6f0]">XP (Experience Points)</strong>. Hitting specific XP thresholds will automatically promote you to the next rank tier.
          </p>
          
          <div className="space-y-4">
            <RankTier tier="Beginner" levels="1, 2, 3" xp="0 - 1500 XP" color="text-[#10b981]" bg="bg-[#10b981]/10" />
            <RankTier tier="Intermediate" levels="1, 2, 3" xp="1500 - 3000 XP" color="text-[#3b82f6]" bg="bg-[#3b82f6]/10" />
            <RankTier tier="Advanced" levels="1, 2, 3" xp="3000 - 6000 XP" color="text-[#a855f7]" bg="bg-[#a855f7]/10" />
            <RankTier tier="Grandmaster" levels="Top Tier" xp="6000+ XP" color="text-[#f59e0b]" bg="bg-[#f59e0b]/10" isGrandmaster />
          </div>
        </div>
      </section>

      {/* The Arena */}
      <section className="space-y-6 mt-16">
        <h2 className="text-2xl font-bold text-[#fdf6f0] flex items-center gap-3 font-mono border-b border-white/5 pb-4">
          <Swords className="text-[#ef4444]" /> The PvP Arena
        </h2>
        
        <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-[#1c1614] to-[#ef4444]/5 backdrop-blur-xl">
          <p className="text-[#8a7a6a] mb-6 leading-relaxed">
            The Arena is where you put your skills to the ultimate test against real developers from around the world. It's a high-stakes competitive environment where your performance heavily impacts your XP. Compete, win, and level yourself up.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-5 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2 font-mono"><Zap size={16} className="text-[#eab308]" /> Matchmaking</h4>
              <p className="text-sm text-[#8a7a6a]">You can challenge real developers matching your current tier. Winning a match grants a massive XP boost, but losing will cost you. Choose your opponents wisely.</p>
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2 font-mono"><Trophy size={16} className="text-[#eab308]" /> Top Tier Competitors</h4>
              <p className="text-sm text-[#8a7a6a]">The ultimate challenge. Face off against Grandmaster-level developers who possess near-perfect system design and algorithmic knowledge. Defeating them proves you belong at the top.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-[#8a7a6a] flex items-center justify-center gap-2">
          <ShieldQuestion size={16} /> Have more questions? Feel free to explore the platform.
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-[#1c1614]/30 backdrop-blur-md flex gap-5 hover:bg-[#1c1614]/60 transition-colors">
      <div className="w-12 h-12 shrink-0 rounded-xl bg-[#ea580c]/10 text-[#ea580c] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#fdf6f0] mb-2">{title}</h3>
        <p className="text-[#8a7a6a] leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </div>
  )
}

function RankTier({ tier, levels, xp, color, bg, isGrandmaster = false }: { tier: string, levels: string, xp: string, color: string, bg: string, isGrandmaster?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center font-bold text-lg`}>
          {tier.charAt(0)}
        </div>
        <div>
          <h4 className={`font-bold ${color} font-mono`}>{tier}</h4>
          <p className="text-xs text-[#8a7a6a] mt-0.5">{isGrandmaster ? "The Apex" : `Levels: ${levels}`}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-mono text-[#fdf6f0] bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {xp}
        </span>
      </div>
    </div>
  )
}

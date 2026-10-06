"use client"

import { useState, useEffect } from "react"
import { HelpCircle, Swords, Target, BookOpen, Mic, FileText, Zap, Trophy, Shield, BrainCircuit, Code } from "lucide-react"
import { RankIcon } from "@/components/ui/RankIcon"

export default function AboutPage() {
  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 pt-12 md:pt-20 space-y-20 pb-32 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-highlight flex items-center justify-center shadow-lg shadow-[#ea580c]/30">
            <HelpCircle size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-black text-primary tracking-tight font-mono">
          THE DEVFORGE <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-highlight">CODEX</span>
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-relaxed">
          Welcome to the ultimate proving grounds. DevForge isn&apos;t just a learning platform—it&apos;s a gamified ecosystem designed to temper your skills, forge your career, and test your mettle in the Arena.
        </p>
      </div>

      {/* Interactive Core Loop Animation */}
      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary font-mono mb-3">The Forge Loop</h2>
          <p className="text-muted">How to ascend from an Iron Apprentice to an Ember Grandmaster.</p>
        </div>
        
        <CoreLoopAnimation />
      </section>

      {/* Feature Breakdown */}
      <section className="space-y-12">
        <FeatureSection 
          icon={<BookOpen className="text-blue-500" size={28} />}
          title="The Learning Hub"
          description="A dynamic, content-as-code learning tree. Master concepts through interactive nodes and prove your mastery in the Anvil."
          delay="delay-200"
        >
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-surface-theme/50 border border-border">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><BrainCircuit size={16} className="text-accent"/> Interactive Nodes</h4>
              <p className="text-sm text-muted leading-relaxed">Courses are structured as branching skill trees. Completing a node grants you <strong className="text-primary">+100 XP</strong>.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-theme/50 border border-border">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><Target size={16} className="text-accent"/> The Anvil Challenges</h4>
              <p className="text-sm text-muted leading-relaxed">At the end of a path lies the Anvil—a high-stakes coding sandbox with a time limit. Fix the bug, prove your worth, and earn massive XP.</p>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection 
          icon={<FileText className="text-emerald-500" size={28} />}
          title="Resume Hub & ATS Scoring"
          description="Your resume is your armor. Make sure it's impenetrable before you head into battle."
          delay="delay-300"
          reverse
        >
          <div className="grid gap-4 mt-6">
            <div className="flex gap-4 p-4 rounded-xl bg-surface-theme/50 border border-border items-start">
              <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">1</div>
              <div>
                <h4 className="font-bold text-primary mb-1">Upload & Parse</h4>
                <p className="text-sm text-muted">Upload your PDF. Our system extracts skills, gaps, and experience.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-surface-theme/50 border border-border items-start">
              <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">2</div>
              <div>
                <h4 className="font-bold text-primary mb-1">AI ATS Evaluation</h4>
                <p className="text-sm text-muted">The AI scores your resume out of 100 based on phrasing, impact metrics, and role alignment.</p>
              </div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection 
          icon={<Mic className="text-purple-500" size={28} />}
          title="The Interview Hub"
          description="Face off against our 1-on-1 AI Agent in a realistic voice-to-voice or text-based interview environment."
          delay="delay-500"
        >
           <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-surface-theme/50 border border-border">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><Mic size={16} className="text-purple-500"/> Realistic AI Agent</h4>
              <p className="text-sm text-muted leading-relaxed">The AI reads your resume, identifies your skill gaps, and grills you specifically on your weak points.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-theme/50 border border-border">
              <h4 className="font-bold text-primary mb-2 flex items-center gap-2"><Code size={16} className="text-purple-500"/> Grandmaster Sandbox</h4>
              <p className="text-sm text-muted leading-relaxed">Round 4 of your interview is a live coding sandbox. You must execute and fix buggy code in a Piston-powered terminal.</p>
            </div>
          </div>
        </FeatureSection>
      </section>

      {/* The RPG System */}
      <section className="space-y-12 pt-16 mt-16 border-t border-border/50 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700 fill-mode-both relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 blur-[100px] pointer-events-none" />
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-mono mb-4">The Ranking System</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">Earn XP to Level up. Gain Elo in the Arena to reach higher divisions.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <RankCard rank="Iron Apprentice" title="Lv. 1 - 4" desc="You have entered the forge." delay="delay-100" />
          <RankCard rank="Bronze Artificer" title="Lv. 5 - 9" desc="You are beginning to shape the code." delay="delay-200" />
          <RankCard rank="Silver Forgesmith" title="Lv. 10 - 14" desc="Your tools are sharpened." delay="delay-300" />
          <RankCard rank="Gold Innovator" title="Lv. 15 - 24" desc="Your architectures spark with brilliance." delay="delay-400" />
          <RankCard rank="Obsidian Architect" title="Lv. 25 - 49" desc="You build unbreakable systems." delay="delay-500" />
          <RankCard rank="Ember Grandmaster" title="Lv. 50+" desc="The Apex. The Forge is yours to command." delay="delay-600" />
        </div>
      </section>

      {/* The Arena */}
      <section className="mt-20 p-8 rounded-3xl border border-[#ef4444]/30 bg-gradient-to-br from-[#1c1614] to-[#ef4444]/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#ef4444]/20 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 font-mono mb-4">
            <Swords className="text-[#ef4444]" size={32} /> The PvP Arena
          </h2>
          <p className="text-zinc-300 max-w-2xl text-lg mb-8 leading-relaxed">
            The Arena is where you put your skills to the ultimate test against real developers. Compete in 1v1 duels or Battle Royales to earn <strong className="text-white">Competitive Elo</strong>.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2 font-mono"><Zap size={16} className="text-[#ef4444]" /> High Stakes</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">Winning an Arena match grants you Elo and massive XP (+150 for 1v1). Losing drops your Elo, but you still gain +25 XP for the combat experience.</p>
            </div>
            <div className="p-5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2 font-mono"><Trophy size={16} className="text-[#ef4444]" /> Leaderboards</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">Your Elo dictates your Competitive Division. Only the top 50 players globally can hold the title of Ember Grandmaster in the Arena.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <div className="mt-16 text-center">
        <p className="text-sm text-muted flex items-center justify-center gap-2 font-mono">
          <Shield size={16} className="text-accent" /> May your code compile on the first try.
        </p>
      </div>
    </div>
  )
}

function CoreLoopAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const steps = [
    { icon: <BookOpen />, label: "Learn", desc: "Master concepts in the Hub." },
    { icon: <FileText />, label: "Build", desc: "Craft an ATS-beating resume." },
    { icon: <Mic />, label: "Interview", desc: "Pass the AI Agent." },
    { icon: <Swords />, label: "Compete", desc: "Dominate the Arena." },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 rounded-3xl bg-surface-theme/20 border border-border backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-border -translate-y-1/2 z-0" />
        
        {/* Active Line (Desktop) */}
        <div 
          className="hidden md:block absolute top-1/2 left-[10%] h-1 bg-gradient-to-r from-accent to-highlight -translate-y-1/2 z-0 transition-all duration-700 ease-in-out" 
          style={{ width: `${(activeStep / (steps.length - 1)) * 80}%` }}
        />

        {steps.map((step, idx) => {
          const isActive = idx === activeStep
          const isPast = idx < activeStep
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-3 w-full md:w-32 group cursor-pointer" onClick={() => setActiveStep(idx)}>
              <div 
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl
                  ${isActive 
                    ? "bg-gradient-to-br from-accent to-highlight text-white scale-110 shadow-accent/40" 
                    : isPast 
                      ? "bg-accent/20 text-accent border border-accent/30" 
                      : "bg-surface-theme border border-border text-muted"
                  }
                `}
              >
                <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : ''}`}>
                  {step.icon}
                </div>
              </div>
              <div className="text-center">
                <div className={`font-bold font-mono transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted'}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100 text-muted' : 'opacity-0 md:opacity-100 md:text-muted/50'}`}>
                  {step.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureSection({ icon, title, description, children, reverse, delay }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode, reverse?: boolean, delay?: string }) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-16 items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ${delay} fill-mode-both`}>
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-theme border border-border flex items-center justify-center shadow-lg shadow-black/50">
            {icon}
          </div>
          <h2 className="text-3xl font-bold text-white font-mono">{title}</h2>
        </div>
        <p className="text-muted text-lg leading-relaxed border-l-2 border-accent/30 pl-4">
          {description}
        </p>
        {children}
      </div>
      <div className="flex-1 w-full relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative bg-[#121316] rounded-3xl border border-border aspect-[4/3] flex flex-col overflow-hidden shadow-2xl">
          {/* Faux Window Header */}
          <div className="h-8 border-b border-border bg-surface-theme/50 flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          {/* Grid Pattern Background */}
          <div className="flex-1 w-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center relative p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-[#121316]" />
            <div className="relative z-10 p-6 rounded-2xl bg-surface-theme/80 border border-border backdrop-blur-md flex flex-col items-center gap-4 shadow-xl">
               <Zap size={32} className="text-accent" />
               <div className="font-mono text-sm text-center text-muted">SYSTEM <span className="text-accent">ONLINE</span></div>
               <div className="w-32 h-1 bg-border rounded-full overflow-hidden">
                 <div className="w-2/3 h-full bg-accent animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankCard({ rank, title, desc, delay }: { rank: string, title: string, desc: string, delay?: string }) {
  return (
    <div className={`p-8 rounded-3xl border border-border bg-[#121316]/80 hover:bg-surface-theme/50 transition-all duration-500 group flex flex-col items-center text-center gap-5 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000 ${delay} fill-mode-both`}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <RankIcon rankTitle={rank} className="w-20 h-20 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500 drop-shadow-2xl relative z-10" />
      <div className="relative z-10">
        <h4 className="font-bold text-white font-mono text-xl mb-1">{rank}</h4>
        <div className="text-xs font-bold text-accent mb-3 uppercase tracking-widest">{title}</div>
        <p className="text-sm text-muted/90 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

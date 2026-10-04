"use client"

import SkillTreeGraph from '../components/SkillTreeGraph'
import { Settings } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function LearnPage() {
  const params = useParams()
  const treeId = params.treeId as string
  const [treeInfo, setTreeInfo] = useState<{title: string, description: string} | null>(null)
  
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTree() {
      if (!treeId) return
      try {
        const res = await api.get(`/learn/tree/${treeId}`)
        if (res.data.success && res.data.data) {
          if (res.data.data.tree) setTreeInfo(res.data.data.tree)
          
          // Adjust node configs for Left-to-Right orientation
          const formattedNodes = res.data.data.nodes.map((n: any) => ({
            ...n,
            type: 'skillNode',
            sourcePosition: 'right',
            targetPosition: 'left',
          }))

          const nodeStatusMap: Record<string, string> = {}
          formattedNodes.forEach((n: any) => {
            nodeStatusMap[n.id] = n.data.status
          })

          const formattedEdges = res.data.data.edges.map((e: any) => {
            const isTargetActive = nodeStatusMap[e.target] !== 'LOCKED'
            return {
              ...e,
              type: 'smoothstep',
              animated: false,
              style: isTargetActive 
                ? { stroke: '#ff6b00', strokeWidth: 1.5, strokeDasharray: '4 4' }
                : { stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }
            }
          })

          setNodes(formattedNodes)
          setEdges(formattedEdges)
        }
      } catch (err) {
        console.error("Failed to load skill tree:", err)
      } finally {
        setLoading(false)
      }
    }
    loadTree()
  }, [treeId])

  // Compute Milestones (Completed Nodes)
  const completedNodes = nodes.filter(n => n.data.status === 'COMPLETED')
  const recentMilestones = completedNodes.slice(-3).reverse() // get last 3

  // Compute Upcoming (Unlocked Nodes)
  const upcomingNodes = nodes.filter(n => n.data.status === 'UNLOCKED')
  const nextChallenges = upcomingNodes.slice(0, 3)

  if (loading) {
    return <div className="w-full h-[calc(100vh-56px)] bg-[#05070e] flex items-center justify-center text-[#ff6b00] font-mono animate-pulse font-bold tracking-widest">LOADING CONSTELLATION...</div>
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-56px)] bg-[#05070e] text-white overflow-hidden font-mono selection:bg-[#ff6b00]/30 selection:text-white">
      
      {/* TOP NAVBAR / HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-[#0a0a0c]/80 backdrop-blur-sm">
        
        {/* Left Side: Title */}
        <div className="flex flex-col border-l-2 border-[#ff6b00] pl-3 max-w-[35vw] md:max-w-[45vw]">
          <h1 className="text-xl font-bold tracking-widest text-gray-200 uppercase truncate" title={treeInfo?.title || 'SKILL TREE'}>{treeInfo?.title || 'SKILL TREE'}</h1>
          <p className="text-[#ff6b00] text-xs font-semibold uppercase tracking-wider truncate" title={treeInfo?.description || 'Current Path'}>{treeInfo?.description || 'Current Path'}</p>
        </div>

        {/* Center: Segmented Controls */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#1a1a1c] p-1 rounded-full border border-white/10">
          <button className="px-6 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-[#333] text-white shadow-[0_0_10px_rgba(255,107,0,0.2)] border border-[#ff6b00]/30">Tree</button>
          <button className="px-6 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full text-gray-400 hover:text-white transition-colors">Projects</button>
          <button className="px-6 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full text-gray-400 hover:text-white transition-colors">Challenges</button>
          <button className="px-6 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full text-gray-400 hover:text-white transition-colors">Paths</button>
        </div>

      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a0d16] to-[#04060a]">
        
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {/* Graph Area */}
        <div className="flex-1 relative z-0">
          <SkillTreeGraph initialNodes={nodes} initialEdges={edges} />
        </div>

        {/* Right Sidebar Overlay */}
        <div className="absolute right-6 top-6 bottom-6 w-80 flex flex-col gap-6 z-10 pointer-events-none">
          
          {/* Recent Milestones */}
          <div className="bg-[#161618] border border-white/5 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] pointer-events-auto relative overflow-hidden">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent"></div>
            
            <h3 className="text-gray-400 text-[11px] uppercase tracking-[0.2em] font-bold mb-5">Recent Milestones</h3>
            
            <div className="flex flex-col gap-4 relative">
              {recentMilestones.length === 0 ? (
                <p className="text-gray-600 text-xs text-center italic">No milestones yet.</p>
              ) : (
                <>
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-[#ff6b00] to-gray-700"></div>
                  {recentMilestones.map((node: any, idx) => (
                    <div key={node.id} className="flex gap-4 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-[#ff6b00]/20 border border-[#ff6b00] flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_5px_#ff6b00]"></div>
                      </div>
                      <div>
                        <p className="text-gray-200 text-sm font-semibold">{node.data.label}</p>
                        <p className="text-gray-500 text-[10px] uppercase">Node Completed</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Upcoming Challenges */}
          <div className="bg-[#161618] border border-white/5 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] pointer-events-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent"></div>

            <h3 className="text-gray-400 text-[11px] uppercase tracking-[0.2em] font-bold mb-5">Upcoming Challenges</h3>
            
            <div className="flex flex-col gap-3">
              {nextChallenges.length === 0 ? (
                <p className="text-gray-600 text-xs text-center italic">No upcoming challenges.</p>
              ) : (
                nextChallenges.map(node => (
                  <div key={node.id} className={`flex items-center gap-4 ${node.data.type === 'BOSS' ? 'bg-[#1e1e21] border border-[#ff6b00]/30 shadow-[inset_0_0_20px_rgba(255,107,0,0.05)]' : 'bg-[#1e1e21] border border-white/5'} rounded-lg p-3 relative overflow-hidden`}>
                    {node.data.type === 'BOSS' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6b00]"></div>}
                    <Settings size={22} className={`${node.data.type === 'BOSS' ? 'text-[#ff6b00]' : 'text-gray-600'} shrink-0 ml-2`} />
                    <div>
                      <p className={`${node.data.type === 'BOSS' ? 'text-gray-200' : 'text-gray-400'} text-xs font-bold uppercase tracking-wide leading-tight`}>
                        {node.data.type === 'BOSS' ? `Boss Fight: ${node.data.label}` : node.data.label}
                      </p>
                      <p className={`${node.data.type === 'BOSS' ? 'text-[#ff6b00]' : 'text-gray-600'} text-[10px] font-bold tracking-wider mt-1 uppercase`}>
                        {node.data.type === 'BOSS' ? 'Required: LVL 60+' : 'Ready to begin'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


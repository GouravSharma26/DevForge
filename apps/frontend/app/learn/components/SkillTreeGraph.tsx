"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import SkillNode from './SkillNode'
import { api } from '@/lib/api'

// Define the custom node types mapping
const nodeTypes = {
  skillNode: SkillNode,
}

export default function SkillTreeGraph({ initialNodes, initialEdges }: { initialNodes: any[], initialEdges: any[] }) {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({...params, type: 'smoothstep', style: { stroke: '#ff6b00', strokeWidth: 1.5, strokeDasharray: '4 4' }, animated: false}, eds)),
    [setEdges]
  )

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.data.status === 'LOCKED') {
      return
    }

    if (node.data.type === 'ANVIL' && node.data.problemSlug) {
      router.push(`/problems/${node.data.problemSlug}?mode=anvil&nodeId=${node.id}`)
    } else if (node.data.type === 'BOSS') {
      router.push(`/learn/boss/${node.id}`)
    } else {
      router.push(`/learn/blueprint/${node.id}`)
    }
  }



  return (
    <div className="w-full h-full overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="dark"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Controls className="!bg-[#111] !border-[#333] !fill-[#ff6b00] hidden md:flex" />
      </ReactFlow>

      {/* Legend at the bottom left */}
      <div className="absolute left-6 bottom-6 flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[#0b0e14]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5 pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_5px_#10b981]"></div> Mastered
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#facc15] shadow-[0_0_5px_#facc15]"></div> In Progress
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_5px_#ff6b00]"></div> Unlocked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#333]"></div> Locked
        </div>
        <div className="w-px h-3 bg-white/10 mx-2"></div>
        <div className="text-gray-600">NODE LATENCY: <span className="text-gray-400">0.4ms</span></div>
      </div>
    </div>
  )
}

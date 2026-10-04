"use client"

import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'
import { Lock, Search, Network, Settings, Waypoints, Box, AlignLeft, Database, Boxes, CheckCircle2 } from 'lucide-react'

// Map labels/types to Lucide icons that resemble the screenshot
const getIconForNode = (label: string, isBoss: boolean, isLocked: boolean) => {
  if (isLocked) return Lock
  if (isBoss) return Settings // The boss node in the image looks like a computer/screen, let's use Monitor or Settings
  
  const lower = label.toLowerCase()
  if (lower.includes('problem')) return Search
  if (lower.includes('algorithm')) return Network
  if (lower.includes('binary')) return Search
  if (lower.includes('two-pointer')) return Waypoints
  if (lower.includes('sort')) return AlignLeft
  if (lower.includes('tree') || lower.includes('graph')) return Network
  if (lower.includes('backtrack')) return Search
  if (lower.includes('dynamic')) return Settings
  if (lower.includes('database')) return Database
  if (lower.includes('microservice')) return Boxes
  
  return Box
}

export default memo(function SkillNode({ data, selected }: any) {
  const isLocked = data.status === "LOCKED"
  const isBoss = data.type === "BOSS"
  const isActive = data.status === "UNLOCKED" || data.status === "COMPLETED"
  const isCompleted = data.status === "COMPLETED"


  const Icon = getIconForNode(data.label, isBoss, isLocked)

  // Status resolution
  // Assuming 'COMPLETED' is Mastered, 'UNLOCKED' could be Unlocked or In Progress based on node ID (we'll just map UNLOCKED to Orange for now).
  let statusColor = "#333"
  let shadowGlow = "none"
  
  if (isCompleted) {
    statusColor = "#10b981" // Mastered
    shadowGlow = "0 0 15px rgba(16, 185, 129, 0.4)"
  } else if (isActive) {
    // Check if it's the very first node or something for 'In Progress' yellow vs 'Unlocked' orange
    // For simplicity, make Active = Orange, unless it has a specific tag.
    statusColor = "#ff6b00" 
    shadowGlow = "0 0 15px rgba(255, 107, 0, 0.4)"
  }

  // Node sizing - much smaller now
  const size = isBoss ? 64 : 48

  return (
    <div className="relative flex flex-col items-center group cursor-pointer" style={{ width: 120 }}>
      <Handle type="target" position={Position.Left} className="!opacity-0 border-0 bg-transparent" />
      
      {/* Node Shape */}
      <div 
        className="relative flex items-center justify-center transition-all duration-300 rounded-lg bg-[#0b0e14]"
        style={{ 
          width: size, 
          height: size,
          border: `1px solid ${statusColor}`,
          boxShadow: shadowGlow,
          transform: isBoss ? 'rotate(45deg)' : 'none',
          borderRadius: isBoss ? '8px' : '50%'
        }}
      >
        <div style={{ transform: isBoss ? 'rotate(-45deg)' : 'none' }}>
          <Icon size={isBoss ? 24 : 20} color={statusColor} strokeWidth={isLocked ? 1.5 : 2} className={isLocked ? "opacity-50" : ""} />
        </div>
      </div>

      {/* Label section below */}
      <div className="mt-4 text-center flex flex-col items-center w-[160px]">
        <h3 className={`font-mono font-bold text-[11px] leading-tight transition-colors mb-1 ${isLocked ? "text-gray-600" : "text-gray-200 group-hover:text-white"}`}>
          {data.label}
        </h3>
        
        <div className="flex items-center gap-1.5 justify-center">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: isActive ? `0 0 5px ${statusColor}` : 'none' }}></div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
            {isBoss ? "REQ LVL 60+" : "LVL 1"} 
            {isCompleted ? " • MASTERED" : (isActive ? " • ACTIVE" : "")}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!opacity-0 border-0 bg-transparent" />
    </div>
  )
})

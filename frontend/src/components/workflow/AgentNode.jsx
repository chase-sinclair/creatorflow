import { useState } from 'react'
import { Handle, Position } from 'reactflow'

// Left-border color + dot color by position in the flow
const ROLE = {
  entry: {
    border: '#10b981',   // emerald
    dot: 'bg-emerald-400',
    tag: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
    tagLabel: 'Entry',
  },
  processing: {
    border: '#7c3aed',   // violet
    dot: 'bg-violet-400',
    tag: 'text-violet-400 bg-violet-900/30 border-violet-700/40',
    tagLabel: 'Agent',
  },
  output: {
    border: '#a855f7',   // purple
    dot: 'bg-purple-400',
    tag: 'text-purple-400 bg-purple-900/30 border-purple-700/40',
    tagLabel: 'Output',
  },
}

export default function AgentNode({ data, selected }) {
  const r = ROLE[data.role] || ROLE.processing
  const [hovered, setHovered] = useState(false)
  const enlarged = hovered || selected

  return (
    // Root div: handles live here — do NOT scale this div, or handles detach from edges
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left handle (target) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-700 !border-slate-600 !w-2.5 !h-2.5"
      />

      {/* Inner visual div — this is what scales on hover/select */}
      <div
        style={{
          borderLeftColor: r.border,
          transform: enlarged ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          boxShadow: enlarged
            ? '0 8px 24px rgba(124,58,237,0.35)'
            : '0 4px 12px rgba(0,0,0,0.3)',
        }}
        className={`
          bg-[var(--color-surface-2)]
          border border-[var(--color-border)] border-l-4
          rounded-xl px-4 py-3
          min-w-[170px] max-w-[220px]
          cursor-pointer
          ${selected
            ? 'ring-2 ring-violet-500/50 border-violet-600/40'
            : hovered
            ? 'border-violet-600/30'
            : ''}
        `}
      >
        {/* Role tag */}
        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium mb-2 ${r.tag}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
          {r.tagLabel}
        </div>

        {/* Label */}
        <p className="text-white text-sm font-semibold leading-tight mb-1">{data.label}</p>

        {/* Description preview */}
        {data.description && (
          <p className="text-slate-500 text-[11px] leading-snug line-clamp-2">{data.description}</p>
        )}
      </div>

      {/* Right handle (source) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-700 !border-slate-600 !w-2.5 !h-2.5"
      />
    </div>
  )
}

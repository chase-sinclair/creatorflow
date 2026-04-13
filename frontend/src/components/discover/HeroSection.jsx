import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const NODE_POSITIONS = [
  { x: 40, y: 90, label: 'Trend Scanner', color: '#10b981' },
  { x: 180, y: 40, label: 'Script Writer', color: '#7c3aed' },
  { x: 180, y: 140, label: 'Image Gen', color: '#7c3aed' },
  { x: 320, y: 90, label: 'Publisher', color: '#a855f7' },
]

const EDGES = [
  { x1: 100, y1: 90, x2: 180, y2: 55 },
  { x1: 100, y1: 90, x2: 180, y2: 140 },
  { x1: 260, y1: 55, x2: 320, y2: 90 },
  { x1: 260, y1: 140, x2: 320, y2: 90 },
]

function WorkflowPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-full max-w-xl mx-auto"
    >
      {/* Outer glow ring */}
      <div className="absolute -inset-4 -z-10 blur-2xl opacity-30 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-3xl" />
      <div className="absolute -inset-8 -z-20 blur-3xl opacity-15 bg-violet-600 rounded-full" />

      <div className="rounded-2xl border border-violet-700/30 bg-[var(--color-surface-2)] p-6 shadow-2xl shadow-purple-900/40">
        <div className="text-xs text-slate-500 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Workflow running…
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-surface-3)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-surface-3)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-violet-700/50" />
          </div>
        </div>
        <svg viewBox="0 0 400 200" className="w-full" style={{ height: 200 }}>
          {EDGES.map((e, i) => (
            <motion.line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="rgba(139,92,246,0.5)"
              strokeWidth="2"
              strokeDasharray="5 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.15 }}
            />
          ))}
          {NODE_POSITIONS.map((node, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
            >
              {/* Node shadow/glow */}
              <rect
                x={node.x - 57}
                y={node.y - 22}
                width={114}
                height={44}
                rx={10}
                fill={node.color}
                fillOpacity="0.07"
              />
              <rect
                x={node.x - 57}
                y={node.y - 22}
                width={114}
                height={44}
                rx={10}
                fill="rgba(22,23,46,0.95)"
                stroke={node.color}
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <circle cx={node.x - 38} cy={node.y} r={5} fill={node.color} fillOpacity="0.9" />
              <text
                x={node.x - 26}
                y={node.y + 5}
                fontSize="11"
                fill="#e2e8f0"
                fontFamily="system-ui, sans-serif"
                fontWeight="500"
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            {['TikTok', 'Instagram', 'YouTube'].map((p) => (
              <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300">
                {p}
              </span>
            ))}
          </div>
          <span className="text-xs text-emerald-400/70">4 agents active</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300 text-sm mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            No account needed
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Design your social media automation.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
              Visually.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-xl mb-10 leading-relaxed"
          >
            Describe what you want to automate and CreatorFlow builds you a visual workflow — step by step, in plain English, no coding required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <button
              onClick={() => navigate('/brainstorm')}
              className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-base transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:-translate-y-0.5"
            >
              Start Building
            </button>
            <a
              href="#examples"
              className="px-7 py-3.5 rounded-xl border border-[var(--color-border)] hover:border-violet-600/50 text-slate-300 hover:text-white font-medium text-base transition-all"
            >
              See Examples
            </a>
          </motion.div>
        </div>

        {/* Right: workflow preview */}
        <WorkflowPreview />
      </div>
    </section>
  )
}

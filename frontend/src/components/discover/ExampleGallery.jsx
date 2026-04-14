import { useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import ReactFlow, { Background } from 'reactflow'
import AgentNode from '../workflow/AgentNode'
import { EXAMPLES, PLATFORM_COLORS } from '../../lib/constants'

// ── React Flow setup ──────────────────────────────────────────────────────────
const NODE_TYPES = { agentNode: AgentNode }

function linearRFNodes(labels) {
  return labels.map((label, i) => ({
    id: `n${i}`,
    type: 'agentNode',
    position: { x: i * 240, y: 0 },
    data: {
      label,
      description: '',
      tools: [], inputs: [], outputs: [],
      role: i === 0 ? 'entry' : i === labels.length - 1 ? 'output' : 'processing',
    },
  }))
}

function linearRFEdges(count) {
  return Array.from({ length: count - 1 }, (_, i) => ({
    id: `e${i}`,
    source: `n${i}`,
    target: `n${i + 1}`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'rgba(124,58,237,0.55)', strokeWidth: 1.8 },
    markerEnd: { type: 'arrowclosed', color: 'rgba(124,58,237,0.7)' },
  }))
}

// ── Archetype + colors ────────────────────────────────────────────────────────
const ARCHETYPE_LABELS = {
  trend_to_content:           'Trend → Content',
  source_transform_distribute: 'Transform & Distribute',
  monitor_engage_report:       'Monitor & Engage',
  schedule_generate_publish:   'Schedule & Publish',
}

const NODE_COLORS = ['#10b981', '#7c3aed', '#7c3aed', '#a855f7']

// ── Mini static SVG preview (on cards) ───────────────────────────────────────
function MiniWorkflow({ nodes }) {
  const count = Math.min(nodes.length, 4)
  const spacing = 220 / (count - 1 || 1)

  return (
    <svg viewBox="0 0 240 50" className="w-full" style={{ height: 50 }}>
      {nodes.slice(0, count).map((_, i) => {
        if (i < count - 1) {
          return (
            <line
              key={`e${i}`}
              x1={20 + i * spacing + 26} y1={25}
              x2={20 + (i + 1) * spacing - 6} y2={25}
              stroke="rgba(124,58,237,0.35)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          )
        }
        return null
      })}
      {nodes.slice(0, count).map((node, i) => (
        <g key={i}>
          <rect
            x={20 + i * spacing - 6} y={10}
            width={52} height={30} rx={6}
            fill="rgba(30,31,53,0.95)"
            stroke={NODE_COLORS[Math.min(i, NODE_COLORS.length - 1)]}
            strokeWidth="1" strokeOpacity="0.7"
          />
          <text
            x={20 + i * spacing + 20} y={28}
            fontSize="7" fill="#94a3b8"
            fontFamily="system-ui"
            textAnchor="middle" dominantBaseline="middle"
          >
            {node.length > 10 ? node.slice(0, 9) + '…' : node}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Example modal with React Flow canvas ─────────────────────────────────────
function ExampleModal({ example, onClose }) {
  const navigate = useNavigate()
  const rfNodes = useMemo(() => linearRFNodes(example.nodes), [example])
  const rfEdges = useMemo(() => linearRFEdges(example.nodes.length), [example])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-400">
                {example.persona}
              </span>
              <span className="text-xs text-slate-600">{ARCHETYPE_LABELS[example.archetype]}</span>
            </div>
            <h3 className="text-white font-bold text-lg">{example.title}</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">{example.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg border border-[var(--color-border)] text-slate-500 hover:text-white hover:border-violet-600/40 flex items-center justify-center transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* React Flow preview */}
        <div style={{ height: 220 }} className="border-b border-[var(--color-border)]">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={NODE_TYPES}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(124,58,237,0.06)" gap={28} size={1} />
          </ReactFlow>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap gap-1.5">
            {example.platforms.map(p => (
              <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[p] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {p}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate('/brainstorm', { state: { prefill: example.description } })}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/30"
          >
            Build this →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Example card ──────────────────────────────────────────────────────────────
function ExampleCard({ example, index, onClick }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={() => onClick(example)}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 cursor-pointer hover:border-violet-600/50 hover:bg-[var(--color-surface-3)] transition-all duration-200 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-semibold text-base group-hover:text-violet-300 transition-colors">
          {example.title}
        </h3>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-700/30 text-violet-400">
          {example.persona}
        </span>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{example.description}</p>

      <div className="rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
        <MiniWorkflow nodes={example.nodes} />
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {example.platforms.map((p) => (
          <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[p] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            {p}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-600 group-hover:text-violet-500 transition-colors">
          View workflow →
        </span>
      </div>
    </motion.div>
  )
}

// ── Gallery section ───────────────────────────────────────────────────────────
export default function ExampleGallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [openExample, setOpenExample] = useState(null)

  return (
    <>
      <section id="examples" className="py-16 px-6 bg-[var(--color-surface-2)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">Examples</p>
            <h2 className="text-4xl font-bold text-white mb-4">See what others have built</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Real workflow ideas across content creation, marketing, podcasting, and small business.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLES.map((ex, i) => (
              <ExampleCard key={ex.id} example={ex} index={i} onClick={setOpenExample} />
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {openExample && (
          <ExampleModal
            key="example-modal"
            example={openExample}
            onClose={() => setOpenExample(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

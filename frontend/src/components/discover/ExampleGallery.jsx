import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EXAMPLES, PLATFORM_COLORS } from '../../lib/constants'

const ARCHETYPE_LABELS = {
  trend_to_content: 'Trend → Content',
  source_transform_distribute: 'Transform & Distribute',
  monitor_engage_report: 'Monitor & Engage',
  schedule_generate_publish: 'Schedule & Publish',
}

const NODE_COLORS = ['#10b981', '#7c3aed', '#7c3aed', '#a855f7']

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
              x1={20 + i * spacing + 26}
              y1={25}
              x2={20 + (i + 1) * spacing - 6}
              y2={25}
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
            x={20 + i * spacing - 6}
            y={10}
            width={52}
            height={30}
            rx={6}
            fill="rgba(30,31,53,0.95)"
            stroke={NODE_COLORS[Math.min(i, NODE_COLORS.length - 1)]}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <text
            x={20 + i * spacing + 20}
            y={28}
            fontSize="7"
            fill="#94a3b8"
            fontFamily="system-ui"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {node.length > 10 ? node.slice(0, 9) + '…' : node}
          </text>
        </g>
      ))}
    </svg>
  )
}

function ExampleCard({ example, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={() => console.log('Example clicked:', example.title)}
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
        <span className="ml-auto text-xs text-slate-600">{ARCHETYPE_LABELS[example.archetype]}</span>
      </div>
    </motion.div>
  )
}

export default function ExampleGallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="examples" className="py-24 px-6 bg-[var(--color-surface-2)]">
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
            <ExampleCard key={ex.id} example={ex} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

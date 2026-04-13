import { motion } from 'framer-motion'

// Animated node/edge preview shown during workflow generation
const NODES = [
  { cx: 80,  cy: 80,  r: 22, color: '#10b981', delay: 0 },
  { cx: 220, cy: 50,  r: 18, color: '#7c3aed', delay: 0.15 },
  { cx: 220, cy: 130, r: 18, color: '#7c3aed', delay: 0.3 },
  { cx: 360, cy: 80,  r: 22, color: '#a855f7', delay: 0.45 },
]
const EDGES = [
  { x1: 102, y1: 72,  x2: 202, y2: 58 },
  { x1: 102, y1: 88,  x2: 202, y2: 122 },
  { x1: 238, y1: 58,  x2: 338, y2: 72 },
  { x1: 238, y1: 122, x2: 338, y2: 88 },
]

export default function GeneratingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-surface)]/95 backdrop-blur-sm"
    >
      {/* Animated graph */}
      <div className="relative mb-10">
        <svg width="440" height="180" viewBox="0 0 440 180" className="opacity-90">
          {EDGES.map((e, i) => (
            <motion.line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="rgba(124,58,237,0.5)"
              strokeWidth="2"
              strokeDasharray="5 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
            />
          ))}
          {NODES.map((n, i) => (
            <motion.g key={i}>
              <motion.circle
                cx={n.cx} cy={n.cy} r={n.r}
                fill={n.color}
                fillOpacity="0.15"
                stroke={n.color}
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: n.delay, type: 'spring', stiffness: 200 }}
                style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
              />
              {/* Pulse ring */}
              <motion.circle
                cx={n.cx} cy={n.cy} r={n.r}
                fill="none"
                stroke={n.color}
                strokeWidth="1.5"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.4, delay: n.delay + 0.3, repeat: Infinity, ease: 'easeOut' }}
                style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
              />
            </motion.g>
          ))}
        </svg>

        {/* Moving dot along edges */}
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-500/60"
          style={{ top: 73, left: 74 }}
          animate={{
            x: [0, 140, 140, 280],
            y: [0, -22, 50, 0],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
        />
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Designing your workflow…</h2>
        <p className="text-slate-400 text-base">
          Our AI is mapping out your automation step by step.
        </p>
      </motion.div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  )
}

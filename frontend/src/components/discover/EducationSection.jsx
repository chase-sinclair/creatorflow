import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const CARDS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
      </svg>
    ),
    title: 'What is an agent?',
    body: 'An agent is a small AI worker with one job — like "find trending topics" or "write a caption." Agents work in sequence, passing results to the next one, like a well-organized team.',
    color: 'text-violet-400',
    border: 'border-violet-700/30',
    glow: 'bg-violet-900/20',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
      </svg>
    ),
    title: 'What does automation save you?',
    body: "Hours of repetitive work — researching trends, writing captions, resizing content for each platform, scheduling posts. Automation does the tedious parts so you focus on what only you can do.",
    color: 'text-emerald-400',
    border: 'border-emerald-700/30',
    glow: 'bg-emerald-900/20',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14v7M14 17.5h7" strokeLinecap="round" />
      </svg>
    ),
    title: 'What kinds of workflows are possible?',
    body: "Trend scanning → content creation → publishing. Podcast recording → clipping → social distribution. Brand monitoring → reply drafting → reporting. If it's repetitive and involves content, it can be automated.",
    color: 'text-sky-400',
    border: 'border-sky-700/30',
    glow: 'bg-sky-900/20',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
    title: 'Do I need to know how to code?',
    body: "Not at all. You describe what you want in plain English. CreatorFlow handles the technical design. The output is a visual diagram and plain-English brief you can share with a developer — or keep for yourself.",
    color: 'text-amber-400',
    border: 'border-amber-700/30',
    glow: 'bg-amber-900/20',
  },
]

function Card({ card, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`rounded-2xl border ${card.border} ${card.glow} p-6 flex flex-col gap-4`}
    >
      <div className={`${card.color} w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-surface-3)]`}>
        {card.icon}
      </div>
      <h3 className="text-white font-semibold text-lg">{card.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{card.body}</p>
    </motion.div>
  )
}

export default function EducationSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-bold text-white mb-4">Automation, explained simply</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No jargon. No engineering degree required. Here's what you actually need to know.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((card, i) => (
            <Card key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

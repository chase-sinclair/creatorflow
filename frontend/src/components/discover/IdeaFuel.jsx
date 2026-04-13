import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { IDEA_PROMPTS } from '../../lib/constants'

const PERSONAS = Object.keys(IDEA_PROMPTS)

export default function IdeaFuel() {
  const [active, setActive] = useState(PERSONAS[0])
  const navigate = useNavigate()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const handleBuild = (promptText) => {
    console.log('Build this:', promptText)
    navigate('/brainstorm', { state: { prefill: promptText } })
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">Idea Fuel</p>
          <h2 className="text-4xl font-bold text-white mb-4">Not sure where to start?</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Pick a workflow idea that fits your situation and we'll build it with you.
          </p>
        </motion.div>

        {/* Persona tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {PERSONAS.map((p) => (
            <button
              key={p}
              onClick={() => setActive(p)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                active === p
                  ? 'bg-violet-600 text-white shadow-lg shadow-purple-900/30'
                  : 'border border-[var(--color-border)] text-slate-400 hover:border-violet-600/50 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </motion.div>

        {/* Prompt cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="grid sm:grid-cols-3 gap-5"
          >
            {IDEA_PROMPTS[active].map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 flex flex-col gap-5 hover:border-violet-600/40 transition-colors"
              >
                <p className="text-slate-300 text-sm leading-relaxed flex-1">"{prompt.text}"</p>
                <button
                  onClick={() => handleBuild(prompt.text)}
                  className="w-full py-2.5 rounded-lg bg-violet-900/40 border border-violet-700/40 text-violet-300 hover:bg-violet-600 hover:text-white hover:border-violet-500 text-sm font-medium transition-all"
                >
                  Build this →
                </button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

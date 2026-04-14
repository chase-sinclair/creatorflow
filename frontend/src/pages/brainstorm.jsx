import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/shared/Navbar'
import ProgressIndicator from '../components/shared/ProgressIndicator'
import GeneratingOverlay from '../components/brainstorm/GeneratingOverlay'
import PlatformSelector from '../components/brainstorm/PlatformSelector'
import { brainstormStart, brainstormRespond, generateWorkflow, getPromptSuggestions } from '../lib/api'

// ── Logo icon used in CreatorFlow messages ───────────────────────────────────
function BotAvatar() {
  return (
    <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-900/30">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="4" cy="8" r="2.5" fill="white" />
        <circle cx="12" cy="4" r="2.5" fill="white" fillOpacity="0.7" />
        <circle cx="12" cy="12" r="2.5" fill="white" fillOpacity="0.7" />
        <line x1="6.5" y1="7" x2="10" y2="4.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="6.5" y1="9" x2="10" y2="11.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
    </div>
  )
}

const DEFAULT_CHIPS = [
  "Automatically post trending content as short-form videos",
  "Clip highlights from podcasts and upload to YouTube",
  "Schedule and publish weekly content across all my platforms",
  "Monitor brand mentions and auto-reply to comments",
]

// ── Individual chat message ──────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  const isConfirmation = msg.type === 'confirmation'
  const isWelcome = msg.type === 'welcome'

  if (isWelcome) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3 items-start"
      >
        <BotAvatar />
        <div className="flex-1">
          <div className="max-w-md px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-slate-200 text-sm leading-relaxed mb-3">
            {msg.text}
          </div>
          {msg.onChipClick && (
            <div className="flex flex-wrap gap-2">
              {msg.chipsLoading ? (
                // Skeleton chips while fetching suggestions
                [1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-7 rounded-full bg-violet-900/20 border border-violet-800/20 animate-pulse"
                    style={{ width: 120 + i * 18 }}
                  />
                ))
              ) : (
                (msg.chips || DEFAULT_CHIPS).map((chip, i) => (
                  <motion.button
                    key={chip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + i * 0.07 }}
                    onClick={() => msg.onChipClick(chip)}
                    className="px-3 py-1.5 rounded-full border border-violet-700/40 bg-violet-900/20 text-violet-300 text-xs hover:bg-violet-900/50 hover:border-violet-500/60 hover:text-white transition-all"
                  >
                    {chip}
                  </motion.button>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  if (isConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex gap-3 items-start"
      >
        <BotAvatar />
        <div className="flex-1 max-w-lg">
          <div className="rounded-2xl rounded-tl-sm bg-[var(--color-surface-2)] border border-violet-700/40 p-5">
            <p className="text-violet-300 text-xs font-medium uppercase tracking-wider mb-2">Ready to build</p>
            <p className="text-white text-sm leading-relaxed mb-4">{msg.text}</p>
            <div className="flex gap-2">
              <button
                onClick={msg.onConfirm}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/30"
              >
                Looks good, build it
              </button>
              <button
                onClick={msg.onAdjust}
                className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-slate-400 hover:text-white hover:border-violet-600/50 text-sm transition-all"
              >
                Let me adjust
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && <BotAvatar />}
      <div
        className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-violet-600 text-white'
            : 'rounded-tl-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-slate-200'
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 items-start"
    >
      <BotAvatar />
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-500"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Step cards shown in empty space before conversation starts ───────────────
const STEPS_INFO = [
  {
    n: '1',
    label: 'Shape your idea',
    desc: 'Describe what you want to automate. We\'ll ask a few quick questions to understand your goal.',
    color: 'text-violet-400',
    bg: 'bg-violet-900/20',
    border: 'border-violet-700/30',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="9" cy="9" r="7" />
        <path d="M9 6v3l2 2" />
      </svg>
    ),
  },
  {
    n: '2',
    label: 'Designing your workflow',
    desc: 'Our AI maps out your automation as a visual step-by-step pipeline — agents, tools, and handoffs.',
    color: 'text-sky-400',
    bg: 'bg-sky-900/20',
    border: 'border-sky-700/30',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="6" width="4" height="6" rx="1.5" />
        <rect x="7" y="3" width="4" height="5" rx="1.5" />
        <rect x="7" y="10" width="4" height="5" rx="1.5" />
        <rect x="12" y="6" width="4" height="6" rx="1.5" />
        <path d="M6 9h1M11 5.5l1 1M11 12.5l1-1" />
      </svg>
    ),
  },
  {
    n: '3',
    label: 'Refine and share',
    desc: 'Tweak the workflow with follow-up chat, export a PDF brief, or share a link with your team.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/30',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 9l4 4 8-8" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function StepCards({ compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className={`flex flex-col gap-2 ${compact ? '' : 'grid grid-cols-3 mt-2'}`}
    >
      {STEPS_INFO.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          className={`rounded-xl border ${s.border} ${s.bg} flex items-start gap-3 ${compact ? 'p-3' : 'p-4 flex-col gap-2'}`}
        >
          <div className={`${s.color} shrink-0 mt-0.5`}>{s.icon}</div>
          <div>
            <p className={`text-white font-semibold ${compact ? 'text-xs mb-0.5' : 'text-xs mb-1'}`}>{s.label}</p>
            {!compact && <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>}
            {compact && <p className="text-slate-500 text-[11px] leading-relaxed">{s.desc}</p>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Cycling workflow preview ──────────────────────────────────────────────────
const WORKFLOW_CYCLES = [
  {
    label: 'Trend → Content → Publish',
    nodes: [
      { x: 40,  y: 50, label: 'Trend Scanner',   color: '#10b981' },
      { x: 155, y: 25, label: 'Script Writer',    color: '#7c3aed' },
      { x: 155, y: 75, label: 'Image Gen',        color: '#7c3aed' },
      { x: 270, y: 50, label: 'Publisher',        color: '#a855f7' },
    ],
    edges: [
      { x1: 95,  y1: 45, x2: 130, y2: 32 },
      { x1: 95,  y1: 55, x2: 130, y2: 68 },
      { x1: 215, y1: 32, x2: 240, y2: 44 },
      { x1: 215, y1: 68, x2: 240, y2: 56 },
    ],
  },
  {
    label: 'Podcast → Clips → Distribute',
    nodes: [
      { x: 40,  y: 50, label: 'Audio Ingester',  color: '#10b981' },
      { x: 155, y: 50, label: 'Transcriber',     color: '#7c3aed' },
      { x: 270, y: 25, label: 'Clip Picker',     color: '#7c3aed' },
      { x: 270, y: 75, label: 'Publisher',       color: '#a855f7' },
    ],
    edges: [
      { x1: 95,  y1: 50, x2: 130, y2: 50 },
      { x1: 210, y1: 43, x2: 245, y2: 32 },
      { x1: 210, y1: 57, x2: 245, y2: 68 },
    ],
  },
  {
    label: 'Monitor → Engage → Report',
    nodes: [
      { x: 40,  y: 50, label: 'Mention Listener', color: '#10b981' },
      { x: 155, y: 50, label: 'Classifier',       color: '#7c3aed' },
      { x: 270, y: 25, label: 'Reply Drafter',    color: '#7c3aed' },
      { x: 270, y: 75, label: 'Report Builder',   color: '#a855f7' },
    ],
    edges: [
      { x1: 95,  y1: 50, x2: 130, y2: 50 },
      { x1: 210, y1: 43, x2: 245, y2: 32 },
      { x1: 210, y1: 57, x2: 245, y2: 68 },
    ],
  },
]

function WorkflowPreviewCycle() {
  const [cycleIdx, setCycleIdx] = useState(0)
  const [phase, setPhase] = useState('building') // 'building' | 'visible' | 'fading'
  const [visibleNodes, setVisibleNodes] = useState(0)
  const [visibleEdges, setVisibleEdges] = useState(0)
  const wf = WORKFLOW_CYCLES[cycleIdx]

  useEffect(() => {
    setPhase('building')
    setVisibleNodes(0)
    setVisibleEdges(0)

    // Reveal nodes one by one
    let n = 0
    const nodeTimer = setInterval(() => {
      n++
      setVisibleNodes(n)
      if (n >= wf.nodes.length) clearInterval(nodeTimer)
    }, 280)

    // Reveal edges shortly after nodes
    let e = 0
    const edgeTimer = setTimeout(() => {
      const et = setInterval(() => {
        e++
        setVisibleEdges(e)
        if (e >= wf.edges.length) {
          clearInterval(et)
          setPhase('visible')
        }
      }, 220)
      return () => clearInterval(et)
    }, 350)

    // Hold then cycle
    const cycleTimer = setTimeout(() => {
      setPhase('fading')
      setTimeout(() => {
        setCycleIdx(i => (i + 1) % WORKFLOW_CYCLES.length)
      }, 400)
    }, 3200)

    return () => {
      clearInterval(nodeTimer)
      clearTimeout(edgeTimer)
      clearTimeout(cycleTimer)
    }
  }, [cycleIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="flex flex-col items-center justify-center flex-1 py-4 select-none pointer-events-none"
    >
      <motion.div
        animate={{ opacity: phase === 'fading' ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-3"
      >
        <svg width="340" height="100" viewBox="0 0 340 100">
          {/* Edges */}
          {wf.edges.map((e, i) =>
            i < visibleEdges ? (
              <motion.line
                key={`${cycleIdx}-e${i}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="rgba(124,58,237,0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            ) : null
          )}
          {/* Nodes */}
          {wf.nodes.map((n, i) =>
            i < visibleNodes ? (
              <motion.g
                key={`${cycleIdx}-n${i}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 260 }}
                style={{ transformOrigin: `${n.x + 27}px ${n.y}px` }}
              >
                <rect
                  x={n.x} y={n.y - 14}
                  width={90} height={28}
                  rx={7}
                  fill="rgba(20,21,40,0.85)"
                  stroke={n.color}
                  strokeWidth="1.2"
                  strokeOpacity="0.7"
                />
                <circle cx={n.x + 11} cy={n.y} r={3.5} fill={n.color} fillOpacity="0.85" />
                <text
                  x={n.x + 20} y={n.y + 4}
                  fontSize="8.5"
                  fill="#cbd5e1"
                  fontFamily="system-ui, sans-serif"
                >
                  {n.label}
                </text>
              </motion.g>
            ) : null
          )}
        </svg>
        <p className="text-slate-600 text-xs tracking-wide">{wf.label}</p>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BrainstormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 'platforms' = show selector, 'chat' = conversation active
  const [view, setView] = useState('platforms')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [promptChips, setPromptChips] = useState(null)    // null = not loaded yet
  const [chipsLoading, setChipsLoading] = useState(false)

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      type: 'welcome',
      text: "What do you want to automate? Describe it in your own words — no technical knowledge needed.",
    },
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [inputDisabled, setInputDisabled] = useState(false)
  const [step, setStep] = useState(1)

  // Page title
  useEffect(() => { document.title = 'Brainstorm · CreatorFlow' }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Handle "Build this" prefill from Discover page — skip platform selector
  useEffect(() => {
    const prefill = location.state?.prefill
    if (prefill) {
      setView('chat')
      setInput(prefill)
      setTimeout(() => handleSubmitIdea(prefill, []), 400)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Platform selection complete ──────────────────────────────────────────
  const handlePlatformsNext = useCallback((platforms) => {
    setSelectedPlatforms(platforms)
    setView('chat')

    // Update welcome message chips to show loading state immediately
    setChipsLoading(true)
    setMessages(prev => prev.map(m =>
      m.id === 'welcome' ? { ...m, chipsLoading: true } : m
    ))

    // Fetch dynamic suggestions in background
    getPromptSuggestions(platforms)
      .then(({ data }) => {
        setPromptChips(data.suggestions)
        setMessages(prev => prev.map(m =>
          m.id === 'welcome'
            ? { ...m, chips: data.suggestions, chipsLoading: false }
            : m
        ))
      })
      .catch(() => {
        // Silently fall back to defaults
        setMessages(prev => prev.map(m =>
          m.id === 'welcome' ? { ...m, chipsLoading: false } : m
        ))
      })
      .finally(() => setChipsLoading(false))
  }, [])

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }])
  }

  // ── First submit: call brainstorm/start ──────────────────────────────────
  const handleSubmitIdea = async (ideaText, platforms) => {
    const text = (ideaText ?? input).trim()
    if (!text) return

    // Use passed platforms arg (for prefill case) or current selectedPlatforms
    const platformsToSend = platforms !== undefined ? platforms : selectedPlatforms

    setInput('')
    setError(null)
    addMessage({ role: 'user', text })
    setIsTyping(true)
    setInputDisabled(true)

    try {
      const { data } = await brainstormStart(text, platformsToSend)
      setSessionId(data.session_id)
      setIsTyping(false)

      if (data.ready_to_generate) {
        showConfirmationCard(data.idea_summary, data.session_id)
      } else {
        addMessage({ role: 'bot', text: data.question })
        setInputDisabled(false)
        inputRef.current?.focus()
      }
    } catch (err) {
      setIsTyping(false)
      setInputDisabled(false)
      setError("Something went wrong — please try again.")
    }
  }

  // ── Subsequent submits: call brainstorm/respond ──────────────────────────
  const handleSubmitAnswer = async () => {
    const text = input.trim()
    if (!text || !sessionId) return

    setInput('')
    setError(null)
    addMessage({ role: 'user', text })
    setIsTyping(true)
    setInputDisabled(true)

    try {
      const { data } = await brainstormRespond(sessionId, text)
      setIsTyping(false)

      if (data.ready_to_generate) {
        showConfirmationCard(data.idea_summary, sessionId)
      } else {
        addMessage({ role: 'bot', text: data.question })
        setInputDisabled(false)
        inputRef.current?.focus()
      }
    } catch (err) {
      setIsTyping(false)
      setInputDisabled(false)
      setError("Something went wrong — please try again.")
    }
  }

  // ── Show confirmation card ───────────────────────────────────────────────
  const showConfirmationCard = (ideaSummary, sid) => {
    addMessage({
      role: 'bot',
      type: 'confirmation',
      text: ideaSummary,
      onConfirm: () => handleGenerate(sid),
      onAdjust: () => {
        setInputDisabled(false)
        addMessage({ role: 'bot', text: "No problem! Add anything you'd like to change or clarify." })
        inputRef.current?.focus()
      },
    })
  }

  // ── Generate workflow ────────────────────────────────────────────────────
  const handleGenerate = async (sid) => {
    setIsGenerating(true)
    setStep(2)
    try {
      const { data } = await generateWorkflow(sid)
      navigate(`/workflow/${data.workflow_id}`, { state: { workflowData: data } })
    } catch (err) {
      setIsGenerating(false)
      setStep(1)
      setError("Workflow generation failed — please try again.")
    }
  }

  // ── Input submit routing ─────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!sessionId) {
      handleSubmitIdea(undefined, undefined)
    } else {
      handleSubmitAnswer()
    }
  }

  const inputBar = (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 items-end sticky bottom-0 pb-2"
    >
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={inputDisabled}
          placeholder={
            sessionId
              ? 'Type your answer…'
              : 'Describe your idea in plain English…'
          }
          rows={1}
          className="w-full resize-none rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-violet-600/60 focus:outline-none px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-colors disabled:opacity-40"
          style={{ minHeight: 48, maxHeight: 120, overflowY: 'auto' }}
        />
      </div>
      <button
        type="submit"
        disabled={inputDisabled || !input.trim()}
        className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-purple-900/30 shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M9 3l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  )

  return (
    <>
      {isGenerating && <GeneratingOverlay />}

      {/* Platform selector — shown before chat starts */}
      <AnimatePresence>
        {view === 'platforms' && (
          <PlatformSelector key="platform-selector" onNext={handlePlatformsNext} />
        )}
      </AnimatePresence>

      <div className={`flex flex-col min-h-screen transition-opacity duration-300 ${view === 'platforms' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Navbar />

        <div className="border-b border-[var(--color-border)]">
          <ProgressIndicator step={step} />
        </div>

        {/* Platform tags strip — visible once platforms are selected */}
        {selectedPlatforms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <span className="text-slate-600 text-xs shrink-0">Platforms:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedPlatforms.map(p => (
                <span
                  key={p}
                  className="text-xs px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-700/40 text-violet-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <main className="flex-1 flex flex-col">
          <div className={`flex-1 flex flex-col w-full mx-auto px-4 lg:px-6 pt-6 pb-4 ${!sessionId ? 'lg:flex-row lg:items-start max-w-5xl gap-8' : 'max-w-2xl'}`}>

            {/* Left / main column: chat + input */}
            <div className={`flex flex-col min-w-0 ${!sessionId ? 'flex-1' : 'flex-1'}`}>
              <div className="flex flex-col gap-4 overflow-y-auto mb-4">
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <ChatMessage
                      key={msg.id}
                      msg={
                        msg.type === 'welcome'
                          ? {
                              ...msg,
                              onChipClick: sessionId ? null : (chip) => handleSubmitIdea(chip, undefined),
                            }
                          : msg
                      }
                    />
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {isTyping && <TypingIndicator key="typing" />}
                </AnimatePresence>

                {/* Inline error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <BotAvatar />
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-red-900/20 border border-red-700/40 text-red-300 text-sm">
                        {error}{' '}
                        <button
                          onClick={() => setError(null)}
                          className="underline hover:no-underline ml-1"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Mobile only: step cards + preview sit above input */}
              <AnimatePresence>
                {!sessionId && (
                  <motion.div
                    key="mobile-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="lg:hidden flex flex-col gap-3 mb-4"
                  >
                    <StepCards />
                    <div className="flex flex-col gap-1.5">
                      <p className="text-slate-600 text-xs uppercase tracking-wider font-medium px-1">Example workflows</p>
                      <WorkflowPreviewCycle />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {inputBar}
            </div>

            {/* Right column: desktop only, hidden once conversation starts */}
            <AnimatePresence>
              {!sessionId && (
                <motion.div
                  key="right-col"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="hidden lg:flex flex-col gap-4 w-[38%] shrink-0 pt-1"
                >
                  <StepCards compact />
                  <div className="flex flex-col gap-2">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium px-1">Example workflows</p>
                    <WorkflowPreviewCycle />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>{/* end main app shell */}
    </>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import Navbar from '../components/shared/Navbar'
import ProgressIndicator from '../components/shared/ProgressIndicator'
import AgentNode from '../components/workflow/AgentNode'
import { getWorkflow, refineWorkflow, shareWorkflow, exportWorkflow } from '../lib/api'

// ── React Flow node type registry (must be stable / outside component) ────────
const NODE_TYPES = { agentNode: AgentNode }

// ── Layout: convert backend workflow JSON → React Flow nodes + edges ──────────

function computeLayout(wfNodes, wfEdges) {
  const NODE_W = 210, NODE_H = 80, H_GAP = 100, V_GAP = 44

  const children = {}, parents = {}
  wfNodes.forEach(n => { children[n.id] = []; parents[n.id] = [] })
  wfEdges.forEach(e => {
    children[e.from]?.push(e.to)
    parents[e.to]?.push(e.from)
  })

  // Column = longest path from any root (handles DAGs and branches)
  const col = {}
  function setCol(id, depth) {
    if ((col[id] ?? -1) >= depth) return
    col[id] = depth
    ;(children[id] || []).forEach(child => setCol(child, depth + 1))
  }
  wfNodes.filter(n => parents[n.id].length === 0).forEach(n => setCol(n.id, 0))
  wfNodes.forEach(n => { if (col[n.id] === undefined) col[n.id] = 0 })

  // Group by column
  const colGroups = {}
  wfNodes.forEach(n => {
    const c = col[n.id]
    colGroups[c] = colGroups[c] || []
    colGroups[c].push(n.id)
  })

  // Assign positions — vertically centered within each column
  const pos = {}
  Object.entries(colGroups).forEach(([c, ids]) => {
    const totalH = ids.length * NODE_H + (ids.length - 1) * V_GAP
    ids.forEach((id, i) => {
      pos[id] = {
        x: parseInt(c) * (NODE_W + H_GAP),
        y: i * (NODE_H + V_GAP) - totalH / 2,
      }
    })
  })
  return pos
}

function toRFNodes(wfNodes, wfEdges) {
  const positions = computeLayout(wfNodes, wfEdges)
  const hasIncoming = new Set(wfEdges.map(e => e.to))
  const hasOutgoing = new Set(wfEdges.map(e => e.from))

  return wfNodes.map(n => ({
    id: n.id,
    type: 'agentNode',
    position: positions[n.id] || { x: 0, y: 0 },
    data: {
      label: n.label,
      description: n.description || '',
      tools: n.tools || [],
      inputs: n.inputs || [],
      outputs: n.outputs || [],
      role: !hasIncoming.has(n.id) ? 'entry' : !hasOutgoing.has(n.id) ? 'output' : 'processing',
    },
  }))
}

function toRFEdges(wfEdges) {
  return wfEdges.map((e, i) => ({
    id: `e_${e.from}_${e.to}_${i}`,
    source: e.from,
    target: e.to,
    label: e.label || '',
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'rgba(124,58,237,0.55)', strokeWidth: 1.8 },
    labelStyle: { fill: '#475569', fontSize: 10 },
    labelBgStyle: { fill: 'rgba(12,13,26,0.92)', fillOpacity: 1 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 4,
    markerEnd: { type: 'arrowclosed', color: 'rgba(124,58,237,0.7)' },
  }))
}

// ── Node detail panel — expands up from canvas bottom ────────────────────────
function NodeDetailPanel({ node, onClose }) {
  const d = node.data
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.6, y: 12 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0.6, y: 12 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ transformOrigin: 'bottom' }}
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-white font-semibold text-base">{d.label}</p>
          {d.description && (
            <p className="text-slate-400 text-sm leading-relaxed mt-1 max-w-2xl">{d.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 rounded-lg border border-[var(--color-border)] text-slate-500 hover:text-white hover:border-violet-600/40 flex items-center justify-center transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {d.tools?.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">Tools</p>
            <div className="flex flex-wrap gap-1.5">
              {d.tools.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-violet-900/30 border border-violet-700/30 text-violet-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {d.inputs?.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">Inputs</p>
            <ul className="space-y-1">
              {d.inputs.map(inp => (
                <li key={inp} className="text-slate-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-sky-500 shrink-0" />{inp}
                </li>
              ))}
            </ul>
          </div>
        )}
        {d.outputs?.length > 0 && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">Outputs</p>
            <ul className="space-y-1">
              {d.outputs.map(out => (
                <li key={out} className="text-slate-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{out}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Summary brief + metadata ──────────────────────────────────────────────────
function SummaryBrief({ summary, archetype, platforms, automationLevel }) {
  const archetypeLabel = {
    trend_to_content: 'Trend → Content',
    source_transform_distribute: 'Source → Transform → Distribute',
    monitor_engage_report: 'Monitor → Engage → Report',
    schedule_generate_publish: 'Schedule → Generate → Publish',
  }[archetype] || archetype

  return (
    <div className="p-5 border-b border-[var(--color-border)] overflow-y-auto">
      <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Workflow Summary</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {platforms?.map(p => (
          <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300">
            {p}
          </span>
        ))}
        {automationLevel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700/30 text-sky-300">
            {automationLevel === 'full' ? 'Fully automated' : 'Human in loop'}
          </span>
        )}
        {archetypeLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border)] text-slate-400">
            {archetypeLabel}
          </span>
        )}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
    </div>
  )
}

// ── Refinement chat ───────────────────────────────────────────────────────────
function RefinementChat({ workflowId, onRefined }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const { data } = await refineWorkflow(workflowId, text)
      setMessages(prev => [...prev, {
        role: 'system',
        text: data.change_description || 'Workflow updated.',
      }])
      onRefined(data)
    } catch {
      setMessages(prev => [...prev, { role: 'error', text: 'Something went wrong — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4">
      <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3 shrink-0">Refine workflow</p>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 mb-3">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs leading-relaxed">
            Ask the AI to add, remove, or change any part of the workflow.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed px-3 py-2 rounded-lg ${
              m.role === 'user'
                ? 'bg-violet-900/30 text-slate-200 self-end max-w-[90%]'
                : m.role === 'system'
                ? 'bg-emerald-900/20 border border-emerald-700/30 text-emerald-300'
                : 'bg-red-900/20 border border-red-700/30 text-red-300'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 items-center px-2 py-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-600"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end shrink-0">
        <textarea
          value={input}
          onChange={e => {
            setInput(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 80) + 'px'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
          }}
          disabled={loading}
          placeholder="Add an approval step before publishing…"
          rows={1}
          className="flex-1 resize-none text-xs rounded-lg bg-[var(--color-surface-3)] border border-[var(--color-border)] focus:border-violet-600/60 focus:outline-none px-3 py-2 text-white placeholder-slate-600 transition-colors disabled:opacity-40"
          style={{ minHeight: 34, maxHeight: 80, overflowY: 'auto' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-900/80 border border-emerald-700/50 text-emerald-300 text-sm backdrop-blur-sm shadow-lg"
    >
      {text}
    </motion.div>
  )
}

// ── Inner canvas — must live inside ReactFlowProvider to use useReactFlow ─────
function WorkflowCanvas({ rfNodes, rfEdges, onNodesChange, onEdgesChange, onNodeClick, selectedNode, onPaneClick, fitTrigger }) {
  const { fitView } = useReactFlow()

  // Re-fit whenever nodes first load (async) or are updated via refinement
  useEffect(() => {
    if (rfNodes.length === 0) return
    const timer = setTimeout(() => {
      fitView({ padding: 0.18, duration: 400 })
    }, 60)
    return () => clearTimeout(timer)
  }, [rfNodes.length, fitTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={NODE_TYPES}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.3}
      maxZoom={2}
      defaultEdgeOptions={{ type: 'smoothstep' }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(124,58,237,0.08)" gap={32} size={1} />
      <Controls
        className="!bg-[var(--color-surface-2)] !border-[var(--color-border)] !rounded-xl !shadow-lg"
        showInteractive={false}
      />
      <MiniMap
        nodeColor={n => {
          const role = n.data?.role
          return role === 'entry' ? '#10b981' : role === 'output' ? '#a855f7' : '#7c3aed'
        }}
        maskColor="rgba(12,13,26,0.8)"
        className="!bg-[var(--color-surface-2)] !border !border-[var(--color-border)] !rounded-xl"
      />
    </ReactFlow>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkflowPage() {
  const { workflowId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([])
  const [meta, setMeta] = useState(null)         // { summary_brief, archetype, platforms, automation_level }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [toast, setToast] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fitTrigger, setFitTrigger] = useState(0)

  // Page title
  useEffect(() => { document.title = 'Your Workflow · CreatorFlow' }, [])

  // ── Load workflow data ─────────────────────────────────────────────────────
  const applyWorkflowData = useCallback((data, refit = false) => {
    const wf = data.workflow_json || data
    setRfNodes(toRFNodes(wf.nodes || [], wf.edges || []))
    setRfEdges(toRFEdges(wf.edges || []))
    setMeta({
      summary_brief: data.summary_brief,
      archetype: data.archetype || wf.archetype,
      platforms: data.platforms,
      automation_level: data.automation_level || wf.automation_level,
    })
    if (refit) setFitTrigger(t => t + 1)
  }, [setRfNodes, setRfEdges])

  useEffect(() => {
    const passed = location.state?.workflowData
    if (passed) {
      applyWorkflowData(passed)
      setLoading(false)
      return
    }
    getWorkflow(workflowId)
      .then(({ data }) => { applyWorkflowData(data); setLoading(false) })
      .catch(() => { setError('Could not load workflow.'); setLoading(false) })
  }, [workflowId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Node click ─────────────────────────────────────────────────────────────
  const onNodeClick = useCallback((_evt, node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  // ── Refinement ─────────────────────────────────────────────────────────────
  const handleRefined = useCallback((data) => {
    applyWorkflowData(data, true)
    setSelectedNode(null)
    showToast('Workflow updated.')
  }, [applyWorkflowData])

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const { data } = await shareWorkflow(workflowId)
      const url = `${window.location.origin}/share/${data.share_token}`
      await navigator.clipboard.writeText(url)
      showToast('Share link copied to clipboard!')
    } catch {
      showToast('Could not generate share link.')
    } finally {
      setSharing(false)
    }
  }

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const { data } = await exportWorkflow(workflowId)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `workflow-${workflowId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('PDF downloaded.')
    } catch {
      showToast('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }

  const showToast = (text) => {
    setToast(text)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
            <p className="text-slate-500 text-sm">Loading workflow…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => navigate('/brainstorm')} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
              Start over
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Progress indicator */}
      <div className="border-b border-[var(--color-border)] shrink-0">
        <ProgressIndicator step={3} />
      </div>

      {/* Action bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          onClick={() => navigate('/brainstorm')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Start over
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] text-slate-400 hover:text-white hover:border-violet-600/40 text-sm transition-all disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-40 shadow-md shadow-purple-900/30"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 7l4-2.5M6 9l4 2.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {sharing ? 'Copying…' : 'Share'}
          </button>
        </div>
      </div>

      {/* Main two-panel layout */}
      <div className="flex-1 flex min-h-0">

        {/* Left: React Flow canvas + node detail */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <ReactFlowProvider>
              <WorkflowCanvas
                rfNodes={rfNodes}
                rfEdges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                selectedNode={selectedNode}
                onPaneClick={() => setSelectedNode(null)}
                fitTrigger={fitTrigger}
              />
            </ReactFlowProvider>
          </div>

          {/* Node detail panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodeDetailPanel
                key={selectedNode.id}
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right: summary + refinement */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-[var(--color-border)] flex flex-col min-h-0 bg-[var(--color-surface)]">
          {meta && (
            <SummaryBrief
              summary={meta.summary_brief}
              archetype={meta.archetype}
              platforms={meta.platforms}
              automationLevel={meta.automation_level}
            />
          )}
          <RefinementChat workflowId={workflowId} onRefined={handleRefined} />
        </div>

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" text={toast} />}
      </AnimatePresence>
    </div>
  )
}

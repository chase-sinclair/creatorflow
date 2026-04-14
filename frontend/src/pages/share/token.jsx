import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import AgentNode from '../../components/workflow/AgentNode'
import { getWorkflowByToken } from '../../lib/api'

const NODE_TYPES = { agentNode: AgentNode }

// Re-use the same layout + transform helpers (copy — avoids cross-file dep)
function computeLayout(wfNodes, wfEdges) {
  const NODE_W = 210, NODE_H = 80, H_GAP = 100, V_GAP = 44
  const children = {}, parents = {}
  wfNodes.forEach(n => { children[n.id] = []; parents[n.id] = [] })
  wfEdges.forEach(e => { children[e.from]?.push(e.to); parents[e.to]?.push(e.from) })

  const col = {}
  function setCol(id, depth) {
    if ((col[id] ?? -1) >= depth) return
    col[id] = depth
    ;(children[id] || []).forEach(child => setCol(child, depth + 1))
  }
  wfNodes.filter(n => parents[n.id].length === 0).forEach(n => setCol(n.id, 0))
  wfNodes.forEach(n => { if (col[n.id] === undefined) col[n.id] = 0 })

  const colGroups = {}
  wfNodes.forEach(n => {
    const c = col[n.id]
    colGroups[c] = colGroups[c] || []
    colGroups[c].push(n.id)
  })

  const pos = {}
  Object.entries(colGroups).forEach(([c, ids]) => {
    const totalH = ids.length * NODE_H + (ids.length - 1) * V_GAP
    ids.forEach((id, i) => {
      pos[id] = { x: parseInt(c) * (NODE_W + H_GAP), y: i * (NODE_H + V_GAP) - totalH / 2 }
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

export default function SharedWorkflowPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [rfNodes, setRfNodes] = useState([])
  const [rfEdges, setRfEdges] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { document.title = 'Shared Workflow · CreatorFlow' }, [])

  useEffect(() => {
    getWorkflowByToken(token)
      .then(({ data }) => {
        const wf = data.workflow_json || {}
        setRfNodes(toRFNodes(wf.nodes || [], wf.edges || []))
        setRfEdges(toRFEdges(wf.edges || []))
        setMeta({
          summary_brief: data.summary_brief,
          archetype: data.archetype || wf.archetype,
          platforms: data.platforms,
          automation_level: data.automation_level || wf.automation_level,
        })
        setLoading(false)
      })
      .catch(() => { setError('This workflow link is invalid or has expired.'); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
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
            <p className="text-slate-500 text-sm">Loading shared workflow…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/brainstorm')}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all"
            >
              Build your own workflow →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const archetypeLabel = {
    trend_to_content: 'Trend → Content',
    source_transform_distribute: 'Source → Transform → Distribute',
    monitor_engage_report: 'Monitor → Engage → Report',
    schedule_generate_publish: 'Schedule → Generate → Publish',
  }[meta?.archetype] || meta?.archetype

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* Minimal header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="2.5" fill="white" />
              <circle cx="12" cy="4" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" fillOpacity="0.7" />
              <line x1="6.5" y1="7" x2="10" y2="4.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="6.5" y1="9" x2="10" y2="11.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            </svg>
          </div>
          <span className="text-white font-semibold">CreatorFlow</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-400">
            Shared workflow
          </span>
        </div>

        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/brainstorm')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-md shadow-purple-900/40"
        >
          Build your own workflow
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      {/* Main: canvas left, summary right */}
      <div className="flex-1 flex min-h-0">

        {/* Canvas — read-only */}
        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={NODE_TYPES}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(124,58,237,0.08)" gap={32} size={1} />
            <Controls showInteractive={false} className="!bg-[var(--color-surface-2)] !border-[var(--color-border)] !rounded-xl !shadow-lg" />
            <MiniMap
              nodeColor={n => {
                const role = n.data?.role
                return role === 'entry' ? '#10b981' : role === 'output' ? '#a855f7' : '#7c3aed'
              }}
              maskColor="rgba(12,13,26,0.8)"
              className="!bg-[var(--color-surface-2)] !border !border-[var(--color-border)] !rounded-xl"
            />
          </ReactFlow>
        </div>

        {/* Summary sidebar */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-[var(--color-border)] flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-[var(--color-border)]">
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Workflow Summary</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {meta?.platforms?.map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300">{p}</span>
              ))}
              {meta?.automation_level && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700/30 text-sky-300">
                  {meta.automation_level === 'full' ? 'Fully automated' : 'Human in loop'}
                </span>
              )}
              {archetypeLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border)] text-slate-400">
                  {archetypeLabel}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{meta?.summary_brief}</p>
          </div>

          {/* CTA */}
          <div className="p-5">
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Want a workflow like this for your own content? Build one in minutes — no account needed.
            </p>
            <button
              onClick={() => navigate('/brainstorm')}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-md shadow-purple-900/30"
            >
              Build your own workflow →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

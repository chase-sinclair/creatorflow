import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'

export default function SharedWorkflowPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300 text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Shared Workflow
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Shared Workflow View
          </h1>
          <p className="text-slate-400 text-lg mb-2">
            Read-only workflow view for shared links — coming in Phase 6.
          </p>
          <p className="text-slate-600 text-sm mb-8">
            Token: <code className="text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded">{token}</code>
          </p>
          <button
            onClick={() => navigate('/brainstorm')}
            className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
          >
            Build your own workflow →
          </button>
        </div>
      </main>
    </div>
  )
}

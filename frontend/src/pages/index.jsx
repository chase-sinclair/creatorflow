import { useEffect, useState } from 'react'
import Navbar from '../components/shared/Navbar'
import { checkHealth } from '../lib/api'

export default function DiscoverPage() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('unavailable'))
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300 text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Discover Phase — Full UI coming in Phase 2
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Design your social media automation.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
              Visually.
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            CreatorFlow helps you build agentic workflows for social media automation — no coding required.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <a
              href="/brainstorm"
              className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors shadow-lg shadow-purple-900/30"
            >
              Start Building
            </a>
            <span className="text-slate-500 text-sm">No account needed</span>
          </div>

          {/* Backend connectivity status */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-emerald-400'
                  : apiStatus === 'unavailable'
                  ? 'bg-red-400'
                  : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="text-slate-400">
              API:{' '}
              <span
                className={
                  apiStatus === 'connected'
                    ? 'text-emerald-400'
                    : apiStatus === 'unavailable'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }
              >
                {apiStatus === 'connected'
                  ? 'Connected'
                  : apiStatus === 'unavailable'
                  ? 'Unavailable — start the backend'
                  : 'Checking…'}
              </span>
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

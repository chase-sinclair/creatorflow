import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="2.5" fill="white" />
              <circle cx="12" cy="4" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" fillOpacity="0.7" />
              <line x1="6.5" y1="7" x2="10" y2="4.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="6.5" y1="9" x2="10" y2="11.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
            CreatorFlow
          </span>
        </Link>

        <button
          onClick={() => navigate('/brainstorm')}
          className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-purple-900/30"
        >
          Start Building
        </button>
      </div>
    </nav>
  )
}

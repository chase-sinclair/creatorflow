export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="2.5" fill="white" />
              <circle cx="12" cy="4" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" fillOpacity="0.7" />
              <line x1="6.5" y1="7" x2="10" y2="4.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="6.5" y1="9" x2="10" y2="11.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            </svg>
          </div>
          <span className="text-white font-semibold">CreatorFlow</span>
          <span className="text-slate-600 text-sm">— Design workflows visually, no code needed.</span>
        </div>
        <span className="text-slate-600 text-sm">© 2025 CreatorFlow</span>
      </div>
    </footer>
  )
}

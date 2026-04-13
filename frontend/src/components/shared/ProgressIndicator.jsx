const STEPS = [
  { n: 1, label: 'Shape your idea' },
  { n: 2, label: 'Designing workflow' },
  { n: 3, label: 'Your workflow' },
]

export default function ProgressIndicator({ step = 1 }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((s, i) => {
        const active = s.n === step
        const done = s.n < step
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-purple-900/40'
                    : done
                    ? 'bg-violet-900/60 text-violet-400'
                    : 'bg-[var(--color-surface-3)] text-slate-600'
                }`}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span
                className={`text-sm transition-colors hidden sm:inline ${
                  active ? 'text-white font-medium' : done ? 'text-slate-500' : 'text-slate-600'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? 'bg-violet-700' : 'bg-[var(--color-surface-3)]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

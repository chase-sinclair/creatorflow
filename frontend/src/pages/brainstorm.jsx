import Navbar from '../components/shared/Navbar'

export default function BrainstormPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 text-violet-300 text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Step 1 of 3 — Shape your idea
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Brainstorm Phase
          </h1>
          <p className="text-slate-400 text-lg">
            Conversational AI chat to clarify your automation idea — coming in Phase 5.
          </p>
        </div>
      </main>
    </div>
  )
}

import { motion } from 'framer-motion'

interface HomeProps {
    onStart: () => void
    onViewHistory: () => void
    historyCount: number
}

export function Home({ onStart, onViewHistory, historyCount }: HomeProps) {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(6,182,212,0.2),transparent_45%),radial-gradient(circle_at_85%_65%,rgba(20,184,166,0.2),transparent_45%),linear-gradient(160deg,#020617_0%,#0b1120_55%,#031525_100%)] px-6 py-8 text-slate-100">
            <div className="absolute -left-10 top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -right-12 bottom-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="relative z-10 mx-auto flex max-w-md flex-col gap-6"
            >
                <div className="rounded-3xl border border-slate-700/60 bg-slate-900/45 p-6 backdrop-blur-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Skin Condition Analyzer</p>
                    <h1 className="mt-3 text-4xl font-semibold leading-tight text-cyan-50">
                        Instant Face Scan with Smart Skin Insights
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                        Capture a face photo, run lightweight skin heuristics, and get a practical routine in under one minute.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <article className="rounded-3xl border border-slate-700/60 bg-slate-900/40 p-4 backdrop-blur-md">
                        <p className="text-sm text-cyan-100">Heuristic Scan</p>
                        <p className="mt-1 text-xs text-slate-400">No heavy model required</p>
                    </article>
                    <article className="rounded-3xl border border-slate-700/60 bg-slate-900/40 p-4 backdrop-blur-md">
                        <p className="text-sm text-cyan-100">Actionable Routine</p>
                        <p className="mt-1 text-xs text-slate-400">Morning + night guidance</p>
                    </article>
                </div>

                <button
                    type="button"
                    onClick={onStart}
                    className="mt-2 rounded-3xl bg-cyan-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.35)] transition hover:bg-cyan-300 active:scale-[0.99]"
                >
                    Start Face Scan
                </button>

                <button
                    type="button"
                    onClick={onViewHistory}
                    className="rounded-3xl border border-slate-600 bg-slate-900/45 px-6 py-3 text-sm font-medium text-slate-200"
                >
                    View Previous Scans ({historyCount})
                </button>
            </motion.section>
        </main>
    )
}

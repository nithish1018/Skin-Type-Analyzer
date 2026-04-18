import { motion } from 'framer-motion'
import type { ScanHistoryEntry } from '../types/skin'

interface HistoryProps {
    history: ScanHistoryEntry[]
    onBack: () => void
    onClear: () => void
}

const formatDate = (value: string): string => {
    return new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function History({ history, onBack, onClear }: HistoryProps) {
    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.22),transparent_38%),linear-gradient(160deg,#020617_0%,#0b1220_55%,#071325_100%)] px-5 pb-16 pt-8 text-slate-100">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto flex max-w-md flex-col gap-4"
            >
                <article className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur-lg">
                    <h1 className="text-2xl font-semibold text-cyan-100">Scan History</h1>
                    <p className="mt-1 text-sm text-slate-300">Recent local scans stored on your device.</p>
                </article>

                {history.length === 0 && (
                    <article className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 text-sm text-slate-300 backdrop-blur-lg">
                        No scan history yet. Run your first analysis to build your timeline.
                    </article>
                )}

                {history.map((entry) => (
                    <article key={entry.id} className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur-lg">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-semibold text-cyan-100">{entry.result.skinType}</p>
                            <p className="text-xs text-slate-400">{formatDate(entry.createdAt)}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 px-2 py-2">
                                <p className="text-slate-400">Confidence</p>
                                <p className="mt-1 text-sm text-slate-100">{entry.result.confidence}%</p>
                            </div>
                            <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 px-2 py-2">
                                <p className="text-slate-400">Oiliness</p>
                                <p className="mt-1 text-sm text-slate-100">{entry.result.oiliness}%</p>
                            </div>
                            <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 px-2 py-2">
                                <p className="text-slate-400">Acne</p>
                                <p className="mt-1 text-sm text-slate-100">{entry.result.acneRisk}%</p>
                            </div>
                        </div>
                    </article>
                ))}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl border border-slate-600 bg-slate-900/45 px-4 py-3 text-sm font-medium text-slate-200"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="rounded-2xl bg-rose-500/85 px-4 py-3 text-sm font-semibold text-rose-50"
                    >
                        Clear History
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

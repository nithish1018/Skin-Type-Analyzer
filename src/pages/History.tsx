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
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(232,207,193,0.65),transparent_40%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-16 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto flex max-w-md flex-col gap-4"
            >
                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <h1 className="text-2xl font-semibold text-skin-text">Scan History</h1>
                    <p className="mt-1 text-sm text-skin-gray">Recent local scans stored on your device.</p>
                </article>

                {history.length === 0 && (
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 text-sm text-skin-gray shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        No scan history yet. Run your first analysis to build your timeline.
                    </article>
                )}

                {history.map((entry) => (
                    <article key={entry.id} className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-semibold text-skin-text">{entry.result.skinType}</p>
                            <p className="text-xs text-skin-gray">{formatDate(entry.createdAt)}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">Confidence</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.confidence}%</p>
                            </div>
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">Oiliness</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.oiliness}%</p>
                            </div>
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">Acne</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.acneRisk}%</p>
                            </div>
                        </div>
                    </article>
                ))}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190]"
                    >
                        Clear History
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

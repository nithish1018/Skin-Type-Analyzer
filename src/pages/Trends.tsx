import { motion } from 'framer-motion'
import type { ScanHistoryEntry } from '../types/skin'
import { buildWindowTrendSnapshot } from '../utils/trends'

interface TrendsProps {
    history: ScanHistoryEntry[]
    onBackHome: () => void
    onBackToScan: () => void
}

export function Trends({ history, onBackHome, onBackToScan }: TrendsProps) {
    const trendSnapshots = [buildWindowTrendSnapshot(history, 7), buildWindowTrendSnapshot(history, 30)].filter(
        (snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null,
    )

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(232,207,193,0.65),transparent_40%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-32 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto flex max-w-md flex-col gap-4"
            >
                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <h1 className="text-2xl font-semibold text-skin-text">Trends</h1>
                    <p className="mt-1 text-sm text-skin-gray">Compare hydration, oiliness, and acne risk across recent scans.</p>
                </article>

                {history.length === 0 && (
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 text-sm text-skin-gray shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        No scan history yet. Run a few analyses to see trends here.
                    </article>
                )}

                {trendSnapshots.map((snapshot) => (
                    <article key={snapshot.title} className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-semibold text-skin-text">{snapshot.title}</h2>
                                <p className="mt-1 text-sm text-skin-gray">{snapshot.sampleCount} scan{snapshot.sampleCount === 1 ? '' : 's'} used</p>
                            </div>
                            <p className="text-xs text-skin-gray">{snapshot.baselineLabel}</p>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {snapshot.metrics.map((metric) => {
                                const deltaText = metric.delta === null ? '—' : `${metric.delta > 0 ? '+' : ''}${metric.delta.toFixed(0)}`
                                const statusTone = metric.direction === 'improving'
                                    ? 'text-[#5f8a57]'
                                    : metric.direction === 'declining'
                                        ? 'text-[#9a5f6f]'
                                        : 'text-skin-gray'

                                return (
                                    <div key={metric.label} className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-3">
                                        <p className="text-xs text-skin-gray">{metric.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-skin-text">
                                            {metric.current === null ? '—' : `${metric.current.toFixed(0)}%`}
                                        </p>
                                        <p className={`mt-1 text-xs ${statusTone}`}>{metric.note}</p>
                                        <p className="mt-1 text-[11px] text-skin-gray">Change: {deltaText}%</p>
                                    </div>
                                )
                            })}
                        </div>
                    </article>
                ))}

                {history.length > 0 && trendSnapshots.length === 0 && (
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 text-sm text-skin-gray shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        You need a few more scans across different days to build useful trend comparisons.
                    </article>
                )}

            </motion.section>

            <div className="fixed inset-x-0 bottom-3 z-20 px-5">
                <div className="mx-auto max-w-md">
                    <div className="h-4 bg-gradient-to-b from-transparent to-[#faf9f7]/85" />
                </div>
                <div className="mx-auto grid max-w-md grid-cols-2 gap-3 rounded-3xl border border-skin-text/15 bg-skin-white/92 p-2 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <button
                        type="button"
                        onClick={onBackHome}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Back to Home
                    </button>
                    <button
                        type="button"
                        onClick={onBackToScan}
                        className="rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190]"
                    >
                        Back to History
                    </button>
                </div>
            </div>
        </main>
    )
}
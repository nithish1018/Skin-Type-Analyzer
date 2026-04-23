import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nProvider'
import type { ScanHistoryEntry } from '../types/skin'

interface HistoryProps {
    history: ScanHistoryEntry[]
    onBack: () => void
    onClear: () => void
    onDeleteEntry: (entryId: string) => void
    onViewTrends: () => void
}

const formatDate = (value: string, locale: string): string => {
    return new Date(value).toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function History({ history, onBack, onClear, onDeleteEntry, onViewTrends }: HistoryProps) {
    const { t, locale } = useI18n()

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(232,207,193,0.65),transparent_40%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-32 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto flex w-full max-w-4xl flex-col gap-4"
            >
                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <h1 className="text-2xl font-semibold text-skin-text">{t('history.title', 'Scan History')}</h1>
                    <p className="mt-1 text-sm text-skin-gray">{t('history.subtitle', 'Recent local scans stored on your device.')}</p>
                </article>

                <button
                    type="button"
                    onClick={onViewTrends}
                    className="rounded-2xl bg-[#A8C3A0] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#95af8d]"
                >
                    {t('history.viewTrends', 'View Trend Snapshot')}
                </button>


                {history.length === 0 && (
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 text-sm text-skin-gray shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        {t('history.empty', 'No scan history yet. Run your first analysis to build your timeline.')}
                    </article>
                )}

                {history.map((entry) => (
                    <article key={entry.id} className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5 backdrop-blur-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-base font-semibold text-skin-text">{entry.result.skinType}</p>
                                <p className="mt-1 text-xs text-skin-gray">{formatDate(entry.createdAt, locale)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onDeleteEntry(entry.id)}
                                className="rounded-xl border border-[#c98f9d]/45 bg-[#f6e6dc] px-3 py-1.5 text-xs font-semibold text-[#9a5f6f] transition hover:bg-[#f2ddd1]"
                                aria-label={`${t('history.delete', 'Delete')} ${formatDate(entry.createdAt, locale)}`}
                            >
                                {t('history.delete', 'Delete')}
                            </button>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">{t('history.confidence', 'Confidence')}</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.confidence}%</p>
                            </div>
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">{t('history.oiliness', 'Oiliness')}</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.oiliness}%</p>
                            </div>
                            <div className="rounded-xl border border-skin-tone/80 bg-skin-beige px-2 py-2">
                                <p className="text-skin-gray">{t('history.acne', 'Acne')}</p>
                                <p className="mt-1 text-sm text-skin-text">{entry.result.acneRisk}%</p>
                            </div>
                        </div>
                    </article>
                ))}

            </motion.section>

            <div className="fixed inset-x-0 bottom-3 z-20 px-5">
                <div className="mx-auto max-w-4xl">
                    <div className="h-4 bg-gradient-to-b from-transparent to-[#faf9f7]/85" />
                </div>
                <div className={`mx-auto grid max-w-4xl gap-3 rounded-3xl border border-skin-text/15 bg-skin-white/92 p-2 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg ${history.length === 0 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        {t('common.back', 'Back')}
                    </button>
                    {history.length > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190]"
                        >
                            {t('history.clearAll', 'Clear All Scans')}
                        </button>
                    )}
                </div>
            </div>
        </main>
    )
}

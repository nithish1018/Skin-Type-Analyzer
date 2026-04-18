import { motion } from 'framer-motion'

interface ScanTipsProps {
    onContinue: () => void
    dontShowAgain: boolean
    onToggleDontShowAgain: (checked: boolean) => void
}

const tips = [
    {
        title: 'Use bright, even light',
        description: 'Face a window or soft indoor light. Avoid backlight and harsh shadows.',
    },
    {
        title: 'Hold phone at eye level',
        description: 'Keep your face straight and centered, around 30-45 cm from camera.',
    },
    {
        title: 'Keep face clear',
        description: 'Move hair away from face, avoid reflective glasses if possible.',
    },
    {
        title: 'Stay steady for 1-2 seconds',
        description: 'Let autofocus settle. A sharp image gives better analysis quality.',
    },
]

export function ScanTips({
    onContinue,
    dontShowAgain,
    onToggleDontShowAgain,
}: ScanTipsProps) {
    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.16),transparent_45%),linear-gradient(160deg,#020617_0%,#0b1220_55%,#071428_100%)] px-5 pb-12 pt-8 text-slate-100">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto flex max-w-md flex-col gap-4"
            >
                <article className="rounded-3xl border border-cyan-300/20 bg-slate-900/50 p-5 backdrop-blur-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">Before You Scan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-cyan-100">Tips for Better Accuracy</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Follow these quick steps for a cleaner capture and better skin analysis reliability.
                    </p>
                </article>

                {tips.map((tip) => (
                    <article
                        key={tip.title}
                        className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur-md"
                    >
                        <h2 className="text-base font-semibold text-cyan-100">{tip.title}</h2>
                        <p className="mt-1 text-sm text-slate-300">{tip.description}</p>
                    </article>
                ))}

                <label className="mt-1 flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/45 px-4 py-3 text-sm text-slate-200 backdrop-blur-md">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(event) => onToggleDontShowAgain(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-cyan-400"
                    />
                    <span>Don&apos;t show again</span>
                </label>

                <div className="mt-2">
                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                        Continue
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

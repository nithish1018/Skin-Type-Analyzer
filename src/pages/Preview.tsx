import { motion } from 'framer-motion'

interface PreviewProps {
    imageSrc: string
    goodShots: number
    targetShots: number
    onRetake: () => void
    onAnalyze: () => void
    warning: string | null
}

export function Preview({ imageSrc, goodShots, targetShots, onRetake, onAnalyze, warning }: PreviewProps) {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.2),transparent_45%),linear-gradient(150deg,#020617_0%,#0b1220_55%,#081428_100%)] px-5 pb-10 pt-7 text-slate-100">
            <motion.section
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mx-auto flex max-w-md flex-col gap-5"
            >
                <div className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur-md">
                    <h1 className="text-xl font-semibold text-cyan-100">Captured Preview</h1>
                    <p className="mt-1 text-sm text-slate-300">Review the frame before skin analysis.</p>
                    <p className="mt-2 text-xs text-slate-400">
                        Good shots captured: {Math.min(goodShots, targetShots)}/{targetShots}
                    </p>
                    {warning && (
                        <p className="mt-3 rounded-xl border border-amber-400/45 bg-amber-700/20 px-3 py-2 text-xs text-amber-100">
                            {warning}
                        </p>
                    )}
                </div>

                <div className="overflow-hidden rounded-3xl border border-cyan-200/25 bg-black shadow-[0_24px_45px_rgba(8,145,178,0.22)]">
                    <img src={imageSrc} alt="Captured face preview" className="h-[60vh] w-full object-cover" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onRetake}
                        className="rounded-2xl border border-slate-600 bg-slate-900/45 px-4 py-3 text-sm font-medium text-slate-200"
                    >
                        Retake
                    </button>
                    <button
                        type="button"
                        onClick={onAnalyze}
                        className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                        Analyze Skin
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

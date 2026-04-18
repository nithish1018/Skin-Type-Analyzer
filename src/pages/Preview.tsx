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
        <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(232,207,193,0.65),transparent_45%),linear-gradient(150deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-10 pt-7 text-skin-text">
            <motion.section
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mx-auto flex max-w-md flex-col gap-5"
            >
                <div className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-card ring-1 ring-skin-text/5 backdrop-blur-md">
                    <h1 className="text-xl font-semibold text-skin-text">Captured Preview</h1>
                    <p className="mt-1 text-sm text-skin-gray">Review the frame before skin analysis.</p>
                    <p className="mt-2 text-xs text-skin-gray">
                        Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results
                    </p>
                    <p className="mt-2 text-xs text-skin-gray">
                        Good shots captured: {Math.min(goodShots, targetShots)}/{targetShots}
                    </p>
                    {warning && (
                        <p className="alert-warning mt-3 rounded-xl px-3 py-2 text-xs">
                            {warning}
                        </p>
                    )}
                </div>

                <div className="overflow-hidden rounded-3xl border border-skin-text/20 bg-skin-white shadow-card ring-1 ring-skin-text/5">
                    <img src={imageSrc} alt="Captured face preview" className="h-[60vh] w-full object-cover" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onRetake}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Retake
                    </button>
                    <button
                        type="button"
                        onClick={onAnalyze}
                        className="rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190]"
                    >
                        Analyze Skin
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

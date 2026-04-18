import { motion } from 'framer-motion'

interface HomeProps {
    onStart: () => void
    onViewHistory: () => void
    historyCount: number
}

export function Home({ onStart, onViewHistory, historyCount }: HomeProps) {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(232,207,193,0.75),transparent_45%),radial-gradient(circle_at_80%_25%,rgba(216,167,177,0.3),transparent_35%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-6 py-8 text-skin-text">
            <div className="absolute -left-10 top-20 h-56 w-56 animate-floatBlob rounded-full bg-skin-tone/55 blur-3xl" />
            <div className="absolute -right-12 bottom-16 h-72 w-72 animate-floatBlob rounded-full bg-skin-rose/35 blur-3xl [animation-delay:1.1s]" />

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="relative z-10 mx-auto flex min-h-[72vh] max-w-md flex-col justify-between gap-5"
            >
                <div className="rounded-3xl border border-skin-text/20 bg-skin-white p-6 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <p className="text-xs uppercase tracking-[0.22em] text-skin-gray">Skin Condition Analyzer</p>
                    <h1 className="mt-3 text-4xl font-semibold leading-tight text-skin-text">
                        Skin Analyzer
                    </h1>
                    <p className="mt-2 text-base leading-relaxed text-skin-gray">
                        Understand your skin in seconds
                    </p>
                    <p className="mt-4 rounded-2xl bg-skin-beige px-3 py-2 text-xs text-skin-gray">
                        Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                        <p className="text-sm font-medium text-skin-text">Lighting Check</p>
                        <p className="mt-1 text-xs text-skin-gray">Balanced light improves accuracy</p>
                    </article>
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                        <p className="text-sm font-medium text-skin-text">Face Position</p>
                        <p className="mt-1 text-xs text-skin-gray">Center your face in the guide</p>
                    </article>
                </div>

                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                    <p className="text-sm font-medium text-skin-text">What you will get</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Skin Type</div>
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Hydration</div>
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Acne Risk</div>
                    </div>
                </article>

                <button
                    type="button"
                    onClick={onStart}
                    className="mt-1 rounded-3xl bg-[#c98f9d] px-6 py-4 text-base font-semibold text-white shadow-card transition hover:bg-[#b98190] active:scale-[0.98]"
                >
                    Start Scan
                </button>

                <button
                    type="button"
                    onClick={onViewHistory}
                    className="rounded-3xl border border-skin-text/30 bg-skin-beige px-6 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                >
                    View Previous Scans ({historyCount})
                </button>
            </motion.section>
        </main>
    )
}

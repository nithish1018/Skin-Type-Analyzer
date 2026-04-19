import { motion } from 'framer-motion'
import { AdSlot } from '../components/AdSlot'

interface HomeProps {
    onStart: () => void
    onViewHistory: () => void
    historyCount: number
}

export function Home({ onStart, onViewHistory, historyCount }: HomeProps) {
    const homeAdSlot = import.meta.env.VITE_ADSENSE_SLOT_HOME as string | undefined

    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(232,207,193,0.75),transparent_45%),radial-gradient(circle_at_80%_25%,rgba(216,167,177,0.3),transparent_35%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-6 pb-32 pt-8 text-skin-text">
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
                        <p className="text-sm font-medium text-skin-text">Smart Question Boost</p>
                        <p className="mt-1 text-xs text-skin-gray">Quick skin questions improve result reliability</p>
                    </article>
                    <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                        <p className="text-sm font-medium text-skin-text">Weighted Final Analysis</p>
                        <p className="mt-1 text-xs text-skin-gray">Photo signals + profile answers for stronger results</p>
                    </article>
                </div>

                <AdSlot slot={homeAdSlot ?? ''} minHeightClassName="min-h-[90px]" />

                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                    <p className="text-sm font-medium text-skin-text">What you will get</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Skin Type</div>
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Hydration</div>
                        <div className="rounded-2xl border border-skin-tone/70 bg-skin-beige px-2 py-2 text-skin-text">Acne Risk</div>
                    </div>
                </article>

                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-soft ring-1 ring-skin-text/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-skin-gray">Privacy Notice</p>
                    <p className="mt-2 text-sm leading-relaxed text-skin-gray">
                        Your photos are processed locally on your device for analysis only. This system does not store your images or use them for model training.
                    </p>
                </article>

            </motion.section>

            <div className="fixed inset-x-0 bottom-3 z-20 px-6">
                <div className="mx-auto max-w-md">
                    <div className="h-4 bg-gradient-to-b from-transparent to-[#faf9f7]/85" />
                </div>
                <div className="mx-auto grid max-w-md grid-cols-2 gap-3 rounded-3xl border border-skin-text/15 bg-skin-white/92 p-2 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <button
                        type="button"
                        onClick={onStart}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b98190] active:scale-[0.98]"
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/20 ring-1 ring-white/35">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                            >
                                <rect x="3.5" y="7.5" width="17" height="12.5" rx="3.2" stroke="white" strokeWidth="1.7" />
                                <path d="M8.7 7.5l1-1.9h4.6l1 1.9" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="13.8" r="3.2" stroke="white" strokeWidth="1.6" />
                                <circle cx="12" cy="13.8" r="1.5" fill="#FFE9EF" />
                                <circle cx="13" cy="12.8" r="0.45" fill="white" />
                                <path d="M18.05 5.2v1.8M17.15 6.1h1.8" stroke="#FFE9EF" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </span>
                        <span>Start Scan</span>
                    </button>
                    <button
                        type="button"
                        onClick={onViewHistory}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Previous Scans ({historyCount})
                    </button>
                </div>
            </div>
        </main>
    )
}

export default Home

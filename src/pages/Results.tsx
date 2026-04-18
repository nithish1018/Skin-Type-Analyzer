import { motion } from 'framer-motion'
import { ResultCard } from '../components/ResultCard'
import type { SkinAnalysisResult, SkinRecommendation, SkinType } from '../types/skin'

interface ResultsProps {
    result: SkinAnalysisResult
    onRetake: () => void
    onViewHistory: () => void
}

const recommendations: Record<SkinType, SkinRecommendation> = {
    'Oily Skin': {
        morningRoutine: [
            'Foaming cleanser with salicylic acid',
            'Light niacinamide serum',
            'Oil-free gel moisturizer',
            'Matte SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Double cleanse',
            'BHA leave-on toner 3x/week',
            'Non-comedogenic moisturizer',
        ],
        tips: [
            'Blot excess oil instead of over-washing.',
            'Avoid heavy creams around the T-zone.',
            'Sanitize phone screen and pillow cover regularly.',
        ],
        products: [
            { name: 'CeraVe Foaming Cleanser', category: 'Cleanser' },
            { name: 'The Ordinary Niacinamide 10%', category: 'Serum' },
            { name: 'La Roche-Posay Anthelios Oil Control', category: 'Sunscreen' },
        ],
    },
    'Dry Skin': {
        morningRoutine: [
            'Cream-based gentle cleanser',
            'Hydrating hyaluronic acid serum',
            'Ceramide-rich moisturizer',
            'Hydrating SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Non-foaming cleanser',
            'Peptide or barrier repair serum',
            'Occlusive moisturizer layer',
        ],
        tips: [
            'Use lukewarm water for washing.',
            'Add a humidifier at night.',
            'Patch test exfoliants before full use.',
        ],
        products: [
            { name: 'Vanicream Gentle Cleanser', category: 'Cleanser' },
            { name: 'Hada Labo Gokujyun Lotion', category: 'Hydration' },
            { name: 'CeraVe Moisturizing Cream', category: 'Moisturizer' },
        ],
    },
    'Normal Skin': {
        morningRoutine: [
            'Gentle pH-balanced cleanser',
            'Antioxidant serum (vitamin C)',
            'Lightweight moisturizer',
            'Broad-spectrum SPF 50',
        ],
        nightRoutine: [
            'Cleanser',
            'Retinoid 2-3x/week',
            'Barrier-support moisturizer',
        ],
        tips: [
            'Keep routines consistent and minimal.',
            'Exfoliate only once weekly.',
            'Hydrate and sleep 7-8 hours.',
        ],
        products: [
            { name: 'La Roche-Posay Toleriane Cleanser', category: 'Cleanser' },
            { name: 'Geek & Gorgeous C-Glow', category: 'Serum' },
            { name: 'Beauty of Joseon Relief Sun', category: 'Sunscreen' },
        ],
    },
    'Combination Skin': {
        morningRoutine: [
            'Balanced gel cleanser',
            'Niacinamide + hydrating toner',
            'Dual-zone moisturizer application',
            'Light SPF 50 sunscreen',
        ],
        nightRoutine: [
            'Cleanser',
            'BHA on T-zone + hydrating serum on cheeks',
            'Medium-weight moisturizer',
        ],
        tips: [
            'Treat oily and dry zones differently.',
            'Use clay mask only on T-zone once weekly.',
            'Avoid over-layering active ingredients.',
        ],
        products: [
            { name: 'COSRX Low pH Cleanser', category: 'Cleanser' },
            { name: 'Paula’s Choice 2% BHA Liquid', category: 'Exfoliant' },
            { name: 'Neutrogena Hydro Boost Gel', category: 'Moisturizer' },
        ],
    },
}

const getRiskLabel = (value: number): string => {
    if (value >= 70) return 'High'
    if (value >= 45) return 'Moderate'
    return 'Low'
}

export function Results({ result, onRetake, onViewHistory }: ResultsProps) {
    const routine = recommendations[result.skinType]

    const onShare = async () => {
        const shareText = `Skin Type: ${result.skinType}\nConfidence: ${result.confidence}%\nOiliness: ${result.oiliness}%\nHydration: ${result.hydration}%\nAcne Risk: ${result.acneRisk}%`

        if (navigator.share) {
            await navigator.share({
                title: 'My Skin Analysis Result',
                text: shareText,
            })
            return
        }

        await navigator.clipboard.writeText(shareText)
        window.alert('Result copied to clipboard')
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.22),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.16),transparent_35%),linear-gradient(170deg,#030712_0%,#0b1220_58%,#081527_100%)] px-5 pb-16 pt-8 text-slate-100">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mx-auto flex max-w-md flex-col gap-5"
            >
                <article className="rounded-3xl border border-cyan-200/20 bg-slate-900/50 p-6 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Analysis Complete</p>
                    <h1 className="mt-2 text-3xl font-semibold text-cyan-50">{result.skinType}</h1>
                    <p className="mt-1 text-sm text-slate-300">Confidence score: {result.confidence}%</p>
                    {result.lowLighting && (
                        <p className="mt-3 rounded-xl border border-amber-400/45 bg-amber-700/25 px-3 py-2 text-xs text-amber-100">
                            Low lighting detected. Results may improve with brighter, even light.
                        </p>
                    )}
                </article>

                <div className="grid grid-cols-2 gap-3">
                    <ResultCard title="Oiliness" value={`${result.oiliness}%`} helper="Sebum estimate" />
                    <ResultCard title="Hydration" value={`${result.hydration}%`} helper="Moisture index" />
                    <ResultCard title="Acne Risk" value={getRiskLabel(result.acneRisk)} helper={`${result.acneRisk}% probability`} />
                    <ResultCard title="Dark Spots" value={`${result.darkSpots}%`} helper="Pigmentation tendency" />
                </div>

                <article className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur-lg">
                    <h2 className="text-lg font-semibold text-cyan-50">Recommended Routine</h2>
                    <div className="mt-3 grid gap-4 text-sm text-slate-200">
                        <div>
                            <h3 className="text-cyan-200">Morning</h3>
                            <ul className="mt-1 space-y-1 text-slate-300">
                                {routine.morningRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-cyan-200">Night</h3>
                            <ul className="mt-1 space-y-1 text-slate-300">
                                {routine.nightRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </article>

                <article className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur-lg">
                    <h2 className="text-lg font-semibold text-cyan-50">Tips & Product Ideas</h2>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {routine.tips.map((tip) => (
                            <li key={tip}>• {tip}</li>
                        ))}
                    </ul>
                    <div className="mt-4 space-y-2">
                        {routine.products.map((product) => (
                            <div
                                key={product.name}
                                className="rounded-2xl border border-slate-700/70 bg-slate-800/50 px-3 py-2"
                            >
                                <p className="text-sm text-slate-100">{product.name}</p>
                                <p className="text-xs text-slate-400">{product.category}</p>
                            </div>
                        ))}
                    </div>
                </article>

                <div className="mt-1 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={onRetake}
                        className="rounded-2xl border border-slate-600 bg-slate-900/40 px-3 py-3 text-sm font-medium text-slate-200"
                    >
                        Retake Photo
                    </button>
                    <button
                        type="button"
                        onClick={onViewHistory}
                        className="rounded-2xl border border-slate-600 bg-slate-900/40 px-3 py-3 text-sm font-medium text-slate-200"
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void onShare()
                        }}
                        className="rounded-2xl bg-cyan-400 px-3 py-3 text-sm font-semibold text-slate-950"
                    >
                        Share Result
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

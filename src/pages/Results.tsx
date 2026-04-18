import { motion } from 'framer-motion'
import { useState } from 'react'
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

interface MetricBar {
    label: string
    value: number
    gradient: string
}

const getHowItWasCalculated = (result: SkinAnalysisResult): string[] => {
    const oilinessLine = result.oiliness >= result.hydration
        ? 'The skin looked shinier than dry, so the app leaned more toward an oily or combination type.'
        : 'The skin looked drier than shiny, so the app leaned more toward a dry or combination type.'

    const acneLine = result.acneRisk >= 70
        ? 'More redness and texture were detected, so acne risk was marked higher.'
        : result.acneRisk >= 45
            ? 'Some redness and texture were detected, so acne risk was marked medium.'
            : 'Only a small amount of redness and texture was detected, so acne risk was marked lower.'

    const darkSpotLine = result.darkSpots >= 50
        ? 'Darker patches stood out more, so the dark spot score is higher.'
        : 'Only a few darker patches stood out, so the dark spot score is lower.'

    const confidenceLine = result.lowLighting
        ? 'The photo was a bit dim, so the confidence score is lower than usual.'
        : 'The photo was clear enough, so the confidence score is more dependable.'

    return [
        'The app looks at the captured face area and compares how shiny, dry, even, and clear the skin appears.',
        oilinessLine,
        acneLine,
        darkSpotLine,
        confidenceLine,
    ]
}

export function Results({ result, onRetake, onViewHistory }: ResultsProps) {
    const routine = recommendations[result.skinType]
    const howItWasCalculated = getHowItWasCalculated(result)
    const appUrl = window.location.origin + window.location.pathname
    const [isSharing, setIsSharing] = useState(false)
    const metricBars: MetricBar[] = [
        { label: 'Oiliness', value: result.oiliness, gradient: 'linear-gradient(90deg,#D8A7B1 0%,#E8CFC1 100%)' },
        { label: 'Hydration', value: result.hydration, gradient: 'linear-gradient(90deg,#A8C3A0 0%,#DCE8D8 100%)' },
        { label: 'Acne Risk', value: result.acneRisk, gradient: 'linear-gradient(90deg,#D8A7B1 0%,#F1D8DF 100%)' },
    ]

    const onShare = async () => {
        if (isSharing) {
            return
        }

        const baseShareText = `Skin Type: ${result.skinType}\nConfidence: ${result.confidence}%\nOiliness: ${result.oiliness}%\nHydration: ${result.hydration}%\nAcne Risk: ${result.acneRisk}%`
        const clipboardShareText = `${baseShareText}\nApp: ${appUrl}`

        setIsSharing(true)
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Skin Analysis Result',
                    text: baseShareText,
                    url: appUrl,
                })
                return
            }

            await navigator.clipboard.writeText(clipboardShareText)
            window.alert('Result copied to clipboard')
        } catch (error) {
            const reason = error instanceof Error ? error.message : ''

            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(clipboardShareText)
                    window.alert(reason ? `Share unavailable. Result copied instead. (${reason})` : 'Share unavailable. Result copied instead.')
                    return
                } catch {
                    // fall through to the alert below
                }
            }

            window.alert(reason ? `Unable to share right now. (${reason})` : 'Unable to share right now.')
        } finally {
            setIsSharing(false)
        }
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_10%,rgba(232,207,193,0.65),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(216,167,177,0.22),transparent_35%),linear-gradient(170deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-16 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mx-auto flex max-w-md flex-col gap-5"
            >
                <article className="overflow-hidden rounded-3xl border border-skin-text/20 bg-skin-white p-6 shadow-card ring-1 ring-skin-text/5 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-skin-gray">Analysis Complete</p>
                    <p className="mt-2 rounded-2xl bg-skin-beige px-3 py-2 text-xs text-skin-gray">Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results</p>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(145deg,#E8CFC1_0%,#D8A7B1_100%)] text-2xl shadow-soft">
                            <span role="img" aria-label="Face">🧴</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-skin-text">{result.skinType}</h1>
                            <p className="mt-1 text-sm text-skin-gray">Confidence score: {result.confidence}%</p>
                        </div>
                    </div>
                    {result.lowLighting && (
                        <p className="alert-warning mt-4 rounded-xl px-3 py-2 text-xs">
                            Low lighting detected. Results may improve with brighter, even light.
                        </p>
                    )}
                </article>

                <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">Skin Signals</h2>
                    <div className="mt-4 space-y-4">
                        {metricBars.map((metric, index) => (
                            <div key={metric.label}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <p className="text-skin-gray">{metric.label}</p>
                                    <p className="font-medium text-skin-text">{metric.value}%</p>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full border border-skin-tone/80 bg-skin-beige">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        transition={{ duration: 0.65, delay: 0.1 + index * 0.12, ease: 'easeOut' }}
                                        style={{ background: metric.gradient }}
                                        className="h-full rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.article>

                <ResultCard title="Dark Spots" value={`${result.darkSpots}%`} helper="Pigmentation tendency" />
                <ResultCard title="Acne Risk Label" value={getRiskLabel(result.acneRisk)} helper={`${result.acneRisk}% probability`} />

                <motion.article
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">How this was calculated</h2>
                    <p className="mt-2 text-sm text-skin-gray">
                        This result comes from the face photo you captured and the stable frames from the burst.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-skin-gray">
                        {howItWasCalculated.map((line) => (
                            <motion.li
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                key={line}
                                className="rounded-2xl border border-skin-tone/80 bg-skin-beige px-3 py-2"
                            >
                                {line}
                            </motion.li>
                        ))}
                    </ul>
                </motion.article>

                <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-soft ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">Recommended Routine</h2>
                    <div className="mt-3 grid gap-4 text-sm text-skin-text">
                        <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige p-3">
                            <h3 className="font-medium text-skin-text">Morning</h3>
                            <ul className="mt-2 space-y-1 text-skin-gray">
                                {routine.morningRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-skin-tone/80 bg-skin-beige p-3">
                            <h3 className="font-medium text-skin-text">Night</h3>
                            <ul className="mt-2 space-y-1 text-skin-gray">
                                {routine.nightRoutine.map((step) => (
                                    <li key={step}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.article>

                <div className="mt-1 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={onRetake}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-3 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        Retake Photo
                    </button>
                    <button
                        type="button"
                        onClick={onViewHistory}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-3 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void onShare()
                        }}
                        disabled={isSharing}
                        className="rounded-2xl bg-[#c98f9d] px-3 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190] disabled:opacity-60"
                    >
                        {isSharing ? 'Sharing...' : 'Share Result'}
                    </button>
                </div>
            </motion.section>
        </main>
    )
}

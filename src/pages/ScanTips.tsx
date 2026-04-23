import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nProvider'

interface ScanTipsProps {
    onContinue: () => void
    onCancel: () => void
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
    onCancel,
    dontShowAgain,
    onToggleDontShowAgain,
}: ScanTipsProps) {
    const { t } = useI18n()
    const localizedTips = [
        {
            title: t('tips.tip1Title', tips[0].title),
            description: t('tips.tip1Desc', tips[0].description),
        },
        {
            title: t('tips.tip2Title', tips[1].title),
            description: t('tips.tip2Desc', tips[1].description),
        },
        {
            title: t('tips.tip3Title', tips[2].title),
            description: t('tips.tip3Desc', tips[2].description),
        },
        {
            title: t('tips.tip4Title', tips[3].title),
            description: t('tips.tip4Desc', tips[3].description),
        },
    ]

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_15%_15%,rgba(232,207,193,0.6),transparent_45%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-32 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto flex w-full max-w-4xl flex-col gap-4"
            >
                <article className="rounded-3xl border border-skin-tone/70 bg-skin-white/92 p-5 shadow-card backdrop-blur-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-skin-gray">{t('tips.beforeScan', 'Before You Scan')}</p>
                    <h1 className="mt-2 text-2xl font-semibold text-skin-text">{t('tips.title', 'Tips for Better Accuracy')}</h1>
                    <p className="mt-2 text-sm text-skin-gray">
                        {t('tips.subtitle', 'Follow these quick steps for a cleaner capture and better skin analysis reliability.')}
                    </p>
                    <p className="mt-3 rounded-2xl bg-skin-beige px-3 py-2 text-xs text-skin-gray">
                        {t('common.stepFlow', 'Step 1: Capture -> Step 2: Analyze -> Step 3: Results')}
                    </p>
                </article>

                {localizedTips.map((tip) => (
                    <article
                        key={tip.title}
                        className="rounded-3xl border border-skin-text/20 bg-skin-white p-4 shadow-card ring-1 ring-skin-text/5 backdrop-blur-md"
                    >
                        <h2 className="text-base font-semibold text-skin-text">{tip.title}</h2>
                        <p className="mt-1 text-sm text-skin-gray">{tip.description}</p>
                    </article>
                ))}

                <label className="mt-1 flex items-center gap-3 rounded-2xl border border-skin-tone/65 bg-skin-white/90 px-4 py-3 text-sm text-skin-text backdrop-blur-md">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(event) => onToggleDontShowAgain(event.target.checked)}
                        className="h-4 w-4 rounded border-skin-tone bg-skin-white text-skin-rose"
                    />
                    <span>{t('tips.dontShowAgain', "Don't show again")}</span>
                </label>
            </motion.section>

            <div className="fixed inset-x-0 bottom-3 z-20 px-5">
                <div className="mx-auto max-w-4xl">
                    <div className="h-4 bg-gradient-to-b from-transparent to-[#faf9f7]/85" />
                </div>
                <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 rounded-3xl border border-skin-text/15 bg-skin-white/92 p-2 shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-2xl border border-skin-text/30 bg-skin-beige px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onContinue}
                        className="rounded-2xl bg-[#c98f9d] px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#b98190]"
                    >
                        {t('common.continue', 'Continue')}
                    </button>
                </div>
            </div>
        </main>
    )
}

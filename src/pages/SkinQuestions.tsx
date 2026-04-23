import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import type { SkinQuestionAnswers, SkinQuestionId } from '../types/skin'
import { skinQuestions } from '../utils/questionnaire'

interface SkinQuestionsProps {
    onBack: () => void
    onComplete: (answers: SkinQuestionAnswers) => void
}

const questionIds = skinQuestions.map((question) => question.id)

const createInitialAnswers = (): SkinQuestionAnswers => {
    return {
        middayShine: '',
        afterCleanse: '',
        breakoutFrequency: '',
        poreVisibility: '',
        dryPatchFrequency: '',
        reactivity: '',
    }
}

export function SkinQuestions({ onBack, onComplete }: SkinQuestionsProps) {
    const { t } = useI18n()
    const [activeIndex, setActiveIndex] = useState(0)
    const [answers, setAnswers] = useState<SkinQuestionAnswers>(createInitialAnswers)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const activeQuestion = skinQuestions[activeIndex]
    const questionTitle = t(`questions.${activeQuestion.id}.title`, activeQuestion.title)
    const questionSubtitle = t(`questions.${activeQuestion.id}.subtitle`, activeQuestion.subtitle)
    const progress = Math.round(((activeIndex + 1) / skinQuestions.length) * 100)

    const canContinue = useMemo(() => {
        return questionIds.every((id) => answers[id as SkinQuestionId])
    }, [answers])

    useEffect(() => {
        if (!canContinue) {
            return
        }

        onComplete(answers)
    }, [answers, canContinue, onComplete])

    const selectOption = (optionId: string) => {
        if (isTransitioning) {
            return
        }

        setAnswers((prev) => ({
            ...prev,
            [activeQuestion.id]: optionId,
        }))

        setIsTransitioning(true)
        window.setTimeout(() => {
            setActiveIndex((prev) => Math.min(prev + 1, skinQuestions.length - 1))
            setIsTransitioning(false)
        }, 220)
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_10%_10%,rgba(232,207,193,0.65),transparent_45%),linear-gradient(155deg,#FAF9F7_0%,#F5EDE4_100%)] px-5 pb-10 pt-8 text-skin-text">
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mx-auto flex w-full max-w-3xl flex-col gap-4"
            >
                <article className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5">
                    <p className="text-xs uppercase tracking-[0.16em] text-skin-gray">{t('questions.badge', 'Quick Skin Profile')}</p>
                    <h1 className="mt-2 text-xl font-semibold text-skin-text">{t('questions.title', 'A few answers for better accuracy')}</h1>
                    <p className="mt-1 text-sm text-skin-gray">{t('questions.subtitle', 'Auto-advances after each selection.')}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-skin-beige">
                        <div className="h-full rounded-full bg-[#c98f9d] transition-[width] duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-skin-gray">{t('questions.progress', 'Question {current} of {total}', { current: activeIndex + 1, total: skinQuestions.length })}</p>
                </article>

                <motion.article
                    key={activeQuestion.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-3xl border border-skin-text/20 bg-skin-white p-5 shadow-card ring-1 ring-skin-text/5"
                >
                    <h2 className="text-lg font-semibold text-skin-text">{questionTitle}</h2>
                    <p className="mt-1 text-sm text-skin-gray">{questionSubtitle}</p>
                    <div className="mt-4 grid gap-3">
                        {activeQuestion.options.map((option) => {
                            const optionLabel = t(`questions.${activeQuestion.id}.option.${option.id}.label`, option.label)
                            const optionHelper = t(`questions.${activeQuestion.id}.option.${option.id}.helper`, option.helper)

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => selectOption(option.id)}
                                    disabled={isTransitioning}
                                    className="rounded-2xl border border-skin-text/25 bg-skin-beige px-4 py-3 text-left text-sm font-medium text-skin-text shadow-soft transition hover:bg-[#eddccf] disabled:opacity-70"
                                >
                                    <p>{optionLabel}</p>
                                    <p className="mt-1 text-xs font-normal text-skin-gray">{optionHelper}</p>
                                </button>
                            )
                        })}
                    </div>
                </motion.article>

                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-2xl border border-skin-text/30 bg-skin-white px-4 py-3 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#f7efe8]"
                >
                    {t('questions.backPreview', 'Back to Preview')}
                </button>
            </motion.section>
        </main>
    )
}

import type {
    QuestionnaireAnalysisResult,
    SkinAnalysisResult,
    SkinQuestionId,
    SkinQuestion,
    SkinQuestionAnswers,
    SkinType,
} from '../types/skin'

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value))
}

const toPercent = (value: number): number => {
    return Math.round(clamp(value, 0, 100))
}

const dehydrationSignalDelta: Record<SkinQuestionId, Record<string, number>> = {
    middayShine: {
        very_shiny: 2,
        slight_shine: 8,
        mostly_matte: 4,
        tight_matte: 18,
    },
    afterCleanse: {
        tight: 22,
        balanced: -6,
        oily_quickly: 6,
        cheeks_tight_tzone_oily: 20,
    },
    breakoutFrequency: {
        frequent: 2,
        occasional: 4,
        rare: 1,
        hormonal_only: 3,
    },
    poreVisibility: {
        very_visible: 1,
        moderate: 4,
        minimal: 5,
        hardly_visible: 6,
    },
    dryPatchFrequency: {
        often: 20,
        sometimes: 12,
        rarely: 3,
        never: -6,
    },
    reactivity: {
        very_reactive: 8,
        somewhat_reactive: 5,
        mostly_tolerant: -2,
        rarely_reactive: -4,
    },
}

export const skinQuestions: SkinQuestion[] = [
    {
        id: 'middayShine',
        title: 'Around lunchtime, how shiny does your face look?',
        subtitle: 'Think of a normal day without powder or blotting.',
        options: [
            { id: 'very_shiny', label: 'Very shiny', helper: 'Forehead, nose, and cheeks look oily quickly.', oilinessDelta: 26, hydrationDelta: -8, acneDelta: 10, skinTypeBias: { 'Oily Skin': 2.2, 'Combination Skin': 1.2 } },
            { id: 'slight_shine', label: 'A little shiny in T-zone', helper: 'Nose/forehead shine, cheeks mostly fine.', oilinessDelta: 14, hydrationDelta: -2, acneDelta: 4, skinTypeBias: { 'Combination Skin': 2.1, 'Normal Skin': 0.7 } },
            { id: 'mostly_matte', label: 'Mostly not shiny', helper: 'Skin looks balanced through most of the day.', oilinessDelta: -5, hydrationDelta: 4, acneDelta: -2, skinTypeBias: { 'Normal Skin': 1.6, 'Dry Skin': 0.4 } },
            { id: 'tight_matte', label: 'Not shiny, but feels tight', helper: 'Looks matte but feels dry or uncomfortable.', oilinessDelta: -14, hydrationDelta: 12, acneDelta: -4, skinTypeBias: { 'Dry Skin': 2.1 } },
        ],
    },
    {
        id: 'afterCleanse',
        title: 'How does your skin feel after washing your face?',
        subtitle: 'Give it 15-20 minutes and then choose what fits best.',
        options: [
            { id: 'tight', label: 'Tight and dry', helper: 'Feels stretched, especially on cheeks.', oilinessDelta: -10, hydrationDelta: 16, acneDelta: -1, skinTypeBias: { 'Dry Skin': 2 } },
            { id: 'balanced', label: 'Comfortable and normal', helper: 'No tightness and no quick oiliness.', oilinessDelta: 2, hydrationDelta: 6, acneDelta: -2, skinTypeBias: { 'Normal Skin': 2 } },
            { id: 'oily_quickly', label: 'Gets oily quickly', helper: 'Shine returns fast after cleansing.', oilinessDelta: 15, hydrationDelta: -3, acneDelta: 6, skinTypeBias: { 'Oily Skin': 1.8, 'Combination Skin': 1 } },
            { id: 'cheeks_tight_tzone_oily', label: 'Dry cheeks + oily T-zone', helper: 'Forehead/nose oily but cheeks feel dry.', oilinessDelta: 8, hydrationDelta: 8, acneDelta: 3, skinTypeBias: { 'Combination Skin': 2.4 } },
        ],
    },
    {
        id: 'breakoutFrequency',
        title: 'How often do you get pimples/breakouts?',
        subtitle: 'Think about a typical month, not just one bad week.',
        options: [
            { id: 'frequent', label: 'Very often', helper: 'New breakouts most weeks.', oilinessDelta: 8, hydrationDelta: -4, acneDelta: 18, skinTypeBias: { 'Oily Skin': 1.4, 'Combination Skin': 1.1 } },
            { id: 'occasional', label: 'Sometimes', helper: 'Breakouts appear now and then.', oilinessDelta: 3, hydrationDelta: 0, acneDelta: 9, skinTypeBias: { 'Combination Skin': 1.2, 'Normal Skin': 0.6 } },
            { id: 'rare', label: 'Rarely', helper: 'Only a few times in a month.', oilinessDelta: -2, hydrationDelta: 3, acneDelta: -6, skinTypeBias: { 'Normal Skin': 1.1, 'Dry Skin': 0.8 } },
            { id: 'hormonal_only', label: 'Mostly around periods/stress', helper: 'Breakouts are usually cycle or stress related.', oilinessDelta: 2, hydrationDelta: 1, acneDelta: 4, skinTypeBias: { 'Normal Skin': 0.9, 'Combination Skin': 0.8 } },
        ],
    },
    {
        id: 'poreVisibility',
        title: 'How visible are your pores (especially near nose)?',
        subtitle: 'Use what you usually see in mirror daylight.',
        options: [
            { id: 'very_visible', label: 'Very visible', helper: 'Easy to see even from a normal distance.', oilinessDelta: 12, hydrationDelta: -3, acneDelta: 6, skinTypeBias: { 'Oily Skin': 1.9, 'Combination Skin': 1.1 } },
            { id: 'moderate', label: 'Somewhat visible', helper: 'Visible in mirror, but not very obvious.', oilinessDelta: 6, hydrationDelta: 0, acneDelta: 3, skinTypeBias: { 'Combination Skin': 1.4, 'Normal Skin': 0.8 } },
            { id: 'minimal', label: 'Slightly visible', helper: 'Need to look closely to notice them.', oilinessDelta: -4, hydrationDelta: 4, acneDelta: -2, skinTypeBias: { 'Normal Skin': 1.5, 'Dry Skin': 0.7 } },
            { id: 'hardly_visible', label: 'Hardly visible', helper: 'Pores are barely noticeable.', oilinessDelta: -8, hydrationDelta: 6, acneDelta: -3, skinTypeBias: { 'Dry Skin': 1.4, 'Normal Skin': 0.9 } },
        ],
    },
    {
        id: 'dryPatchFrequency',
        title: 'How often do you notice dry or flaky areas?',
        subtitle: 'Check cheeks, nose sides, chin, and around mouth.',
        options: [
            { id: 'often', label: 'Often', helper: 'Dry patches show up many days each week.', oilinessDelta: -14, hydrationDelta: 16, acneDelta: -2, skinTypeBias: { 'Dry Skin': 2.1 } },
            { id: 'sometimes', label: 'Sometimes', helper: 'Happens now and then, not daily.', oilinessDelta: -4, hydrationDelta: 8, acneDelta: 0, skinTypeBias: { 'Combination Skin': 1.2, 'Dry Skin': 1 } },
            { id: 'rarely', label: 'Rarely', helper: 'Only in weather changes or after actives.', oilinessDelta: 2, hydrationDelta: -2, acneDelta: 1, skinTypeBias: { 'Normal Skin': 1.3, 'Oily Skin': 0.8 } },
            { id: 'never', label: 'Almost never', helper: 'Skin rarely feels flaky or rough.', oilinessDelta: 8, hydrationDelta: -6, acneDelta: 2, skinTypeBias: { 'Oily Skin': 1.4, 'Normal Skin': 0.6 } },
        ],
    },
    {
        id: 'reactivity',
        title: 'How easily does your skin get irritated by new products?',
        subtitle: 'Think redness, burning, itching, or stinging.',
        options: [
            { id: 'very_reactive', label: 'Very easily irritated', helper: 'Many new products sting or cause redness.', oilinessDelta: -2, hydrationDelta: 6, acneDelta: 4, skinTypeBias: { 'Dry Skin': 1.1, 'Combination Skin': 0.9 } },
            { id: 'somewhat_reactive', label: 'Sometimes irritated', helper: 'A few products cause mild irritation.', oilinessDelta: 0, hydrationDelta: 3, acneDelta: 2, skinTypeBias: { 'Combination Skin': 1.2, 'Normal Skin': 0.7 } },
            { id: 'mostly_tolerant', label: 'Usually fine', helper: 'Most products work without problems.', oilinessDelta: 2, hydrationDelta: 0, acneDelta: 0, skinTypeBias: { 'Normal Skin': 1.3, 'Oily Skin': 0.7 } },
            { id: 'rarely_reactive', label: 'Almost never irritated', helper: 'Skin handles new products well.', oilinessDelta: 3, hydrationDelta: -1, acneDelta: -1, skinTypeBias: { 'Normal Skin': 1.1, 'Oily Skin': 0.8 } },
        ],
    },
]

const getHighestSkinType = (scores: Record<SkinType, number>): SkinType => {
    return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Combination Skin') as SkinType
}

export const evaluateQuestionnaire = (answers: SkinQuestionAnswers): QuestionnaireAnalysisResult => {
    let oiliness = 50
    let hydration = 50
    let acneRisk = 35
    let dehydrationTendency = 28
    const skinTypeScores: Record<SkinType, number> = {
        'Oily Skin': 0,
        'Dry Skin': 0,
        'Normal Skin': 0,
        'Combination Skin': 0,
    }

    skinQuestions.forEach((question) => {
        const answerId = answers[question.id]
        const option = question.options.find((item) => item.id === answerId)
        if (!option) {
            return
        }

        oiliness += option.oilinessDelta
        hydration += option.hydrationDelta
        acneRisk += option.acneDelta
        dehydrationTendency += dehydrationSignalDelta[question.id][option.id] ?? 0

            ; (['Oily Skin', 'Dry Skin', 'Normal Skin', 'Combination Skin'] as SkinType[]).forEach((type) => {
                skinTypeScores[type] += option.skinTypeBias[type] ?? 0
            })
    })

    const result: QuestionnaireAnalysisResult = {
        skinType: getHighestSkinType(skinTypeScores),
        oiliness: toPercent(oiliness),
        hydration: toPercent(hydration),
        acneRisk: toPercent(acneRisk),
        typeScores: skinTypeScores,
        dehydrationTendency: toPercent(dehydrationTendency),
    }

    return result
}

const deriveImageTypeScores = (imageResult: SkinAnalysisResult): Record<SkinType, number> => {
    const scores: Record<SkinType, number> = {
        'Oily Skin': imageResult.oiliness * 0.65 + imageResult.acneRisk * 0.2 + (100 - imageResult.hydration) * 0.15,
        'Dry Skin': imageResult.hydration * 0.5 + (100 - imageResult.oiliness) * 0.35 + (100 - imageResult.acneRisk) * 0.15,
        'Normal Skin': (100 - Math.abs(imageResult.oiliness - imageResult.hydration)) * 0.6 + (100 - imageResult.acneRisk) * 0.2 + imageResult.hydration * 0.2,
        'Combination Skin': Math.abs(imageResult.oiliness - imageResult.hydration) * 0.75 + imageResult.oiliness * 0.15 + imageResult.hydration * 0.1,
    }

    scores[imageResult.skinType] += 22
    return scores
}

export const mergeWeightedSkinResult = (
    imageResult: SkinAnalysisResult,
    questionnaireResult: QuestionnaireAnalysisResult,
): SkinAnalysisResult => {
    const confidenceQuality = clamp((imageResult.confidence - 45) / 45, 0, 1)
    const lowLightingPenalty = imageResult.lowLighting ? 0.18 : 0
    const imageWeight = clamp(0.38 + confidenceQuality * 0.36 - lowLightingPenalty, 0.3, 0.75)
    const questionnaireWeight = 1 - imageWeight

    const weightedOiliness = Math.round(imageResult.oiliness * imageWeight + questionnaireResult.oiliness * questionnaireWeight)
    const dehydrationNudge = (questionnaireResult.dehydrationTendency - 50) * 0.18
    const weightedHydration = Math.round(clamp(imageResult.hydration * imageWeight + questionnaireResult.hydration * questionnaireWeight - dehydrationNudge, 0, 100))
    const weightedAcneRisk = Math.round(imageResult.acneRisk * imageWeight + questionnaireResult.acneRisk * questionnaireWeight)

    const imageScores = deriveImageTypeScores(imageResult)
    const finalScores: Record<SkinType, number> = {
        'Oily Skin': imageScores['Oily Skin'] * imageWeight + questionnaireResult.typeScores['Oily Skin'] * 24 * questionnaireWeight,
        'Dry Skin': imageScores['Dry Skin'] * imageWeight + questionnaireResult.typeScores['Dry Skin'] * 24 * questionnaireWeight,
        'Normal Skin': imageScores['Normal Skin'] * imageWeight + questionnaireResult.typeScores['Normal Skin'] * 24 * questionnaireWeight,
        'Combination Skin': imageScores['Combination Skin'] * imageWeight + questionnaireResult.typeScores['Combination Skin'] * 24 * questionnaireWeight,
    }

    if (questionnaireResult.dehydrationTendency >= 65) {
        finalScores['Normal Skin'] -= 10
        if (weightedOiliness >= 48) {
            finalScores['Combination Skin'] += 14
            finalScores['Dry Skin'] += 4
        } else {
            finalScores['Dry Skin'] += 12
        }
    }

    const finalSkinType = getHighestSkinType(finalScores)
    const blendedConfidence = Math.round(clamp(imageResult.confidence * imageWeight + 82 * questionnaireWeight, 55, 96))

    return {
        ...imageResult,
        skinType: finalSkinType,
        confidence: blendedConfidence,
        oiliness: weightedOiliness,
        hydration: weightedHydration,
        acneRisk: weightedAcneRisk,
        weighting: {
            imageWeight,
            questionnaireWeight,
            imageOnlySkinType: imageResult.skinType,
            questionnaireSkinType: questionnaireResult.skinType,
            dehydrationTendency: questionnaireResult.dehydrationTendency,
        },
    }
}

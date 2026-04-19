export type CameraFacing = 'user' | 'environment'

export type SkinType = 'Oily Skin' | 'Dry Skin' | 'Normal Skin' | 'Combination Skin'

export type SkinQuestionId =
    | 'middayShine'
    | 'afterCleanse'
    | 'breakoutFrequency'
    | 'poreVisibility'
    | 'dryPatchFrequency'
    | 'reactivity'

export interface WeightedResultBreakdown {
    imageWeight: number
    questionnaireWeight: number
    imageOnlySkinType: SkinType
    questionnaireSkinType: SkinType
    dehydrationTendency: number
}

export interface SkinAnalysisResult {
    skinType: SkinType
    confidence: number
    oiliness: number
    hydration: number
    acneRisk: number
    redness: number
    texture: number
    darkSpots: number
    lowLighting: boolean
    weighting?: WeightedResultBreakdown
}

export interface SkinQuestionOption {
    id: string
    label: string
    helper: string
    oilinessDelta: number
    hydrationDelta: number
    acneDelta: number
    skinTypeBias: Partial<Record<SkinType, number>>
}

export interface SkinQuestion {
    id: SkinQuestionId
    title: string
    subtitle: string
    options: SkinQuestionOption[]
}

export type SkinQuestionAnswers = Record<SkinQuestionId, string>

export interface QuestionnaireAnalysisResult {
    skinType: SkinType
    oiliness: number
    hydration: number
    acneRisk: number
    typeScores: Record<SkinType, number>
    dehydrationTendency: number
}

export interface ProductRecommendation {
    name: string
    category: string
}

export interface SkinRecommendation {
    morningRoutine: string[]
    nightRoutine: string[]
    tips: string[]
    products: ProductRecommendation[]
}

export interface ScanHistoryEntry {
    id: string
    createdAt: string
    result: SkinAnalysisResult
}

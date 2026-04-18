export type CameraFacing = 'user' | 'environment'

export type SkinType = 'Oily Skin' | 'Dry Skin' | 'Normal Skin' | 'Combination Skin'

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

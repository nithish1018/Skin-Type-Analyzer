export interface FaceBox {
    x: number
    y: number
    width: number
    height: number
}

export interface FaceLandmarkPoint {
    x: number
    y: number
}

export type FaceDetectionStatus = 'single-face' | 'no-face' | 'multiple-faces'

export interface FaceDetectionOutcome {
    status: FaceDetectionStatus
    message: string | null
    guidance: string
    clarity: number
    faceBox: FaceBox | null
    landmarks: FaceLandmarkPoint[]
    faceCount: number
}

export interface FaceCropResult {
    imageData: ImageData
    bounds: FaceBox
}

export interface AnalysisQuality {
    lightingQuality: number
    imageSharpness: number
    averageBrightness: number
}

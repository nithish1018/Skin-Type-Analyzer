import type { AnalysisQuality, FaceBox, FaceLandmarkPoint } from '../types/face'
import type { SkinAnalysisResult, SkinType } from '../types/skin'

interface AnalyzerOutput {
    skinType: SkinType
    confidence: number
    oiliness: number
    hydration: number
    acneRisk: number
}

interface AnalysisSignals {
    brightness: number
    redIntensity: number
    colorVariance: number
    edgeVariance: number
    shineLevel: number
    acneClusterScore: number
    darkSpotScore: number
}

interface AnalysisContext {
    faceDetectionClarity?: number
    lightingQuality?: number
    imageSharpness?: number
    faceBox?: FaceBox | null
    landmarks?: FaceLandmarkPoint[]
}

export interface AnalysisFrameInput {
    imageData: ImageData
    faceBox: FaceBox | null
    landmarks: FaceLandmarkPoint[]
    faceDetectionClarity?: number
}

interface AnalysisMaskGeometry {
    eyePoints: FaceLandmarkPoint[]
    mouthPoint: FaceLandmarkPoint | null
    ellipseCenterX: number
    ellipseCenterY: number
    ellipseRadiusX: number
    ellipseRadiusY: number
    topLimit: number
    bottomLimit: number
    leftLimit: number
    rightLimit: number
    eyeExclusionRadius: number
    mouthExclusionRadius: number
}

interface SignalBundle extends AnalysisSignals {
    usablePixelRatio: number
}

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value))
}

const toPercentage = (value: number): number => {
    return Math.round(clamp(value, 0, 1) * 100)
}

const median = (values: number[]): number => {
    if (values.length === 0) {
        return 0
    }

    const sorted = [...values].sort((left, right) => left - right)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

const average = (values: number[]): number => {
    if (values.length === 0) {
        return 0
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length
}

const standardDeviation = (values: number[]): number => {
    if (values.length < 2) {
        return 0
    }

    const meanValue = average(values)
    const variance = average(values.map((value) => (value - meanValue) ** 2))
    return Math.sqrt(variance)
}

const softmax = (scores: Record<SkinType, number>): Record<SkinType, number> => {
    const maxScore = Math.max(...Object.values(scores))
    const expScores: Record<SkinType, number> = {
        'Oily Skin': Math.exp(scores['Oily Skin'] - maxScore),
        'Dry Skin': Math.exp(scores['Dry Skin'] - maxScore),
        'Normal Skin': Math.exp(scores['Normal Skin'] - maxScore),
        'Combination Skin': Math.exp(scores['Combination Skin'] - maxScore),
    }
    const total = Object.values(expScores).reduce((sum, value) => sum + value, 0)

    return {
        'Oily Skin': expScores['Oily Skin'] / total,
        'Dry Skin': expScores['Dry Skin'] / total,
        'Normal Skin': expScores['Normal Skin'] / total,
        'Combination Skin': expScores['Combination Skin'] / total,
    }
}

const buildMaskGeometry = (
    imageData: ImageData,
    mask?: Pick<AnalysisContext, 'faceBox' | 'landmarks'>,
): AnalysisMaskGeometry | null => {
    if (!mask?.faceBox || mask.faceBox.width <= 0 || mask.faceBox.height <= 0) {
        return null
    }

    const { width, height } = imageData
    const faceBox = {
        x: clamp(mask.faceBox.x, 0, width - 1),
        y: clamp(mask.faceBox.y, 0, height - 1),
        width: clamp(mask.faceBox.width, 1, width),
        height: clamp(mask.faceBox.height, 1, height),
    }

    const eyePoints = mask.landmarks?.slice(0, 2) ?? []
    const mouthPoint = mask.landmarks?.[3] ?? null
    const maxDimension = Math.max(faceBox.width, faceBox.height)

    return {
        eyePoints,
        mouthPoint,
        ellipseCenterX: faceBox.x + faceBox.width / 2,
        ellipseCenterY: faceBox.y + faceBox.height * 0.54,
        ellipseRadiusX: Math.max(faceBox.width * 0.42, width * 0.2),
        ellipseRadiusY: Math.max(faceBox.height * 0.48, height * 0.24),
        topLimit: faceBox.y + faceBox.height * 0.12,
        bottomLimit: faceBox.y + faceBox.height * 0.9,
        leftLimit: faceBox.x + faceBox.width * 0.08,
        rightLimit: faceBox.x + faceBox.width * 0.92,
        eyeExclusionRadius: maxDimension * 0.12,
        mouthExclusionRadius: maxDimension * 0.14,
    }
}

const distanceSquared = (leftX: number, leftY: number, rightX: number, rightY: number): number => {
    return (leftX - rightX) ** 2 + (leftY - rightY) ** 2
}

const isSkinSample = (x: number, y: number, geometry: AnalysisMaskGeometry | null): boolean => {
    if (!geometry) {
        return true
    }

    if (x < geometry.leftLimit || x > geometry.rightLimit || y < geometry.topLimit || y > geometry.bottomLimit) {
        return false
    }

    const normalizedX = (x - geometry.ellipseCenterX) / Math.max(1, geometry.ellipseRadiusX)
    const normalizedY = (y - geometry.ellipseCenterY) / Math.max(1, geometry.ellipseRadiusY)

    if ((normalizedX * normalizedX) + (normalizedY * normalizedY) > 1) {
        return false
    }

    if (geometry.eyePoints.some((point) => distanceSquared(x, y, point.x, point.y) < geometry.eyeExclusionRadius ** 2)) {
        return false
    }

    if (geometry.mouthPoint && distanceSquared(x, y, geometry.mouthPoint.x, geometry.mouthPoint.y) < geometry.mouthExclusionRadius ** 2) {
        return false
    }

    return true
}

export function analyzeSkin(imageData: ImageData): AnalyzerOutput {
    return analyzeSkinWithContext(imageData)
}

const extractSignals = (
    imageData: ImageData,
    mask?: Pick<AnalysisContext, 'faceBox' | 'landmarks'>,
): SignalBundle => {
    const { data, width, height } = imageData
    const totalPixels = Math.max(1, width * height)
    const geometry = buildMaskGeometry(imageData, mask)

    let brightnessSum = 0
    let brightnessSquared = 0
    let redSum = 0
    let saturationSum = 0
    let darkPixels = 0
    let usablePixels = 0

    const zoneColumns = 3
    const zoneBrightness = Array.from({ length: zoneColumns }, () => ({ sum: 0, count: 0 }))
    const acneGridSize = 12
    const acneGrid = Array.from({ length: acneGridSize * acneGridSize }, () => 0)

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (!isSkinSample(x, y, geometry)) {
                continue
            }

            const i = (y * width + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            const maxChannel = Math.max(r, g, b)
            const minChannel = Math.min(r, g, b)
            const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
            const redStrength = (r - ((g + b) / 2)) / 255

            usablePixels += 1
            brightnessSum += brightness
            brightnessSquared += brightness * brightness
            redSum += redStrength
            saturationSum += saturation

            if (brightness < 0.22) {
                darkPixels += 1
            }

            const zone = clamp(Math.floor((x / Math.max(1, width)) * zoneColumns), 0, zoneColumns - 1)
            zoneBrightness[zone].sum += brightness
            zoneBrightness[zone].count += 1

            if (redStrength > 0.16 && r > 125) {
                const gx = clamp(Math.floor((x / Math.max(1, width)) * acneGridSize), 0, acneGridSize - 1)
                const gy = clamp(Math.floor((y / Math.max(1, height)) * acneGridSize), 0, acneGridSize - 1)
                acneGrid[gy * acneGridSize + gx] += 1
            }
        }
    }

    if (geometry && usablePixels < Math.max(80, totalPixels * 0.08)) {
        return extractSignals(imageData)
    }

    let edgeVariance = 0
    let edgeSamples = 0
    for (let y = 0; y < height - 1; y += 2) {
        for (let x = 0; x < width - 1; x += 2) {
            if (!isSkinSample(x, y, geometry) || !isSkinSample(x + 1, y, geometry) || !isSkinSample(x, y + 1, geometry)) {
                continue
            }

            const i = (y * width + x) * 4
            const j = (y * width + (x + 1)) * 4
            const k = ((y + 1) * width + x) * 4

            const lumaA = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            const lumaB = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]
            const lumaC = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2]

            edgeVariance += Math.abs(lumaA - lumaB) + Math.abs(lumaA - lumaC)
            edgeSamples += 2
        }
    }

    const sampleCount = Math.max(1, usablePixels)
    const meanBrightness = brightnessSum / sampleCount
    const colorVariance = clamp(brightnessSquared / sampleCount - meanBrightness * meanBrightness, 0, 1)
    const redIntensity = clamp((redSum / sampleCount + 0.06) * 2.6, 0, 1)
    const shineLevel = clamp((saturationSum / sampleCount) * 0.65 + meanBrightness * 0.35, 0, 1)
    const roughness = clamp((edgeVariance / Math.max(1, edgeSamples)) / 68, 0, 1)

    const redClusters = acneGrid.filter((count) => count > 6).length
    const acneClusterScore = clamp(redClusters / (acneGrid.length * 0.18), 0, 1)
    const darkSpotScore = clamp(darkPixels / sampleCount / 0.26, 0, 1)

    const zoneAverages = zoneBrightness.map((zone) => zone.sum / Math.max(1, zone.count))
    const zoneSpread = Math.max(...zoneAverages) - Math.min(...zoneAverages)

    return {
        brightness: meanBrightness,
        redIntensity,
        colorVariance: clamp(colorVariance + zoneSpread * 0.25, 0, 1),
        edgeVariance: roughness,
        shineLevel,
        acneClusterScore,
        darkSpotScore,
        usablePixelRatio: usablePixels / totalPixels,
    }
}

const finalizeQuality = (signals: SignalBundle, consistencyScore = 1): AnalysisQuality => {
    const lightingQuality = clamp((signals.brightness - 0.18) / 0.58, 0, 1)
    const imageSharpness = clamp(signals.edgeVariance * 1.22 + signals.colorVariance * 0.08, 0, 1)
    const skinCoverage = clamp(signals.usablePixelRatio / 0.34, 0, 1)
    const stabilityScore = clamp((lightingQuality * 0.36) + (imageSharpness * 0.32) + (skinCoverage * 0.18) + (consistencyScore * 0.14), 0, 1)

    let reason: string | null = null
    let pass = true

    if (signals.usablePixelRatio < 0.08) {
        pass = false
        reason = 'Not enough skin area was visible.'
    } else if (lightingQuality < 0.14) {
        pass = false
        reason = 'Lighting is too low.'
    } else if (imageSharpness < 0.08) {
        pass = false
        reason = 'The image is too soft or blurry.'
    } else if (consistencyScore < 0.28) {
        pass = false
        reason = 'The capture is too unstable.'
    }

    return {
        lightingQuality,
        imageSharpness,
        averageBrightness: signals.brightness,
        usablePixelRatio: signals.usablePixelRatio,
        skinCoverage,
        stabilityScore,
        pass,
        reason,
    }
}

export const assessImageQuality = (
    imageData: ImageData,
    mask?: Pick<AnalysisContext, 'faceBox' | 'landmarks'>,
): AnalysisQuality => {
    const signals = extractSignals(imageData, mask)
    return finalizeQuality(signals)
}

const predictSkinType = (signals: SignalBundle): { skinType: SkinType; probabilities: Record<SkinType, number> } => {
    const scores: Record<SkinType, number> = {
        'Oily Skin': signals.shineLevel * 1.35 + signals.redIntensity * 0.55 + signals.colorVariance * 0.35 + signals.brightness * 0.1,
        'Dry Skin': (1 - signals.brightness) * 1.3 + (1 - signals.shineLevel) * 0.65 + (1 - signals.redIntensity) * 0.3,
        'Normal Skin': signals.brightness * 0.9 + (1 - signals.colorVariance) * 1.05 + (1 - signals.shineLevel) * 0.55 - signals.redIntensity * 0.25,
        'Combination Skin': signals.colorVariance * 1.2 + signals.redIntensity * 0.25 + Math.abs(signals.brightness - 0.5) * 0.3,
    }

    const probabilities = softmax(scores)
    const skinType = (Object.entries(probabilities).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Combination Skin') as SkinType

    return { skinType, probabilities }
}

const buildAnalysisResult = (
    signals: SignalBundle,
    quality: AnalysisQuality,
    faceDetectionClarity: number,
    consistencyScore = 1,
): AnalyzerOutput => {
    const prediction = predictSkinType(signals)

    const hydrationRaw = signals.brightness * 0.56 + (1 - signals.edgeVariance) * 0.28 + (1 - signals.redIntensity) * 0.16
    const oilinessRaw = signals.shineLevel * 0.52 + signals.redIntensity * 0.22 + signals.colorVariance * 0.26
    const acneRaw = signals.redIntensity * 0.52 + signals.acneClusterScore * 0.32 + signals.edgeVariance * 0.16

    const hydration = toPercentage(hydrationRaw)
    const oiliness = toPercentage(oilinessRaw)
    const acneRisk = toPercentage(acneRaw)

    const qualityScore = clamp(
        faceDetectionClarity * 0.32
        + quality.lightingQuality * 0.25
        + quality.imageSharpness * 0.2
        + quality.skinCoverage * 0.13
        + quality.stabilityScore * 0.1,
        0,
        1,
    )
    const modelConfidence = prediction.probabilities[prediction.skinType]
    const separationScore = Math.abs(oiliness - hydration) / 100
    const confidence = Math.round(
        clamp(
            0.42 + modelConfidence * 0.38 + qualityScore * 0.12 + consistencyScore * 0.08 + separationScore * 0.1,
            0.5,
            0.98,
        ) * 100,
    )

    return {
        skinType: prediction.skinType,
        confidence,
        oiliness,
        hydration,
        acneRisk,
    }
}

export const analyzeSkinWithContext = (
    imageData: ImageData,
    context: AnalysisContext = {},
): AnalyzerOutput => {
    const signals = extractSignals(imageData, context)
    const quality = finalizeQuality(signals)
    const faceClarity = context.faceDetectionClarity ?? 0.72

    return buildAnalysisResult(signals, quality, faceClarity)
}

export const analyzeSkinFrames = (
    frames: AnalysisFrameInput[],
): SkinAnalysisResult => {
    if (frames.length === 0) {
        throw new Error('No analysis frames were provided.')
    }

    const snapshots = frames.map((frame) => {
        const signals = extractSignals(frame.imageData, {
            faceBox: frame.faceBox,
            landmarks: frame.landmarks,
        })
        const quality = finalizeQuality(signals)

        return {
            signals,
            quality,
            faceClarity: frame.faceDetectionClarity ?? 0.72,
        }
    })

    const usableSnapshots = snapshots.filter((snapshot) => snapshot.quality.pass)
    const selectedSnapshots = usableSnapshots.length > 0 ? usableSnapshots : snapshots

    const aggregatedSignals: SignalBundle = {
        brightness: median(selectedSnapshots.map((snapshot) => snapshot.signals.brightness)),
        redIntensity: median(selectedSnapshots.map((snapshot) => snapshot.signals.redIntensity)),
        colorVariance: median(selectedSnapshots.map((snapshot) => snapshot.signals.colorVariance)),
        edgeVariance: median(selectedSnapshots.map((snapshot) => snapshot.signals.edgeVariance)),
        shineLevel: median(selectedSnapshots.map((snapshot) => snapshot.signals.shineLevel)),
        acneClusterScore: median(selectedSnapshots.map((snapshot) => snapshot.signals.acneClusterScore)),
        darkSpotScore: median(selectedSnapshots.map((snapshot) => snapshot.signals.darkSpotScore)),
        usablePixelRatio: median(selectedSnapshots.map((snapshot) => snapshot.signals.usablePixelRatio)),
    }

    const aggregatedConsistency = clamp(
        1
        - standardDeviation(selectedSnapshots.map((snapshot) => snapshot.signals.brightness)) * 1.3
        - standardDeviation(selectedSnapshots.map((snapshot) => snapshot.signals.redIntensity)) * 0.9
        - standardDeviation(selectedSnapshots.map((snapshot) => snapshot.signals.shineLevel)) * 0.7,
        0,
        1,
    )
    const aggregatedQuality = finalizeQuality(aggregatedSignals, aggregatedConsistency)
    const faceClarity = average(selectedSnapshots.map((snapshot) => snapshot.faceClarity))

    const baseResult = buildAnalysisResult(aggregatedSignals, aggregatedQuality, faceClarity, aggregatedConsistency)

    return {
        ...baseResult,
        redness: toPercentage(aggregatedSignals.redIntensity),
        texture: toPercentage(aggregatedSignals.edgeVariance),
        darkSpots: toPercentage(aggregatedSignals.darkSpotScore),
        lowLighting: aggregatedQuality.averageBrightness < 0.32 || !aggregatedQuality.pass,
    }
}

export function deriveExtendedMetrics(
    imageData: ImageData,
    baseResult: AnalyzerOutput,
    context: AnalysisContext = {},
): SkinAnalysisResult {
    const signals = extractSignals(imageData, context)
    const quality = finalizeQuality(signals)

    return {
        ...baseResult,
        redness: toPercentage(signals.redIntensity),
        texture: toPercentage(signals.edgeVariance),
        darkSpots: toPercentage(signals.darkSpotScore),
        lowLighting: quality.averageBrightness < 0.32 || !quality.pass,
    }
}
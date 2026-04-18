import type { AnalysisQuality } from '../types/face'
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
}

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value))
}

const toPercentage = (value: number): number => {
    return Math.round(clamp(value, 0, 1) * 100)
}

export function analyzeSkin(imageData: ImageData): AnalyzerOutput {
    return analyzeSkinWithContext(imageData)
}

const extractSignals = (imageData: ImageData): AnalysisSignals => {
    const { data, width, height } = imageData
    const totalPixels = Math.max(1, width * height)

    let brightnessSum = 0
    let brightnessSquared = 0
    let redSum = 0
    let saturationSum = 0
    let darkPixels = 0

    const zoneColumns = 3
    const zoneBrightness = Array.from({ length: zoneColumns }, () => ({ sum: 0, count: 0 }))
    const acneGridSize = 12
    const acneGrid = Array.from({ length: acneGridSize * acneGridSize }, () => 0)

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const i = (y * width + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            const maxChannel = Math.max(r, g, b)
            const minChannel = Math.min(r, g, b)
            const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
            const redStrength = (r - ((g + b) / 2)) / 255

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

    let edgeVariance = 0
    let edgeSamples = 0
    for (let y = 0; y < height - 1; y += 2) {
        for (let x = 0; x < width - 1; x += 2) {
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

    const meanBrightness = brightnessSum / totalPixels
    const colorVariance = clamp(brightnessSquared / totalPixels - meanBrightness * meanBrightness, 0, 1)
    const redIntensity = clamp((redSum / totalPixels + 0.06) * 2.6, 0, 1)
    const shineLevel = clamp((saturationSum / totalPixels) * 0.65 + meanBrightness * 0.35, 0, 1)
    const roughness = clamp((edgeVariance / Math.max(1, edgeSamples)) / 68, 0, 1)

    const redClusters = acneGrid.filter((count) => count > 6).length
    const acneClusterScore = clamp(redClusters / (acneGrid.length * 0.18), 0, 1)
    const darkSpotScore = clamp(darkPixels / totalPixels / 0.26, 0, 1)

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
    }
}

export const assessImageQuality = (imageData: ImageData): AnalysisQuality => {
    const signals = extractSignals(imageData)

    const lightingQuality = clamp((signals.brightness - 0.2) / 0.55, 0, 1)
    const imageSharpness = clamp(signals.edgeVariance * 1.25, 0, 1)

    return {
        lightingQuality,
        imageSharpness,
        averageBrightness: signals.brightness,
    }
}

export const analyzeSkinWithContext = (
    imageData: ImageData,
    context: AnalysisContext = {},
): AnalyzerOutput => {
    const signals = extractSignals(imageData)

    const quality = assessImageQuality(imageData)
    const lightingQuality = context.lightingQuality ?? quality.lightingQuality
    const imageSharpness = context.imageSharpness ?? quality.imageSharpness
    const faceClarity = context.faceDetectionClarity ?? 0.72

    const hydrationRaw = signals.brightness * 0.58 + (1 - signals.edgeVariance) * 0.27 + (1 - signals.redIntensity) * 0.15
    const oilinessRaw = signals.shineLevel * 0.55 + signals.redIntensity * 0.2 + signals.colorVariance * 0.25
    const acneRaw = signals.redIntensity * 0.55 + signals.acneClusterScore * 0.35 + signals.edgeVariance * 0.1

    const hydration = toPercentage(hydrationRaw)
    const oiliness = toPercentage(oilinessRaw)
    const acneRisk = toPercentage(acneRaw)

    const mixedZones = Math.abs(hydration - oiliness) < 20 && signals.colorVariance > 0.045

    let skinType: SkinType
    if (signals.brightness > 0.57 && signals.colorVariance < 0.032 && signals.shineLevel < 0.56) {
        skinType = 'Normal Skin'
    } else if (signals.brightness > 0.54 && signals.shineLevel > 0.6) {
        skinType = 'Oily Skin'
    } else if (signals.brightness < 0.45 && signals.colorVariance < 0.04) {
        skinType = 'Dry Skin'
    } else if (mixedZones) {
        skinType = 'Combination Skin'
    } else {
        skinType = oiliness > hydration ? 'Oily Skin' : 'Combination Skin'
    }

    const separation = Math.abs(oiliness - hydration) / 100
    const qualityScore = faceClarity * 0.45 + lightingQuality * 0.3 + imageSharpness * 0.25

    const confidence = Math.round(clamp(0.5 + qualityScore * 0.45 + separation * 0.1, 0.52, 0.97) * 100)

    return {
        skinType,
        confidence,
        oiliness,
        hydration,
        acneRisk,
    }
}

export function deriveExtendedMetrics(
    imageData: ImageData,
    baseResult: AnalyzerOutput,
): SkinAnalysisResult {
    const signals = extractSignals(imageData)
    const quality = assessImageQuality(imageData)

    return {
        ...baseResult,
        redness: toPercentage(signals.redIntensity),
        texture: toPercentage(signals.edgeVariance),
        darkSpots: toPercentage(signals.darkSpotScore),
        lowLighting: quality.averageBrightness < 0.32,
    }
}

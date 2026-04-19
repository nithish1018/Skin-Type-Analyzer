import type { ScanHistoryEntry, SkinAnalysisResult } from '../types/skin'

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'no-data'

export interface TrendMetricSummary {
    label: string
    current: number | null
    baseline: number | null
    delta: number | null
    direction: TrendDirection
    isBetter: boolean | null
    note: string
}

export interface TrendSnapshotSummary {
    title: string
    sampleCount: number
    currentLabel: string
    baselineLabel: string
    metrics: TrendMetricSummary[]
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

const metricLabels: Record<'oiliness' | 'hydration' | 'acneRisk', string> = {
    oiliness: 'Oiliness',
    hydration: 'Hydration',
    acneRisk: 'Acne Risk',
}

const getAverage = (values: number[]): number | null => {
    if (values.length === 0) {
        return null
    }

    return values.reduce((total, value) => total + value, 0) / values.length
}

const classifyTrend = (delta: number, higherIsBetter: boolean): TrendDirection => {
    const movement = higherIsBetter ? delta : -delta

    if (movement > 2) {
        return 'improving'
    }

    if (movement < -2) {
        return 'declining'
    }

    return 'stable'
}

const createMetricSummary = (
    label: string,
    current: number | null,
    baseline: number | null,
    higherIsBetter: boolean,
): TrendMetricSummary => {
    if (current === null || baseline === null) {
        return {
            label,
            current,
            baseline,
            delta: null,
            direction: 'no-data',
            isBetter: null,
            note: 'Need more scans to compare.',
        }
    }

    const delta = current - baseline
    const direction = classifyTrend(delta, higherIsBetter)

    return {
        label,
        current,
        baseline,
        delta,
        direction,
        isBetter: direction === 'improving',
        note:
            direction === 'improving'
                ? 'Better than baseline'
                : direction === 'declining'
                    ? 'Worse than baseline'
                    : 'About the same',
    }
}

const getEntryAverages = (entries: ScanHistoryEntry[]) => {
    return {
        oiliness: getAverage(entries.map((entry) => entry.result.oiliness)),
        hydration: getAverage(entries.map((entry) => entry.result.hydration)),
        acneRisk: getAverage(entries.map((entry) => entry.result.acneRisk)),
    }
}

export const buildRecentTrendSnapshot = (
    history: ScanHistoryEntry[],
    currentResult: SkinAnalysisResult,
    sampleSize = 5,
): TrendSnapshotSummary | null => {
    if (history.length < 2) {
        return null
    }

    const baselineEntries = history.slice(1, sampleSize + 1)
    const baseline = getEntryAverages(baselineEntries)

    return {
        title: `Compared with last ${baselineEntries.length} scan${baselineEntries.length === 1 ? '' : 's'}`,
        sampleCount: baselineEntries.length,
        currentLabel: 'Current scan',
        baselineLabel: `Average of last ${baselineEntries.length}`,
        metrics: [
            createMetricSummary(metricLabels.oiliness, currentResult.oiliness, baseline.oiliness, false),
            createMetricSummary(metricLabels.hydration, currentResult.hydration, baseline.hydration, true),
            createMetricSummary(metricLabels.acneRisk, currentResult.acneRisk, baseline.acneRisk, false),
        ],
    }
}

export const buildWindowTrendSnapshot = (history: ScanHistoryEntry[], days: number): TrendSnapshotSummary | null => {
    if (history.length === 0) {
        return null
    }

    const now = Date.now()
    const currentWindowStart = now - days * DAY_IN_MS
    const previousWindowStart = now - days * DAY_IN_MS * 2

    const currentWindow = history.filter((entry) => {
        const entryTime = new Date(entry.createdAt).getTime()
        return entryTime >= currentWindowStart && entryTime <= now
    })

    const previousWindow = history.filter((entry) => {
        const entryTime = new Date(entry.createdAt).getTime()
        return entryTime >= previousWindowStart && entryTime < currentWindowStart
    })

    const currentAverages = getEntryAverages(currentWindow)
    const previousAverages = getEntryAverages(previousWindow)

    return {
        title: `Last ${days} day${days === 1 ? '' : 's'}`,
        sampleCount: currentWindow.length,
        currentLabel: `Current ${days}-day average`,
        baselineLabel: previousWindow.length > 0 ? `Previous ${days}-day average` : 'Previous period unavailable',
        metrics: [
            createMetricSummary(metricLabels.oiliness, currentAverages.oiliness, previousAverages.oiliness, false),
            createMetricSummary(metricLabels.hydration, currentAverages.hydration, previousAverages.hydration, true),
            createMetricSummary(metricLabels.acneRisk, currentAverages.acneRisk, previousAverages.acneRisk, false),
        ],
    }
}
import '@mediapipe/face_detection'
import type { Detection, FaceDetection as MediaPipeFaceDetection, InputImage } from '@mediapipe/face_detection'
import type { FaceCropResult, FaceDetectionOutcome, FaceLandmarkPoint } from '../types/face'

const MEDIAPIPE_ASSET_BASE = '/mediapipe'
const MEDIAPIPE_CORE_SCRIPT = `${MEDIAPIPE_ASSET_BASE}/face_detection.js`

declare global {
    interface Window {
        FaceDetection?: new (config?: { locateFile?: (path: string, prefix?: string) => string }) => MediaPipeFaceDetection
    }
}

let detectorPromise: Promise<MediaPipeFaceDetection> | null = null
let detectionQueue: Promise<void> = Promise.resolve()
let activeSelfieMode: boolean | null = null
let loaderPromise: Promise<void> | null = null

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value))
}

const getImageSize = (image: InputImage): { width: number; height: number } => {
    if (image instanceof HTMLVideoElement) {
        return { width: image.videoWidth, height: image.videoHeight }
    }

    return {
        width: image.width,
        height: image.height,
    }
}

const loadMediaPipeCoreScript = async (): Promise<void> => {
    if (window.FaceDetection) {
        return
    }

    if (!loaderPromise) {
        loaderPromise = new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src="${MEDIAPIPE_CORE_SCRIPT}"]`) as HTMLScriptElement | null
            if (existing) {
                if (window.FaceDetection) {
                    resolve()
                    return
                }

                existing.addEventListener('load', () => resolve(), { once: true })
                existing.addEventListener('error', () => reject(new Error('Failed to load MediaPipe core script.')), { once: true })
                return
            }

            const script = document.createElement('script')
            script.src = MEDIAPIPE_CORE_SCRIPT
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load MediaPipe core script.'))
            document.head.appendChild(script)
        })
    }

    await loaderPromise
}

const getFaceDetector = async (): Promise<MediaPipeFaceDetection> => {
    if (!detectorPromise) {
        detectorPromise = (async () => {
            let FaceDetectionCtor = window.FaceDetection
            if (!FaceDetectionCtor) {
                await loadMediaPipeCoreScript()
                FaceDetectionCtor = window.FaceDetection
            }

            if (!FaceDetectionCtor) {
                throw new Error('MediaPipe FaceDetection failed to load.')
            }

            const detector = new FaceDetectionCtor({
                locateFile: (file) => `${MEDIAPIPE_ASSET_BASE}/${file}`,
            })
            detector.setOptions({
                selfieMode: false,
                model: 'short',
                minDetectionConfidence: 0.62,
            })
            await detector.initialize()
            return detector
        })()
    }

    return detectorPromise
}

export const initFaceDetection = async (): Promise<void> => {
    await getFaceDetector()
}

const failedOutcome = (message: string): FaceDetectionOutcome => {
    return {
        status: 'no-face',
        message,
        guidance: 'Hold device steady',
        clarity: 0,
        faceBox: null,
        landmarks: [],
        faceCount: 0,
    }
}

const guidanceFromFace = (
    box: { x: number; y: number; width: number; height: number },
    frameWidth: number,
    frameHeight: number,
): string => {
    const areaRatio = (box.width * box.height) / Math.max(1, frameWidth * frameHeight)
    const centerX = (box.x + box.width / 2) / Math.max(1, frameWidth)
    const centerY = (box.y + box.height / 2) / Math.max(1, frameHeight)

    if (areaRatio < 0.11) return 'Too far'
    if (areaRatio > 0.48) return 'Too close'
    if (centerX < 0.36) return 'Move right'
    if (centerX > 0.64) return 'Move left'
    if (centerY < 0.34) return 'Move down'
    if (centerY > 0.68) return 'Move up'
    return 'Face aligned'
}

const transformDetection = (
    detection: Detection,
    frameWidth: number,
    frameHeight: number,
): { box: { x: number; y: number; width: number; height: number }; landmarks: FaceLandmarkPoint[] } => {
    const boxWidth = clamp(detection.boundingBox.width, 0, 1) * frameWidth
    const boxHeight = clamp(detection.boundingBox.height, 0, 1) * frameHeight

    const left = clamp(detection.boundingBox.xCenter - detection.boundingBox.width / 2, 0, 1) * frameWidth
    const top = clamp(detection.boundingBox.yCenter - detection.boundingBox.height / 2, 0, 1) * frameHeight

    const landmarks = detection.landmarks.map((point) => ({
        x: clamp(point.x, 0, 1) * frameWidth,
        y: clamp(point.y, 0, 1) * frameHeight,
    }))

    return {
        box: {
            x: left,
            y: top,
            width: boxWidth,
            height: boxHeight,
        },
        landmarks,
    }
}

const runFaceDetection = async (image: InputImage, mirrorForFeedback: boolean): Promise<FaceDetectionOutcome> => {
    const detector = await getFaceDetector()
    const { width, height } = getImageSize(image)

    if (width === 0 || height === 0) {
        return {
            status: 'no-face',
            message: null,
            guidance: 'Align your face inside the circle',
            clarity: 0,
            faceBox: null,
            landmarks: [],
            faceCount: 0,
        }
    }

    return new Promise<FaceDetectionOutcome>((resolve) => {
        if (activeSelfieMode !== mirrorForFeedback) {
            detector.setOptions({
                selfieMode: mirrorForFeedback,
                model: 'short',
                minDetectionConfidence: 0.62,
            })
            activeSelfieMode = mirrorForFeedback
        }

        let isSettled = false
        const settle = (outcome: FaceDetectionOutcome) => {
            if (isSettled) {
                return
            }
            isSettled = true
            window.clearTimeout(timeoutId)
            resolve(outcome)
        }

        const timeoutId = window.setTimeout(() => {
            settle(failedOutcome('Face detection timed out. Please hold still and retry.'))
        }, 1500)

        detector.onResults((results) => {
            const detections = results.detections ?? []

            if (detections.length === 0) {
                settle({
                    status: 'no-face',
                    message: 'No face detected. Please align your face properly.',
                    guidance: 'Align your face inside the circle',
                    clarity: 0,
                    faceBox: null,
                    landmarks: [],
                    faceCount: 0,
                })
                return
            }

            if (detections.length > 1) {
                settle({
                    status: 'multiple-faces',
                    message: 'Multiple faces detected. Only one person allowed.',
                    guidance: 'Only one person allowed in frame',
                    clarity: 0,
                    faceBox: null,
                    landmarks: [],
                    faceCount: detections.length,
                })
                return
            }

            const transformed = transformDetection(detections[0], width, height)
            const areaRatio = (transformed.box.width * transformed.box.height) / Math.max(1, width * height)
            const clarity = clamp((areaRatio - 0.08) / 0.28, 0, 1)

            settle({
                status: 'single-face',
                message: null,
                guidance: guidanceFromFace(transformed.box, width, height),
                clarity,
                faceBox: transformed.box,
                landmarks: transformed.landmarks,
                faceCount: 1,
            })
        })

        detector.send({ image }).catch((error) => {
            const reason = error instanceof Error ? error.message : 'Unknown detector error'
            settle(failedOutcome(`Face detection temporarily unavailable (${reason}). Please retry.`))
        })
    })
}

export const detectFace = async (
    image: InputImage,
    options?: { mirrorForFeedback?: boolean },
): Promise<FaceDetectionOutcome> => {
    const mirrorForFeedback = options?.mirrorForFeedback ?? false

    const detectionPromise = detectionQueue
        .catch(() => undefined)
        .then(() => runFaceDetection(image, mirrorForFeedback))
        .catch((error) => {
            const reason = error instanceof Error ? error.message : 'Unknown initialization error'
            return failedOutcome(`Face detection unavailable (${reason}). Please retry.`)
        })

    detectionQueue = detectionPromise.then(() => undefined).catch(() => undefined)
    return detectionPromise
}

export const cropFace = (sourceCanvas: HTMLCanvasElement, faceBox: FaceCropResult['bounds']): FaceCropResult => {
    const paddingX = faceBox.width * 0.18
    const paddingY = faceBox.height * 0.2

    const sx = clamp(faceBox.x - paddingX, 0, sourceCanvas.width - 1)
    const sy = clamp(faceBox.y - paddingY, 0, sourceCanvas.height - 1)
    const sw = clamp(faceBox.width + paddingX * 2, 1, sourceCanvas.width - sx)
    const sh = clamp(faceBox.height + paddingY * 2, 1, sourceCanvas.height - sy)

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = Math.round(sw)
    outputCanvas.height = Math.round(sh)

    const outputCtx = outputCanvas.getContext('2d')
    if (!outputCtx) {
        throw new Error('Unable to crop face region from image.')
    }

    outputCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outputCanvas.width, outputCanvas.height)

    return {
        imageData: outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height),
        bounds: {
            x: sx,
            y: sy,
            width: sw,
            height: sh,
        },
    }
}

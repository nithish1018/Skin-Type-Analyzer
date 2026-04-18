import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { CaptureButton } from './CaptureButton'
import type { FaceBox, FaceLandmarkPoint } from '../types/face'
import type { CameraFacing } from '../types/skin'

interface CameraViewProps {
    videoRef: RefObject<HTMLVideoElement | null>
    stream: MediaStream | null
    cameraFacing: CameraFacing
    isStarting: boolean
    error: string | null
    isIOSSafari: boolean
    videoDevices: MediaDeviceInfo[]
    selectedDeviceId: string
    faceMessage: string | null
    faceGuidance: string
    faceBox: FaceBox | null
    landmarks: FaceLandmarkPoint[]
    canCapture: boolean
    onSwitchCamera: () => void
    onCapture: () => void
    onRetryPermission: () => void
    onSelectDevice: (deviceId: string) => void
}

export function CameraView({
    videoRef,
    stream,
    cameraFacing,
    isStarting,
    error,
    isIOSSafari,
    videoDevices,
    selectedDeviceId,
    faceMessage,
    faceGuidance,
    faceBox,
    landmarks,
    canCapture,
    onSwitchCamera,
    onCapture,
    onRetryPermission,
    onSelectDevice,
}: CameraViewProps) {
    const stageRef = useRef<HTMLDivElement | null>(null)
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [stream, videoRef])

    useEffect(() => {
        const updateVideoSize = () => {
            const element = videoRef.current
            if (!element) {
                return
            }

            const { videoWidth, videoHeight } = element
            if (videoWidth > 0 && videoHeight > 0) {
                setVideoSize({ width: videoWidth, height: videoHeight })
            }
        }

        updateVideoSize()

        const element = videoRef.current
        element?.addEventListener('loadedmetadata', updateVideoSize)
        element?.addEventListener('canplay', updateVideoSize)

        return () => {
            element?.removeEventListener('loadedmetadata', updateVideoSize)
            element?.removeEventListener('canplay', updateVideoSize)
        }
    }, [stream, videoRef])

    useEffect(() => {
        const measure = () => {
            const element = stageRef.current
            if (!element) {
                return
            }

            const rect = element.getBoundingClientRect()
            setStageSize({ width: rect.width, height: rect.height })
        }

        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [])

    const projectedOverlay = (() => {
        if (!faceBox || stageSize.width === 0 || stageSize.height === 0 || videoSize.width === 0 || videoSize.height === 0) {
            return null
        }

        const intrinsicWidth = videoSize.width
        const intrinsicHeight = videoSize.height
        const scale = Math.max(stageSize.width / intrinsicWidth, stageSize.height / intrinsicHeight)
        const renderedWidth = intrinsicWidth * scale
        const renderedHeight = intrinsicHeight * scale
        const offsetX = (stageSize.width - renderedWidth) / 2
        const offsetY = (stageSize.height - renderedHeight) / 2

        const mapX = (value: number) => offsetX + value * scale
        const mapY = (value: number) => offsetY + value * scale

        return {
            box: {
                x: cameraFacing === 'user'
                    ? stageSize.width - (mapX(faceBox.x) + faceBox.width * scale)
                    : mapX(faceBox.x),
                y: mapY(faceBox.y),
                width: faceBox.width * scale,
                height: faceBox.height * scale,
            },
            landmarks: landmarks.map((point) => ({
                x: cameraFacing === 'user' ? stageSize.width - mapX(point.x) : mapX(point.x),
                y: mapY(point.y),
            })),
        }
    })()

    return (
        <section className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-black">
            <div ref={stageRef} className="relative flex-1 overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

                {projectedOverlay && (
                    <div className={`pointer-events-none absolute inset-0`}>
                        <div
                            className="absolute rounded-[1.8rem] border-2 border-cyan-200/90 shadow-[0_0_18px_rgba(34,211,238,0.55)]"
                            style={{
                                left: `${projectedOverlay.box.x}px`,
                                top: `${projectedOverlay.box.y}px`,
                                width: `${projectedOverlay.box.width}px`,
                                height: `${projectedOverlay.box.height}px`,
                            }}
                        />
                        {projectedOverlay.landmarks.map((point, index) => (
                            <span
                                key={`landmark-${index}`}
                                className="absolute h-2 w-2 rounded-full bg-cyan-100/90"
                                style={{
                                    left: `${point.x}px`,
                                    top: `${point.y}px`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="pointer-events-none absolute left-1/2 top-[44%] h-[min(72vw,18rem)] w-[min(72vw,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200/70 shadow-[0_0_50px_rgba(103,232,249,0.35)]">
                    <div className="absolute inset-4 rounded-full border border-cyan-100/50" />
                </div>

                <header className="absolute left-0 top-0 flex w-full items-center justify-between gap-3 p-4">
                    <div className="rounded-2xl border border-slate-600/60 bg-slate-900/55 px-4 py-2 text-sm text-slate-100 backdrop-blur-md">
                        {cameraFacing === 'user' ? 'Front Camera' : 'Back Camera'}
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchCamera}
                        className="rounded-2xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-50 backdrop-blur-md"
                    >
                        Switch Camera
                    </button>
                </header>
            </div>

            <div className="border-t border-white/10 bg-slate-950/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                    <p className="rounded-xl border border-cyan-200/40 bg-slate-900/70 px-3 py-2 text-center text-xs font-medium text-cyan-100 backdrop-blur-md">
                        Align your face inside the circle
                    </p>

                    <p className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2 text-center text-sm text-slate-100 backdrop-blur-md">
                        {faceGuidance}
                    </p>

                    {videoDevices.length > 1 && (
                        <label className="w-full rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 backdrop-blur-md">
                            Camera Lens
                            <select
                                value={selectedDeviceId}
                                onChange={(event) => onSelectDevice(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-slate-100"
                            >
                                {videoDevices.map((device, index) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${index + 1}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {isIOSSafari && (
                        <p className="rounded-xl border border-cyan-300/35 bg-cyan-900/35 px-3 py-2 text-center text-xs text-cyan-100">
                            iOS Safari tip: if camera stays black, switch lens or tap Retry Access.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-xl border border-rose-400/45 bg-rose-900/35 px-4 py-3 text-center text-sm text-rose-100 backdrop-blur-md">
                            {error}
                        </p>
                    )}

                    {faceMessage && !error && (
                        <p className="rounded-xl border border-amber-400/45 bg-amber-900/35 px-4 py-3 text-center text-sm text-amber-100 backdrop-blur-md">
                            {faceMessage}
                        </p>
                    )}

                    {(error || !stream) && (
                        <button
                            type="button"
                            onClick={onRetryPermission}
                            className="rounded-xl border border-cyan-300/45 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-50"
                        >
                            Retry Access
                        </button>
                    )}

                    {isStarting && (
                        <p className="text-center text-sm text-cyan-100/80">Starting camera...</p>
                    )}
                    <div className="flex justify-center pb-1 pt-1">
                        <CaptureButton onClick={onCapture} disabled={!stream || isStarting || Boolean(error) || !canCapture} />
                    </div>
                </div>
            </div>
        </section>
    )
}

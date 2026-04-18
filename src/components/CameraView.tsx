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
    isDetectorLoading: boolean
    isCapturingFrames: boolean
    captureProgress: number
    captureTarget: number
    error: string | null
    isIOSSafari: boolean
    videoDevices: MediaDeviceInfo[]
    selectedDeviceId: string
    faceMessage: string | null
    faceGuidance: string
    faceBox: FaceBox | null
    landmarks: FaceLandmarkPoint[]
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
    isDetectorLoading,
    isCapturingFrames,
    captureProgress,
    captureTarget,
    error,
    isIOSSafari,
    videoDevices,
    selectedDeviceId,
    faceMessage,
    faceGuidance,
    faceBox,
    landmarks,
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
                x: mapX(faceBox.x),
                y: mapY(faceBox.y),
                width: faceBox.width * scale,
                height: faceBox.height * scale,
            },
            landmarks: landmarks.map((point) => ({
                x: mapX(point.x),
                y: mapY(point.y),
            })),
        }
    })()

    const hasAlignedFace = faceGuidance === 'Face aligned' && !faceMessage && !error
    const statusText = isDetectorLoading
        ? 'Face detection is loading... please wait'
        : isCapturingFrames
            ? `Good shots ${Math.min(captureProgress, captureTarget)}/${captureTarget}`
            : (error ? error : (faceMessage ?? faceGuidance))
    const statusClassName = hasAlignedFace
        ? 'border-skin-green/70 bg-skin-green/35 text-skin-text'
        : isDetectorLoading
            ? 'border-skin-rose/60 bg-skin-rose/25 text-skin-text'
            : isCapturingFrames
                ? 'border-skin-tone/80 bg-skin-tone/35 text-skin-text'
                : error
                    ? 'alert-error'
                    : 'border-skin-text/20 bg-skin-white text-skin-text'

    return (
        <section className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-skin-beige text-skin-text">
            <div ref={stageRef} className="relative flex-1 overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-skin-text/20 via-transparent to-skin-text/30" />

                {projectedOverlay && (
                    <div className={`pointer-events-none absolute inset-0`}>
                        <div
                            className="absolute rounded-[1.8rem] border-2 border-skin-white/90 shadow-[0_0_18px_rgba(250,249,247,0.7)]"
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
                                className="absolute h-2 w-2 rounded-full bg-skin-white/90"
                                style={{
                                    left: `${point.x}px`,
                                    top: `${point.y}px`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        ))}
                    </div>
                )}

                <div
                    className={`pointer-events-none absolute left-1/2 top-[43%] h-[min(58vw,13rem)] w-[min(58vw,13rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${hasAlignedFace ? 'animate-pulseRing border-skin-green/80 shadow-[0_0_45px_rgba(168,195,160,0.55)]' : 'border-skin-white/80 shadow-[0_0_38px_rgba(250,249,247,0.4)]'}`}
                >
                    <div className="absolute inset-4 rounded-full border border-skin-white/75" />
                </div>

                <header className="absolute left-0 top-0 flex w-full items-center justify-between gap-3 p-4">
                    <div className="rounded-2xl border border-skin-text/25 bg-skin-white px-4 py-2 text-sm font-medium text-skin-text shadow-soft backdrop-blur-md">
                        {cameraFacing === 'user' ? 'Front Camera' : 'Back Camera'}
                    </div>
                    <button
                        type="button"
                        onClick={onSwitchCamera}
                        className="rounded-full border border-skin-text/20 bg-[#c98f9d] px-4 py-2 text-sm font-semibold text-white shadow-soft backdrop-blur-md"
                    >
                        Switch
                    </button>
                </header>
            </div>

            <div className="border-t border-skin-text/20 bg-skin-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-card backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                    <p className="text-center text-xs uppercase tracking-[0.16em] text-skin-gray">Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results</p>
                    <p className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold backdrop-blur-md ${statusClassName}`}>
                        {hasAlignedFace ? 'Face position: Good' : statusText}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <p className="rounded-xl border border-skin-text/15 bg-skin-beige px-3 py-2 text-center font-medium text-skin-text">
                            Lighting: {faceMessage?.toLowerCase().includes('light') ? 'Poor' : 'Good'}
                        </p>
                        <p className="rounded-xl border border-skin-text/15 bg-skin-beige px-3 py-2 text-center font-medium text-skin-text">
                            Face Position: {hasAlignedFace ? 'Good' : 'Adjust'}
                        </p>
                    </div>

                    {videoDevices.length > 1 && (
                        <label className="w-full rounded-xl border border-skin-text/20 bg-skin-white px-3 py-2 text-xs text-skin-gray backdrop-blur-md">
                            Camera Lens
                            <select
                                value={selectedDeviceId}
                                onChange={(event) => onSelectDevice(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-skin-tone/60 bg-skin-white px-2 py-2 text-sm text-skin-text"
                            >
                                {videoDevices.map((device, index) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${index + 1}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {isIOSSafari && (error || !stream) && (
                        <p className="alert-warning rounded-xl px-3 py-2 text-center text-xs">
                            iOS Safari tip: if camera stays black, switch lens or tap Retry Access.
                        </p>
                    )}

                    {(error || !stream) && (
                        <button
                            type="button"
                            onClick={onRetryPermission}
                            className="rounded-xl border border-skin-text/30 bg-skin-beige px-4 py-2 text-sm font-semibold text-skin-text shadow-soft hover:bg-[#eddccf]"
                        >
                            Retry Access
                        </button>
                    )}

                    {isStarting && (
                        <p className="text-center text-sm text-skin-gray">Starting camera...</p>
                    )}
                    {isDetectorLoading && (
                        <p className="text-center text-xs text-skin-gray">Initializing detector engine...</p>
                    )}
                    {isCapturingFrames && (
                        <p className="text-center text-xs text-skin-gray">Capturing a short burst for a more reliable result.</p>
                    )}
                    {captureTarget > 0 && (
                        <p className="text-center text-xs text-skin-gray">
                            Better shots captured: {Math.min(captureProgress, captureTarget)}/{captureTarget}
                        </p>
                    )}
                    <div className="flex justify-center pb-1 pt-2">
                        <CaptureButton onClick={onCapture} disabled={!stream || isStarting || Boolean(error) || isCapturingFrames} />
                    </div>
                </div>
            </div>
        </section>
    )
}

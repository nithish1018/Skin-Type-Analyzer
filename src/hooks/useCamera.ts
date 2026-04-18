import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraFacing } from '../types/skin'

interface UseCameraResult {
    stream: MediaStream | null
    isStarting: boolean
    error: string | null
    hasPermission: boolean
    cameraFacing: CameraFacing
    isIOSSafari: boolean
    videoDevices: MediaDeviceInfo[]
    selectedDeviceId: string
    startCamera: () => Promise<void>
    stopCamera: () => void
    switchCamera: () => Promise<void>
    retryPermission: () => Promise<void>
    selectDevice: (deviceId: string) => Promise<void>
}

const isIOSSafariBrowser = (): boolean => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)
    return isIOS && isSafari
}

export function useCamera(defaultFacing: CameraFacing = 'user'): UseCameraResult {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasPermission, setHasPermission] = useState(false)
    const [cameraFacing, setCameraFacing] = useState<CameraFacing>(defaultFacing)
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState('')
    const activeStreamRef = useRef<MediaStream | null>(null)
    const isIOSSafari = isIOSSafariBrowser()

    const stopCamera = useCallback(() => {
        if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach((track) => track.stop())
            activeStreamRef.current = null
        }
        setStream(null)
    }, [])

    const refreshVideoDevices = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameraDevices = devices.filter((device) => device.kind === 'videoinput')
        setVideoDevices(cameraDevices)

        if (!selectedDeviceId && cameraDevices[0]) {
            setSelectedDeviceId(cameraDevices[0].deviceId)
        }
    }, [selectedDeviceId])

    const openCameraStream = useCallback(async (facing: CameraFacing, deviceId: string) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Camera is not available in this browser.')
            return
        }

        setIsStarting(true)
        setError(null)

        try {
            stopCamera()

            const baseConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }

            const videoConstraints: MediaTrackConstraints = deviceId
                ? {
                    ...baseConstraints,
                    deviceId: { exact: deviceId },
                }
                : {
                    ...baseConstraints,
                    facingMode: { ideal: facing },
                }

            let newStream: MediaStream

            try {
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false,
                })
            } catch {
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                })
            }

            activeStreamRef.current = newStream
            setStream(newStream)
            setHasPermission(true)
            await refreshVideoDevices()
        } catch (err) {
            const errorName = err instanceof DOMException ? err.name : 'UnknownError'

            if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
                setError('Camera permission denied. Please allow camera access and retry.')
            } else if (errorName === 'NotFoundError' || errorName === 'OverconstrainedError') {
                setError('Camera not available on this device.')
            } else {
                setError('Unable to start camera. Please try again.')
            }
            setHasPermission(false)
            setStream(null)
        } finally {
            setIsStarting(false)
        }
    }, [refreshVideoDevices, stopCamera])

    const startCamera = useCallback(async () => {
        await openCameraStream(cameraFacing, selectedDeviceId)
    }, [cameraFacing, openCameraStream, selectedDeviceId])

    const switchCamera = useCallback(async () => {
        const nextFacing: CameraFacing = cameraFacing === 'user' ? 'environment' : 'user'
        setCameraFacing(nextFacing)
        setSelectedDeviceId('')
        await openCameraStream(nextFacing, '')
    }, [cameraFacing, openCameraStream])

    const selectDevice = useCallback(async (deviceId: string) => {
        setSelectedDeviceId(deviceId)
        await openCameraStream(cameraFacing, deviceId)
    }, [cameraFacing, openCameraStream])

    const retryPermission = useCallback(async () => {
        await openCameraStream(cameraFacing, selectedDeviceId)
    }, [cameraFacing, openCameraStream, selectedDeviceId])

    useEffect(() => {
        void refreshVideoDevices()

        const onDeviceChange = () => {
            void refreshVideoDevices()
        }

        navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange)
        return () => {
            navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange)
        }
    }, [refreshVideoDevices])

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [stopCamera])

    return {
        stream,
        isStarting,
        error,
        hasPermission,
        cameraFacing,
        isIOSSafari,
        videoDevices,
        selectedDeviceId,
        startCamera,
        stopCamera,
        switchCamera,
        retryPermission,
        selectDevice,
    }
}

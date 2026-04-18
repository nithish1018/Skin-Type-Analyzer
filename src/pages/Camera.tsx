import type { RefObject } from 'react'
import { CameraView } from '../components/CameraView'
import type { FaceBox, FaceLandmarkPoint } from '../types/face'
import type { CameraFacing } from '../types/skin'

interface CameraPageProps {
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

export function CameraPage(props: CameraPageProps) {
    return <CameraView {...props} />
}

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useCamera } from './hooks/useCamera'
import { CameraPage } from './pages/Camera'
import { History } from './pages/History'
import { Home } from './pages/Home'
import { Preview } from './pages/Preview'
import { Results } from './pages/Results'
import { ScanTips } from './pages/ScanTips'
import type { FaceDetectionOutcome } from './types/face'
import type { ScanHistoryEntry, SkinAnalysisResult } from './types/skin'
import { analyzeSkinWithContext, assessImageQuality, deriveExtendedMetrics } from './utils/analyzeSkin'
import { cropFace, detectFace, initFaceDetection } from './utils/faceDetection'

type Screen = 'landing' | 'tips' | 'camera' | 'preview' | 'analyzing' | 'results' | 'history'

const HISTORY_KEY = 'skin-condition-analyzer-history-v1'
const SCAN_TIPS_PREF_KEY = 'skin-condition-analyzer-skip-tips-v1'

const getInitialHistory = (): ScanHistoryEntry[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]') as ScanHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getInitialSkipTipsPreference = (): boolean => {
  try {
    return window.localStorage.getItem(SCAN_TIPS_PREF_KEY) === 'true'
  } catch {
    return false
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedImageData, setCapturedImageData] = useState<ImageData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null)
  const [history, setHistory] = useState<ScanHistoryEntry[]>(getInitialHistory)
  const [skipTipsPreference, setSkipTipsPreference] = useState<boolean>(getInitialSkipTipsPreference)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  const [previewWarning, setPreviewWarning] = useState<string | null>(null)
  const [isDetectorLoading, setIsDetectorLoading] = useState(false)
  const [faceDetection, setFaceDetection] = useState<FaceDetectionOutcome>({
    status: 'no-face',
    message: null,
    guidance: 'Align your face inside the circle',
    clarity: 0,
    faceBox: null,
    landmarks: [],
    faceCount: 0,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const {
    stream,
    isStarting,
    error,
    cameraFacing,
    isIOSSafari,
    videoDevices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    retryPermission,
    selectDevice,
  } = useCamera('user')

  useEffect(() => {
    let isDisposed = false

    const warmupDetector = async () => {
      setIsDetectorLoading(true)
      try {
        await initFaceDetection()
      } finally {
        if (!isDisposed) {
          setIsDetectorLoading(false)
        }
      }
    }

    void warmupDetector()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    if (screen !== 'camera' || !stream) {
      return
    }

    let isDisposed = false
    let isBusy = false

    const runRealtimeDetection = async () => {
      const video = videoRef.current
      if (!video || video.videoWidth === 0 || video.videoHeight === 0 || isBusy) {
        return
      }

      isBusy = true
      try {
        const outcome = await detectFace(video, { mirrorForFeedback: cameraFacing === 'user' })
        if (!isDisposed) {
          setFaceDetection(outcome)
        }
      } catch {
        if (!isDisposed) {
          setFaceDetection((prev) => ({
            ...prev,
            message: 'Face detection failed. Please hold still and retry.',
            guidance: 'Hold device steady',
          }))
        }
      } finally {
        isBusy = false
      }
    }

    void runRealtimeDetection()
    const intervalId = window.setInterval(() => {
      void runRealtimeDetection()
    }, 450)

    return () => {
      isDisposed = true
      window.clearInterval(intervalId)
    }
  }, [cameraFacing, screen, stream])

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    window.localStorage.setItem(SCAN_TIPS_PREF_KEY, String(skipTipsPreference))
  }, [skipTipsPreference])

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const openScanTips = () => {
    if (skipTipsPreference) {
      startScan()
      return
    }

    setScreen('tips')
  }

  const startScan = () => {
    setAnalysisResult(null)
    setCapturedImage(null)
    setCapturedImageData(null)
    setPreviewWarning(null)
    setFaceDetection({
      status: 'no-face',
      message: null,
      guidance: 'Align your face inside the circle',
      clarity: 0,
      faceBox: null,
      landmarks: [],
      faceCount: 0,
    })
    setScreen('camera')
    void startCamera()
    setIsDetectorLoading(true)
    void initFaceDetection().finally(() => {
      setIsDetectorLoading(false)
    })
  }

  const captureFrame = async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const faceOutcome = await detectFace(canvas, { mirrorForFeedback: cameraFacing === 'user' })

    if (faceOutcome.status !== 'single-face' || !faceOutcome.faceBox) {
      setFaceDetection(faceOutcome)
      return
    }

    const croppedFace = cropFace(canvas, faceOutcome.faceBox)

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92))
    setCapturedImageData(croppedFace.imageData)
    setPreviewWarning(null)

    stopCamera()
    setScreen('preview')
  }

  const runAnalysis = async () => {
    if (!capturedImageData) {
      return
    }

    const quality = assessImageQuality(capturedImageData)
    if (quality.averageBrightness < 0.3) {
      setPreviewWarning('Lighting is too low. Please move to a brighter area.')
      return
    }

    setScreen('analyzing')

    window.setTimeout(async () => {
      const baseResult = analyzeSkinWithContext(capturedImageData, {
        faceDetectionClarity: faceDetection.clarity,
        lightingQuality: quality.lightingQuality,
        imageSharpness: quality.imageSharpness,
      })
      const extended = deriveExtendedMetrics(capturedImageData, baseResult)
      setAnalysisResult(extended)

      const historyEntry: ScanHistoryEntry = {
        id: window.crypto?.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        result: extended,
      }
      setHistory((prev) => [historyEntry, ...prev].slice(0, 20))

      setScreen('results')
    }, 1400)
  }

  const retake = () => {
    setCapturedImage(null)
    setCapturedImageData(null)
    setAnalysisResult(null)
    setPreviewWarning(null)
    setFaceDetection({
      status: 'no-face',
      message: null,
      guidance: 'Align your face inside the circle',
      clarity: 0,
      faceBox: null,
      landmarks: [],
      faceCount: 0,
    })
    setScreen('camera')
    void startCamera()
  }

  if (isDesktop) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <section className="max-w-sm rounded-3xl border border-slate-700 bg-slate-900/70 p-6 text-center backdrop-blur-lg">
          <h1 className="text-2xl font-semibold text-cyan-100">Skin Condition Analyzer</h1>
          <p className="mt-3 text-sm text-slate-300">
            Please open this app on your mobile device for the best experience
          </p>
        </section>
      </main>
    )
  }

  if (screen === 'landing') {
    return (
      <Home
        onStart={openScanTips}
        historyCount={history.length}
        onViewHistory={() => setScreen('history')}
      />
    )
  }

  if (screen === 'tips') {
    return (
      <ScanTips
        onContinue={startScan}
        dontShowAgain={skipTipsPreference}
        onToggleDontShowAgain={setSkipTipsPreference}
      />
    )
  }

  if (screen === 'camera') {
    return (
      <CameraPage
        videoRef={videoRef}
        stream={stream}
        cameraFacing={cameraFacing}
        isStarting={isStarting}
        isDetectorLoading={isDetectorLoading}
        error={error}
        isIOSSafari={isIOSSafari}
        videoDevices={videoDevices}
        selectedDeviceId={selectedDeviceId}
        faceMessage={faceDetection.message}
        faceGuidance={faceDetection.guidance}
        faceBox={faceDetection.faceBox}
        landmarks={faceDetection.landmarks}
        canCapture={faceDetection.status === 'single-face'}
        onSwitchCamera={() => {
          void switchCamera()
        }}
        onRetryPermission={() => {
          void retryPermission()
        }}
        onSelectDevice={(deviceId) => {
          void selectDevice(deviceId)
        }}
        onCapture={captureFrame}
      />
    )
  }

  if (screen === 'preview' && capturedImage) {
    return <Preview imageSrc={capturedImage} onRetake={retake} onAnalyze={() => {
      void runAnalysis()
    }} warning={previewWarning} />
  }

  if (screen === 'analyzing') {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_40%),linear-gradient(150deg,#020617_0%,#0b1120_60%,#081528_100%)] p-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs rounded-3xl border border-cyan-200/30 bg-slate-900/50 p-6 text-center text-cyan-100 backdrop-blur-lg"
        >
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-cyan-300/30 border-t-cyan-200" />
          <h2 className="mt-4 text-xl font-semibold">Analyzing Skin Condition</h2>
          <p className="mt-2 text-sm text-slate-300">
            Estimating brightness, texture roughness, redness, and spot markers...
          </p>
        </motion.section>
      </main>
    )
  }

  if (screen === 'results' && analysisResult) {
    return (
      <Results
        result={analysisResult}
        onRetake={retake}
        onViewHistory={() => setScreen('history')}
      />
    )
  }

  if (screen === 'history') {
    return (
      <History
        history={history}
        onBack={() => setScreen('landing')}
        onClear={() => {
          setHistory([])
          window.localStorage.removeItem(HISTORY_KEY)
        }}
      />
    )
  }

  return null
}

export default App

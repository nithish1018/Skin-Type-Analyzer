import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useCamera } from './hooks/useCamera'
import { CameraPage } from './pages/Camera'
import { History } from './pages/History'
import Home from './pages/Home'
import { Preview } from './pages/Preview'
import { Results } from './pages/Results'
import { ScanTips } from './pages/ScanTips'
import { SkinQuestions } from './pages/SkinQuestions'
import { Trends } from './pages/Trends'
import type { FaceDetectionOutcome } from './types/face'
import type { ScanHistoryEntry, SkinAnalysisResult, SkinQuestionAnswers } from './types/skin'
import { analyzeSkinFrames, assessImageQuality } from './utils/analyzeSkin.ts'
import { cropFace, detectFace, initFaceDetection } from './utils/faceDetection'
import { evaluateQuestionnaire, mergeWeightedSkinResult } from './utils/questionnaire'

type Screen = 'landing' | 'tips' | 'camera' | 'preview' | 'questions' | 'analyzing' | 'results' | 'history' | 'trends'

const HISTORY_KEY = 'skin-condition-analyzer-history-v1'
const SCAN_TIPS_PREF_KEY = 'skin-condition-analyzer-skip-tips-v1'
const CAPTURE_TARGET_FRAMES = 3
const CAPTURE_MAX_ATTEMPTS = 5

interface CapturedFrame {
  imageData: ImageData
  faceBox: { x: number; y: number; width: number; height: number } | null
  landmarks: Array<{ x: number; y: number }>
  faceDetectionClarity?: number
  previewUrl: string
}

const wait = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

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
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([])
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null)
  const [history, setHistory] = useState<ScanHistoryEntry[]>(getInitialHistory)
  const [skipTipsPreference, setSkipTipsPreference] = useState<boolean>(getInitialSkipTipsPreference)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  const [previewWarning, setPreviewWarning] = useState<string | null>(null)
  const [isDetectorLoading, setIsDetectorLoading] = useState(false)
  const [isCapturingFrames, setIsCapturingFrames] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
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
    setCapturedFrames([])
    setPreviewWarning(null)
    setIsCapturingFrames(false)
    setCaptureProgress(0)
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
    if (isCapturingFrames) {
      return
    }

    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    setIsCapturingFrames(true)
    setCaptureProgress(0)
    setPreviewWarning(null)

    const samples: CapturedFrame[] = []
    let bestPreviewUrl: string | null = null
    let bestPreviewScore = 0
    let fallbackFrame: CapturedFrame | null = null
    let latestFailure: FaceDetectionOutcome = faceDetection
    let lastQualityWarning: string | null = null

    try {
      for (let attempt = 0; attempt < CAPTURE_MAX_ATTEMPTS && samples.length < CAPTURE_TARGET_FRAMES; attempt += 1) {
        if (attempt > 0) {
          await wait(120)
        }

        const activeVideo = videoRef.current
        if (!activeVideo || activeVideo.videoWidth === 0 || activeVideo.videoHeight === 0) {
          break
        }

        const canvas = document.createElement('canvas')
        canvas.width = activeVideo.videoWidth
        canvas.height = activeVideo.videoHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          break
        }

        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height)

        const faceOutcome = await detectFace(canvas, { mirrorForFeedback: cameraFacing === 'user' })
        latestFailure = faceOutcome
        setFaceDetection(faceOutcome)

        if (faceOutcome.status !== 'single-face' || !faceOutcome.faceBox) {
          continue
        }

        const croppedFace = cropFace(canvas, faceOutcome.faceBox)
        const quality = assessImageQuality(croppedFace.imageData, {
          faceBox: faceOutcome.faceBox,
          landmarks: faceOutcome.landmarks,
        })

        const previewUrl = canvas.toDataURL('image/jpeg', 0.92)
        const frame: CapturedFrame = {
          imageData: croppedFace.imageData,
          faceBox: faceOutcome.faceBox,
          landmarks: faceOutcome.landmarks,
          faceDetectionClarity: faceOutcome.clarity,
          previewUrl,
        }

        const previewScore = quality.lightingQuality * 0.35 + quality.imageSharpness * 0.25 + quality.skinCoverage * 0.25 + faceOutcome.clarity * 0.15
        samples.push(frame)
        setCaptureProgress(samples.length)

        if (!bestPreviewUrl || previewScore > bestPreviewScore) {
          bestPreviewScore = previewScore
          bestPreviewUrl = previewUrl
        }

        if (!quality.pass) {
          latestFailure = {
            ...faceOutcome,
            message: quality.reason ?? faceOutcome.message ?? 'Frame quality is low, but continuing with the best available frame.',
            guidance: 'Hold still and improve the light',
          }
          lastQualityWarning = quality.reason ?? lastQualityWarning
          if (!fallbackFrame) {
            fallbackFrame = frame
          }
        } else if (!fallbackFrame) {
          fallbackFrame = frame
          bestPreviewUrl = previewUrl
        }
      }

      if (samples.length === 0) {
        if (fallbackFrame) {
          samples.push(fallbackFrame)
          setCaptureProgress(samples.length)
          setPreviewWarning('Using the best available frame. Results may improve with steadier lighting.')
        } else {
          setPreviewWarning('Could not capture a stable frame. Please hold still and try again in brighter light.')
          if (latestFailure.message) {
            setFaceDetection(latestFailure)
          }
          return
        }
      } else if (lastQualityWarning) {
        setPreviewWarning(`Using a slightly lower-quality burst. ${lastQualityWarning}`)
      }

      setCapturedImage(bestPreviewUrl ?? samples[Math.floor(samples.length / 2)]?.previewUrl ?? samples[0].previewUrl)
      setCapturedFrames(samples)
      stopCamera()
      setScreen('preview')
    } finally {
      setIsCapturingFrames(false)
      setCaptureProgress(0)
    }
  }

  const runAnalysis = async (answers: SkinQuestionAnswers) => {
    if (capturedFrames.length === 0) {
      return
    }

    setScreen('analyzing')

    window.setTimeout(async () => {
      const imageResult = analyzeSkinFrames(capturedFrames)
      const questionnaireResult = evaluateQuestionnaire(answers)
      const result = mergeWeightedSkinResult(imageResult, questionnaireResult)
      setAnalysisResult(result)

      const historyEntry: ScanHistoryEntry = {
        id: window.crypto?.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        result,
      }
      setHistory((prev) => [historyEntry, ...prev].slice(0, 20))

      setScreen('results')
    }, 1400)
  }

  const retake = () => {
    setCapturedImage(null)
    setCapturedFrames([])
    setAnalysisResult(null)
    setPreviewWarning(null)
    setIsCapturingFrames(false)
    setCaptureProgress(0)
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
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_15%_12%,rgba(232,207,193,0.62),transparent_42%),linear-gradient(160deg,#FAF9F7_0%,#F5EDE4_100%)] p-6 text-skin-text">
        <section className="max-w-sm rounded-3xl border border-skin-text/20 bg-skin-white p-6 text-center shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg">
          <h1 className="text-2xl font-semibold text-skin-text">Skin Analyzer</h1>
          <p className="mt-3 text-sm text-skin-gray">
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
        onCancel={() => setScreen('landing')}
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
        isCapturingFrames={isCapturingFrames}
        captureProgress={captureProgress}
        captureTarget={CAPTURE_TARGET_FRAMES}
        error={error}
        isIOSSafari={isIOSSafari}
        videoDevices={videoDevices}
        selectedDeviceId={selectedDeviceId}
        faceMessage={faceDetection.message}
        faceGuidance={faceDetection.guidance}
        faceBox={faceDetection.faceBox}
        landmarks={faceDetection.landmarks}
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
    return <Preview
      imageSrc={capturedImage}
      goodShots={capturedFrames.length}
      targetShots={CAPTURE_TARGET_FRAMES}
      onRetake={retake}
      onAnalyze={() => {
        setScreen('questions')
      }}
      warning={previewWarning}
    />
  }

  if (screen === 'questions') {
    return (
      <SkinQuestions
        onBack={() => setScreen('preview')}
        onComplete={(answers) => {
          void runAnalysis(answers)
        }}
      />
    )
  }

  if (screen === 'analyzing') {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_20%,rgba(232,207,193,0.6),transparent_42%),linear-gradient(150deg,#FAF9F7_0%,#F5EDE4_100%)] p-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs rounded-3xl border border-skin-text/20 bg-skin-white p-6 text-center text-skin-text shadow-card ring-1 ring-skin-text/5 backdrop-blur-lg"
        >
          <div className="relative mx-auto h-24 w-24">
            <motion.div
              className="absolute inset-0 rounded-[2rem] border border-[#c98f9d]/35 bg-[radial-gradient(circle_at_30%_20%,rgba(201,143,157,0.35),transparent_62%),linear-gradient(150deg,rgba(255,255,255,0.8),rgba(245,237,228,0.92))] shadow-soft"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-[#c98f9d]/55 bg-skin-white/85"
              animate={{ scale: [0.94, 1.03, 0.94], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(201,143,157,0.15)_0%,rgba(201,143,157,0.7)_50%,rgba(201,143,157,0.15)_100%)]"
                animate={{ x: ['-12%', '12%', '-12%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-end gap-1.5">
              {[0, 1, 2].map((drop) => (
                <motion.div
                  key={drop}
                  className="h-2 w-2 rounded-full bg-[#c98f9d]/85"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: drop * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </div>
          <h2 className="mt-4 text-xl font-semibold">Analyzing your skin...</h2>
          <p className="mt-2 text-sm text-skin-gray">
            Checking tone balance, texture smoothness, and hydration patterns.
          </p>
          <p className="mt-3 rounded-2xl bg-skin-beige px-3 py-2 text-xs text-skin-gray">
            Step 1: Capture -&gt; Step 2: Analyze -&gt; Step 3: Results
          </p>
        </motion.section>
      </main>
    )
  }

  if (screen === 'results' && analysisResult) {
    return (
      <Results
        imageSrc={capturedImage}
        result={analysisResult}
        history={history}
        onBackHome={() => setScreen('landing')}
        onViewHistory={() => setScreen('history')}
      />
    )
  }

  if (screen === 'history') {
    return (
      <History
        history={history}
        onBack={() => setScreen('landing')}
        onViewTrends={() => setScreen('trends')}
        onDeleteEntry={(entryId) => {
          setHistory((prev) => prev.filter((entry) => entry.id !== entryId))
        }}
        onClear={() => {
          setHistory([])
          window.localStorage.removeItem(HISTORY_KEY)
        }}
      />
    )
  }

  if (screen === 'trends') {
    return (
      <Trends
        history={history}
        onBackHome={() => setScreen('landing')}
        onBackToScan={() => setScreen('history')}
      />
    )
  }

  return null
}

export default App

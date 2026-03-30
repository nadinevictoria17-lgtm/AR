import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { ARPayload } from '../types'

let activeCameraStream: MediaStream | null = null

export function useARSession() {
  const triggerDetection = useAppStore((s) => s.triggerDetection)

  const activateCamera = useCallback(async () => {
    if (activeCameraStream) return true
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API not supported on this browser/device.')
    }
    activeCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    return true
  }, [])

  const getCameraStream = useCallback(() => activeCameraStream, [])

  const stopCamera = useCallback(() => {
    if (!activeCameraStream) return
    activeCameraStream.getTracks().forEach((track) => track.stop())
    activeCameraStream = null
  }, [])

  const startSpatialDetection = useCallback(async (payload: ARPayload) => {
    const confidence = payload.detectionMode === 'surface' ? 0.92 : 0.86
    triggerDetection(payload.modelIndex, confidence)
    return {
      started: true,
      anchorHint: payload.anchorHint,
      steps: payload.lessonSteps,
    }
  }, [triggerDetection])

  const startLessonAR = useCallback(async (payload: ARPayload) => {
    await activateCamera()
    return startSpatialDetection(payload)
  }, [activateCamera, startSpatialDetection])

  return {
    activateCamera,
    getCameraStream,
    stopCamera,
    startSpatialDetection,
    startLessonAR,
  }
}

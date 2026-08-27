import { useEffect, useRef } from 'react'
import { getMindTargetPath } from '../../lib/markerUtils'

interface ARCameraViewProps {
  markerImage: string
  glbPath: string
  title: string
  description: string
  onExit: () => void
  onMarkerFound?: () => void
}

/**
 * AR Camera View — renders an iframe running MindAR (image tracking) +
 * A-Frame. Communicates with the iframe via postMessage for marker
 * detection events. MindAR replaced AR.js here: AR.js's NFT tracker was
 * wired up but never actually functional (it expected compiled .fset/
 * .fset3/.iset descriptor sets that were never generated for these
 * markers), and MindAR is more actively maintained.
 */
export function ARCameraView({
  markerImage,
  glbPath,
  title,
  description,
  onExit,
  onMarkerFound,
}: ARCameraViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own iframe
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }

      if (event.data?.type === 'ar-exit') {
        onExit()
      } else if (event.data?.type === 'ar-marker-found') {
        onMarkerFound?.()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onExit, onMarkerFound])

  const mindTargetUrl = getMindTargetPath(markerImage)

  const arViewerUrl = `/ar-viewer.html?${new URLSearchParams({
    mind: mindTargetUrl,
    glb: glbPath,
    title,
    desc: description,
  }).toString()}`

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <iframe
        ref={iframeRef}
        src={arViewerUrl}
        allow="camera"
        className="w-full h-full border-0"
        title="AR Camera View"
      />
    </div>
  )
}

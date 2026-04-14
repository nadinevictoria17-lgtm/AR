import { useEffect, useRef } from 'react'

interface ARCameraViewProps {
  markerImage: string
  glbPath: string
  title: string
  description: string
  onExit: () => void
  onMarkerFound?: () => void
}

/**
 * AR Camera View Component
 * Renders an iframe containing the A-Frame AR.js viewer
 * Communicates with the iframe via postMessage for marker detection events
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
    // Listen for messages from the AR viewer iframe
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

  // Build the AR viewer URL with query parameters
  // Use markerImage as NFT (Natural Feature Tracking) marker
  const arViewerUrl = `/ar-viewer.html?${new URLSearchParams({
    nft: markerImage,
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

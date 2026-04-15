import { useEffect, useState } from 'react'
export function useDeferredLoading(isLoading: boolean, delayMs = 250): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      // Don't hide skeleton immediately if it never showed - wait for deferred timeout
      if (hasShown) {
        setShowSkeleton(false)
        setHasShown(false)
      }
      return
    }

    const timer = setTimeout(() => {
      setShowSkeleton(true)
      setHasShown(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [isLoading, hasShown])

  return showSkeleton
}

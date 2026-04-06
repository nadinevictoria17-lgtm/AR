import { useEffect, useState } from 'react'
export function useDeferredLoading(isLoading: boolean, delayMs = 250): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false)
      return
    }

    const timer = setTimeout(() => setShowSkeleton(true), delayMs)
    return () => clearTimeout(timer)
  }, [isLoading, delayMs])

  return showSkeleton
}

/**
 * Animates a numeric stat counting up to its real value on mount/update.
 * A genuine, still-restrained "meaningful moment" for an Operate-mode
 * dashboard — real data, a satisfying reveal, no manufactured whimsy.
 * Accepts an optional suffix (e.g. "%") rendered outside the animated number.
 */
import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

export function CountUp({ value, suffix = '', duration = 0.8 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, duration])

  return <>{display}{suffix}</>
}

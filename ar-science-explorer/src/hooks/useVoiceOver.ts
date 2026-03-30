import { useEffect, useState } from 'react'

interface UseVoiceOverArgs {
  lines: string[]
  language: 'en' | 'Filipino'
}

export function useVoiceOver({ lines, language }: UseVoiceOverArgs) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    setSupported(isSupported)
  }, [])

  useEffect(() => {
    setCurrentIndex(0)
    if (supported) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [language, supported])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakFromIndex = (startIdx: number) => {
    if (!supported) return
    const synth = window.speechSynthesis
    synth.cancel()

    const queue = lines.slice(startIdx)
    if (queue.length === 0) return
    setIsPlaying(true)
    let relative = 0

    const speakNext = () => {
      const text = queue[relative]
      if (!text) {
        setIsPlaying(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'en' ? 'en-US' : 'fil-PH'
      utterance.rate = 0.95
      utterance.pitch = 1

      utterance.onstart = () => {
        setCurrentIndex(startIdx + relative)
        setIsPlaying(true)
      }

      utterance.onend = () => {
        relative += 1
        if (relative < queue.length) speakNext()
        else setIsPlaying(false)
      }

      utterance.onerror = () => setIsPlaying(false)
      synth.speak(utterance)
    }

    speakNext()
  }

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  return {
    currentIndex,
    isPlaying,
    supported,
    playAll: () => speakFromIndex(0),
    replay: () => speakFromIndex(currentIndex),
    stop,
    reset: () => {
      stop()
      setCurrentIndex(0)
    },
  }
}

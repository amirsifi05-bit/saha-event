'use client'

import { useEffect, useRef, useState } from 'react'

export function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startTime = useRef<number | null>(null)
  const startValue = useRef(0)

  useEffect(() => {
    startValue.current = 0
    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startValue.current + (value - startValue.current) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{display.toLocaleString('en-DZ')}</span>
}

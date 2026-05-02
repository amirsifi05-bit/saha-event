'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Something went wrong</h2>
      <p className="text-[#6B7280] text-sm mb-6 max-w-sm">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-[#1A1A2E] text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-[#2D2D4E] transition"
      >
        Try again
      </button>
    </div>
  )
}

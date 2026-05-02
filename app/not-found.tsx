import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-6">
        <SearchX size={36} className="text-[#9CA3AF]" />
      </div>
      <h1 className="text-6xl font-bold text-[#1A1A2E] mb-2">404</h1>
      <h2 className="text-xl font-semibold text-[#374151] mb-3">Page not found</h2>
      <p className="text-[#6B7280] text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-[#1A1A2E] text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-[#2D2D4E] transition"
        >
          <Home size={16} /> Go home
        </Link>
        <Link
          href="/halls"
          className="border border-[#E5E7EB] text-[#374151] rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-[#F7F8FA] transition"
        >
          Browse halls
        </Link>
      </div>
    </div>
  )
}

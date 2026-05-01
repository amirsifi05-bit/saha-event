import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-[#9CA3AF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-[#E8B86D]" />
              <span className="text-white text-[20px] font-bold lowercase tracking-tight">
                saha·event
              </span>
            </div>
            <p className="text-sm mt-3 max-w-[200px]">
              Algeria&apos;s trusted platform for booking event halls
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/halls" className="hover:text-white transition-colors">
                  Find halls
                </Link>
              </li>
              <li>
                <Link href="/halls" className="hover:text-white transition-colors">
                  Browse by wilaya
                </Link>
              </li>
              <li>
                <Link href="/halls?sort=rating" className="hover:text-white transition-colors">
                  Top-rated venues
                </Link>
              </li>
              <li>
                <Link href="/halls" className="hover:text-white transition-colors">
                  New listings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-white transition-colors">
                  List your hall
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Cookie policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2D3748] pt-6 mt-12">
          <p className="text-sm text-center text-[#6B7280]">
            © 2026 Saha-Event. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


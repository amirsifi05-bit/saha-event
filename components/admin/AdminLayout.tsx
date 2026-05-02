'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'

export default function AdminLayout({
  userId: _userId,
  fullName,
  avatarUrl,
  children,
}: {
  userId: string
  fullName: string
  avatarUrl: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/signin?redirect=/admin/dashboard')
        return
      }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (cancelled) return
      if (profile?.role !== 'admin') {
        router.replace('/client/dashboard')
        return
      }
      setVerified(true)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/halls', label: 'Halls', icon: Building2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/reservations', label: 'Reservations', icon: CalendarDays },
  ]

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] text-sm text-[#6B7280]">
        Verifying access…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <aside className="w-[240px] flex-shrink-0 hidden lg:flex flex-col fixed top-16 bottom-0 left-0 bg-white border-r border-[#E5E7EB] overflow-y-auto pt-6 px-4 pb-6 z-30">
        <div className="flex flex-col items-start">
          {avatarUrl ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image src={avatarUrl} alt={fullName} fill sizes="48px" className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white font-bold text-lg flex items-center justify-center">
              {getInitials(fullName)}
            </div>
          )}
          <div className="font-semibold text-sm text-[#1A1A2E] mt-3 line-clamp-1 w-full">{fullName}</div>
          <span className="mt-1 inline-flex items-center rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#991B1B]">
            Administrator
          </span>
        </div>

        <div className="border-t border-[#E5E7EB] my-4" />

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active =
              link.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard'
                : pathname === link.href || pathname.startsWith(`${link.href}/`)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  active ? 'text-[#1A1A2E] font-semibold' : 'text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#1A1A2E]'
                )}
              >
                {active ? (
                  <motion.div
                    layoutId="admin-sidebar-indicator"
                    className="absolute inset-0 bg-[#F0F0F6] rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                ) : null}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon size={20} />
                  <span>{link.label}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-2 text-sm text-red-500 hover:text-red-700 px-3 py-2"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </aside>

      <main className="flex-1 lg:ml-[240px] min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] flex justify-around py-2">
        {[
          { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
          { href: '/admin/halls', label: 'Halls', icon: Building2 },
          { href: '/admin/users', label: 'Users', icon: Users },
          { href: '/admin/reservations', label: 'Bookings', icon: CalendarDays },
        ].map((item) => {
          const active =
            item.href === '/admin/dashboard'
              ? pathname === '/admin/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-2',
                active ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]'
              )}
            >
              <Icon size={22} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

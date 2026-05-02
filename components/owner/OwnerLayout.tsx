'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Shield,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'

export default function OwnerLayout({
  userId: _userId,
  fullName,
  avatarUrl,
  unreadCount,
  children,
}: {
  userId: string
  fullName: string
  avatarUrl: string | null
  unreadCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/owner/halls', label: 'My Halls', icon: Building2 },
    { href: '/owner/halls/new', label: 'Add New Hall', icon: PlusCircle, gold: true },
    { href: '/owner/reservations', label: 'Reservations', icon: CalendarDays },
    { href: '/owner/revenue', label: 'Revenue', icon: BarChart3 },
    { href: '/owner/notifications', label: 'Notifications', icon: Bell, unread: unreadCount },
    { href: '/owner/profile', label: 'Profile', icon: User },
    { href: '/owner/profile/security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <aside className="w-[240px] flex-shrink-0 hidden lg:flex flex-col fixed top-16 bottom-0 left-0 bg-white border-r border-[#E5E7EB] overflow-y-auto pt-6 px-4 pb-6 z-30">
        <div className="flex flex-col items-start">
          {avatarUrl ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={avatarUrl}
                alt={fullName}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white font-bold text-lg flex items-center justify-center">
              {getInitials(fullName)}
            </div>
          )}
          <div className="font-semibold text-sm text-[#1A1A2E] mt-3 line-clamp-1 w-full">{fullName}</div>
          <div className="text-xs text-[#9CA3AF]">Hall Owner</div>
        </div>

        <div className="border-t border-[#E5E7EB] my-4" />

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            let active = false
            if (link.href === '/owner/dashboard') active = pathname === '/owner/dashboard'
            else if (link.href === '/owner/halls')
              active =
                pathname === '/owner/halls' ||
                (pathname.startsWith('/owner/halls/') && !pathname.startsWith('/owner/halls/new'))
            else if (link.href === '/owner/halls/new') active = pathname.startsWith('/owner/halls/new')
            else if (link.href === '/owner/reservations')
              active = pathname === '/owner/reservations' || pathname.startsWith('/owner/reservations/')
            else if (link.href === '/owner/revenue') active = pathname === '/owner/revenue'
            else if (link.href === '/owner/notifications') active = pathname.startsWith('/owner/notifications')
            else if (link.href === '/owner/profile') active = pathname === '/owner/profile' && !pathname.startsWith('/owner/profile/security')
            else if (link.href === '/owner/profile/security') active = pathname.startsWith('/owner/profile/security')
            else active = false
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  link.gold && 'text-[#E8B86D] hover:text-[#D4A558] font-medium',
                  !link.gold &&
                    (active
                      ? 'text-[#1A1A2E] font-semibold'
                      : 'text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#1A1A2E]')
                )}
              >
                {active && !link.gold ? (
                  <motion.div
                    layoutId="owner-sidebar-indicator"
                    className="absolute inset-0 bg-[#F0F0F6] rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                ) : null}
                <span className="relative z-10 flex items-center gap-3">
                  <span className="relative">
                    <Icon size={20} />
                    {link.unread && link.unread > 0 ? (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    ) : null}
                  </span>
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
          { href: '/owner/dashboard', label: 'Home', icon: LayoutDashboard },
          { href: '/owner/halls', label: 'Halls', icon: Building2 },
          { href: '/owner/reservations', label: 'Bookings', icon: CalendarDays },
          { href: '/owner/notifications', label: 'Alerts', icon: Bell, unread: unreadCount > 0 },
          { href: '/owner/profile', label: 'Profile', icon: User },
        ].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
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
              <span className="relative">
                <Icon size={22} />
                {item.unread ? <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" /> : null}
              </span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

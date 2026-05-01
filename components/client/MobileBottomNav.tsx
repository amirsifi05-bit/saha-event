'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CalendarDays, Heart, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MobileBottomNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname()
  const items = [
    { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/reservations', label: 'Reservations', icon: CalendarDays },
    { href: '/client/favorites', label: 'Favorites', icon: Heart },
    { href: '/client/notifications', label: 'Notifications', icon: Bell, unread: unreadCount > 0 },
    { href: '/client/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] flex justify-around py-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3',
              active ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]'
            )}
          >
            <span className="relative">
              <Icon size={22} />
              {item.unread ? (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
              ) : null}
            </span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}


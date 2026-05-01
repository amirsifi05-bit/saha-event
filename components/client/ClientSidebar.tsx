'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'

export default function ClientSidebar({
  userId: _userId,
  fullName,
  avatarUrl,
  unreadCount,
}: {
  userId: string
  fullName: string
  avatarUrl: string | null
  unreadCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/reservations', label: 'My Reservations', icon: CalendarDays },
    { href: '/client/favorites', label: 'Favorites', icon: Heart },
    { href: '/client/notifications', label: 'Notifications', icon: Bell, unread: unreadCount },
    { href: '/client/profile', label: 'Profile', icon: User },
  ]

  return (
    <aside className="w-[240px] flex-shrink-0 hidden lg:flex flex-col fixed top-16 bottom-0 left-0 bg-white border-r border-[#E5E7EB] overflow-y-auto pt-6 px-4 pb-6">
      <div className="flex flex-col items-start">
        {avatarUrl ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white font-bold text-lg flex items-center justify-center">
            {getInitials(fullName)}
          </div>
        )}
        <div className="font-semibold text-sm text-[#1A1A2E] mt-3 line-clamp-1 w-full">{fullName}</div>
        <div className="text-xs text-[#9CA3AF]">Client account</div>
      </div>

      <div className="border-t border-[#E5E7EB] my-4" />

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition',
                active
                  ? 'bg-[#F0F0F6] text-[#1A1A2E] font-semibold'
                  : 'text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#1A1A2E]'
              )}
            >
              <span className="relative">
                <Icon size={20} />
                {link.unread && link.unread > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-4 px-1 text-center">
                    {link.unread > 9 ? '9+' : link.unread}
                  </span>
                ) : null}
              </span>
              <span>{link.label}</span>
            </Link>
          )
        })}

        <div className="border-t border-[#E5E7EB] my-3" />

        <Link
          href="/halls"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#E8B86D] hover:text-[#D4A558] transition"
        >
          <Search size={20} />
          <span>Find a Hall</span>
        </Link>
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
  )
}


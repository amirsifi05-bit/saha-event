'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CalendarX, CheckCircle2, Star, XCircle } from 'lucide-react'
import { formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  related_reservation_id: string | null
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications((data ?? []) as Notification[])
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)
    }
    void load()
  }, [])

  const grouped = useMemo(() => {
    return {
      Today: notifications.filter((n) => isToday(parseISO(n.created_at))),
      Yesterday: notifications.filter((n) => isYesterday(parseISO(n.created_at))),
      Earlier: notifications.filter((n) => !isToday(parseISO(n.created_at)) && !isYesterday(parseISO(n.created_at))),
    }
  }, [notifications])

  return (
    <div>
      <h1 className="font-bold text-2xl">Notifications</h1>
      <p className="text-sm text-[#9CA3AF] mt-1">Mark all as read</p>

      {notifications.length === 0 ? (
        <div className="text-center mt-16">
          <Bell size={48} className="text-[#D1D5DB] mx-auto" />
          <p className="font-semibold mt-3">You&apos;re all caught up!</p>
          <p className="text-[#6B7280] text-sm">Notifications about your bookings will appear here.</p>
        </div>
      ) : (
        (Object.keys(grouped) as Array<keyof typeof grouped>).map((section) => (
          grouped[section].length > 0 ? (
            <div key={section}>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2 mt-6">{section}</p>
              {grouped[section].map((n) => {
                const Icon = n.type === 'reservation_confirmed' ? CheckCircle2 : n.type === 'reservation_rejected' ? XCircle : n.type === 'reservation_cancelled' ? CalendarX : n.type === 'review_received' ? Star : Bell
                return (
                  <button
                    key={n.id}
                    onClick={() => n.related_reservation_id && router.push(`/client/reservations/${n.related_reservation_id}`)}
                    className={`w-full text-left bg-white border border-[#E5E7EB] rounded-xl p-4 mb-2 flex items-start gap-4 hover:bg-[#F7F8FA] ${!n.is_read ? 'border-l-4 border-l-[#E8B86D] bg-[#FFFBEB]' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                      <Icon size={16} className="text-[#6B7280]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#1A1A2E]">{n.title}</p>
                      <p className="text-sm text-[#4B5563] mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">{formatDistanceToNow(parseISO(n.created_at))} ago</p>
                    </div>
                    {!n.is_read ? <span className="w-2 h-2 rounded-full bg-[#1A1A2E]" /> : null}
                  </button>
                )
              })}
            </div>
          ) : null
        ))
      )}
    </div>
  )
}


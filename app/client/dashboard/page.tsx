import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, CalendarX, CheckCircle2, Clock, Wallet } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { createClient } from '@/lib/supabase/server'
import FadeUp from '@/components/FadeUp'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatPrice, getInitials } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

type HallInfo = {
  name: string
  slug: string
  wilaya: string
  hall_photos: { url: string; is_cover: boolean }[]
}
type ReservationRow = {
  id: string
  status: ReservationStatus
  check_in: string
  check_out: string
  total_price: number
  guest_count: number
  created_at: string
  event_halls: HallInfo | HallInfo[] | null
}

function normalizeHall(eventHalls: HallInfo | HallInfo[] | null): HallInfo | null {
  if (!eventHalls) return null
  return Array.isArray(eventHalls) ? (eventHalls[0] ?? null) : eventHalls
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, wilaya, created_at')
    .eq('id', user!.id)
    .single()

  const { data: reservationsRaw } = await supabase
    .from('reservations')
    .select(
      `
      id, status, check_in, check_out, total_price, guest_count, created_at,
      event_halls(name, slug, wilaya, hall_photos(url, is_cover))
    `
    )
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0] ?? ''
  const all = (reservationsRaw ?? []) as ReservationRow[]

  const stats = {
    total: all.length,
    upcoming: all.filter((r) => r.check_in >= today && !['cancelled', 'rejected'].includes(r.status)).length,
    confirmed: all.filter((r) => r.status === 'confirmed').length,
    totalSpent: all.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + r.total_price, 0),
  }

  const upcoming = all
    .filter((r) => r.check_in >= today && !['cancelled', 'rejected'].includes(r.status))
    .slice(0, 4)
  const recent = all.slice(0, 8)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (profile?.full_name ?? 'there').split(' ')[0]

  return (
    <FadeUp>
      <div>
        <h1 className="text-[28px] font-bold text-[#1A1A2E]">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Here&apos;s what&apos;s happening with your bookings.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatCard icon={<CalendarDays size={20} className="text-[#4338CA]" />} iconBg="bg-[#EEF2FF]" value={String(stats.total)} label="Total bookings" />
          <StatCard icon={<Clock size={20} className="text-[#D97706]" />} iconBg="bg-[#FEF3C7]" value={String(stats.upcoming)} label="Upcoming events" />
          <StatCard icon={<CheckCircle2 size={20} className="text-[#059669]" />} iconBg="bg-[#D1FAE5]" value={String(stats.confirmed)} label="Confirmed" />
          <StatCard icon={<Wallet size={20} className="text-[#7C3AED]" />} iconBg="bg-[#EDE9FE]" value={formatPrice(stats.totalSpent)} label="Total spent" />
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Upcoming events</h2>
            <Link href="/client/reservations" className="text-sm text-[#E8B86D] hover:underline">
              View all →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-10 text-center mt-4">
              <CalendarX size={40} className="text-[#D1D5DB] mx-auto" />
              <p className="font-semibold text-[#1A1A2E] mt-3">No upcoming events</p>
              <p className="text-[#6B7280] text-sm mt-1">Start browsing halls to make your first reservation.</p>
              <Link href="/halls">
                <Button className="mt-4 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl">
                  Find a Hall
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 mt-4">
              {upcoming.map((r) => {
                const hall = normalizeHall(r.event_halls)
                if (!hall) return null
                const cover = hall.hall_photos?.find((p) => p.is_cover)?.url ?? hall.hall_photos?.[0]?.url ?? null
                return (
                  <Link
                    href={`/client/reservations/${r.id}`}
                    key={r.id}
                    className="w-[260px] flex-shrink-0 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative h-32">
                      {cover ? (
                        <Image src={cover} alt={hall.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] text-white/30 text-2xl font-bold flex items-center justify-center">
                          {getInitials(hall.name)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-sm text-[#1A1A2E] line-clamp-1">{hall.name}</div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        {format(parseISO(r.check_in), 'd MMM')} - {format(parseISO(r.check_out), 'd MMM')}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <StatusBadge status={r.status} />
                        <span className="font-bold text-sm text-[#1A1A2E]">{formatPrice(r.total_price)}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Recent bookings</h2>
            <Link href="/client/reservations" className="text-sm text-[#E8B86D] hover:underline">
              See all →
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mt-4">
            {recent.length === 0 ? (
              <div className="py-12 text-center text-[#9CA3AF] text-sm">No bookings yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3">Hall</th>
                    <th className="text-left px-5 py-3">Check-in</th>
                    <th className="text-left px-5 py-3">Check-out</th>
                    <th className="text-left px-5 py-3">Guests</th>
                    <th className="text-left px-5 py-3">Total</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => {
                    const hall = normalizeHall(r.event_halls)
                    if (!hall) return null
                    return (
                      <tr key={r.id} className="border-b border-[#F3F4F6] last:border-none">
                        <td className="px-5 py-4 text-sm font-medium text-[#1A1A2E]">{hall.name}</td>
                        <td className="px-5 py-4 text-sm text-[#6B7280]">{format(parseISO(r.check_in), 'd MMM yyyy')}</td>
                        <td className="px-5 py-4 text-sm text-[#6B7280]">{format(parseISO(r.check_out), 'd MMM yyyy')}</td>
                        <td className="px-5 py-4 text-sm text-[#6B7280]">{r.guest_count}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#1A1A2E]">{formatPrice(r.total_price)}</td>
                        <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-4 text-xs">
                          <Link href={`/client/reservations/${r.id}`} className="text-[#1A1A2E] underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10 bg-[#1A1A2E] rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-xl">Looking for your next event hall?</h3>
          <p className="text-white/60 text-sm mt-2">Browse our catalog and find the perfect venue.</p>
          <Link href="/halls">
            <Button className="mt-5 px-8 py-2.5 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl">
              Search halls
            </Button>
          </Link>
        </section>
      </div>
    </FadeUp>
  )
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-[#1A1A2E] mt-3">{value}</div>
      <div className="text-sm text-[#6B7280] mt-1">{label}</div>
    </div>
  )
}

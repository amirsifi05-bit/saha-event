import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getLast6MonthsRevenue } from '@/lib/owner/revenue'
import { formatDate, formatPrice } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

function fmt(n: number) {
  return new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(n)
}

export default async function HallAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: hall } = await supabase.from('event_halls').select('*').eq('id', id).eq('owner_id', user.id).single()
  if (!hall) notFound()

  const { data: reservationsRaw } = await supabase
    .from('reservations')
    .select('status, total_price, created_at, check_in, guest_count')
    .eq('hall_id', id)

  const reservations = (reservationsRaw ?? []) as Array<{
    status: ReservationStatus
    total_price: number
    created_at: string
    check_in: string
    guest_count: number
  }>

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('rating, comment, created_at')
    .eq('hall_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const reviews = (reviewsRaw ?? []) as Array<{ rating: number; comment: string | null; created_at: string }>

  const totalBookings = reservations.length
  const confirmedRev = reservations
    .filter((r) => ['confirmed', 'completed'].includes(r.status))
    .reduce((s, r) => s + r.total_price, 0)

  const statusCounts = {
    confirmed: reservations.filter((r) => r.status === 'confirmed' || r.status === 'completed').length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
  }
  const breakdownTotal =
    statusCounts.confirmed + statusCounts.pending + statusCounts.rejected + statusCounts.cancelled || 1

  const monthly = getLast6MonthsRevenue(reservations)
  const maxRev = Math.max(...monthly.map((m) => m.revenue), 1)
  const totalViews = (hall.review_count as number) * 12

  return (
    <div>
      <Link href={`/owner/halls/${id}`} className="text-sm text-[#6B7280]">
        ← Hall Overview
      </Link>
      <h1 className="font-bold text-2xl mt-4">
        {hall.name} — Analytics
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-xs text-[#6B7280]">Total views</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalViews)}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-xs text-[#6B7280]">Total bookings</p>
          <p className="text-2xl font-bold mt-1">{totalBookings}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-xs text-[#6B7280]">Confirmed revenue</p>
          <p className="text-2xl font-bold mt-1">{formatPrice(confirmedRev)}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-xs text-[#6B7280]">Average rating</p>
          <p className="text-2xl font-bold mt-1 inline-flex items-center gap-1">
            {(hall.rating as number).toFixed(1)} <Star size={18} className="text-[#E8B86D]" fill="#E8B86D" />
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-8">
        <h2 className="font-bold text-lg">Revenue (last 6 months)</h2>
        <div className="flex items-end gap-3 h-48 mt-6">
          {monthly.map((m) => {
            const hPct = (m.revenue / maxRev) * 100
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                {m.revenue > 0 ? <span className="text-xs font-medium">{fmt(m.revenue)}</span> : <span className="text-xs opacity-0">0</span>}
                <div className="w-full bg-[#E8B86D] rounded-t-lg min-h-[4px]" style={{ height: `${Math.max(hPct, 4)}%` }} />
                <span className="text-xs text-[#9CA3AF]">{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-8">
        <h2 className="font-bold text-lg mb-4">Booking status</h2>
        <div className="space-y-2">
          {[
            { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed, color: 'bg-[#D1FAE5]' },
            { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'bg-[#FEF3C7]' },
            { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'bg-[#FEE2E2]' },
            { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, color: 'bg-[#F3F4F6]' },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <div
                className={`h-3 rounded-full ${row.color}`}
                style={{ width: `${(row.count / breakdownTotal) * 100}%`, minWidth: row.count > 0 ? 8 : 0 }}
              />
              <span className="text-xs text-[#6B7280] whitespace-nowrap">
                {row.label}: {row.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-4">Recent reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev, i) => (
              <div key={`${rev.created_at}-${i}`} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < rev.rating ? 'text-[#E8B86D] fill-[#E8B86D]' : 'text-[#D1D5DB]'} />
                  ))}
                  <span className="text-xs text-[#9CA3AF] ml-2">{formatDate(rev.created_at)}</span>
                </div>
                {rev.comment ? <p className="text-sm text-[#4B5563] mt-2">{rev.comment}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

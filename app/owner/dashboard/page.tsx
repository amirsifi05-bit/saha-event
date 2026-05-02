import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Star,
} from 'lucide-react'

import HallStatusBadge from '@/components/owner/HallStatusBadge'
import { OwnerDashboardStats } from '@/components/owner/OwnerDashboardStats'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, getInitials } from '@/lib/utils'
import type { HallStatus, ReservationStatus } from '@/types/database'

function fmt(n: number) {
  return new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(n)
}

// ── Revenue helper (no external lib dependency) ────────────────
function getLast6MonthsRevenue(reservations: ResRow[]) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleString('en', { month: 'short' })
    const revenue = reservations
      .filter((r) => {
        const rd = new Date(r.created_at)
        return (
          (r.status === 'confirmed' || r.status === 'completed') &&
          rd.getMonth() === d.getMonth() &&
          rd.getFullYear() === d.getFullYear()
        )
      })
      .reduce((s, r) => s + r.total_price, 0)
    months.push({ month: label, revenue })
  }
  return months
}

type HallRow = {
  id: string
  name: string
  slug: string
  status: HallStatus
  rating: number
  review_count: number
  price_per_day: number
  capacity: number
  hall_photos: { url: string; is_cover: boolean }[] | null
}

type ResRow = {
  id: string
  hall_id: string
  status: ReservationStatus
  total_price: number
  check_in: string
  check_out: string
  guest_count: number
  created_at: string
  client_id: string
}

export default async function OwnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: hallsRaw } = await supabase
    .from('event_halls')
    .select('id, name, slug, status, rating, review_count, price_per_day, capacity, hall_photos(url, is_cover)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const halls = (hallsRaw ?? []) as HallRow[]
  const hallIds = halls.map((h) => h.id)

  const reservations: ResRow[] =
    hallIds.length === 0
      ? []
      : ((
          (
            await supabase
              .from('reservations')
              .select('id, hall_id, status, total_price, check_in, check_out, guest_count, created_at, client_id')
              .in('hall_id', hallIds)
              .order('created_at', { ascending: false })
          ).data ?? []
        ) as ResRow[])

  const today = new Date().toISOString().split('T')[0] ?? ''

  const stats = {
    totalHalls: halls.length,
    activeHalls: halls.filter((h) => h.status === 'active').length,
    pendingApproval: reservations.filter((r) => r.status === 'pending').length,
    totalRevenue: reservations
      .filter((r) => r.status === 'confirmed' || r.status === 'completed')
      .reduce((sum, r) => sum + r.total_price, 0),
    thisMonthRevenue: reservations
      .filter((r) => {
        const d = new Date(r.created_at)
        const now = new Date()
        return (
          (r.status === 'confirmed' || r.status === 'completed') &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
      })
      .reduce((sum, r) => sum + r.total_price, 0),
    upcomingEvents: reservations.filter(
      (r) => r.check_in >= today && r.status === 'confirmed'
    ).length,
  }

  const monthlyRevenue = getLast6MonthsRevenue(reservations)
  const maxRev = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)
  const pendingList = reservations.filter((r) => r.status === 'pending').slice(0, 3)
  const hallById = Object.fromEntries(halls.map((h) => [h.id, h]))
  const firstName = (profile?.full_name ?? 'there').split(' ')[0]

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-[#1A1A2E]">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Here&apos;s how your halls are performing.
          </p>
        </div>
        <Link href="/owner/halls/new">
          <Button className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl font-semibold shrink-0">
            <Plus size={18} className="mr-2" />
            Add New Hall
          </Button>
        </Link>
      </div>

      {/* ── Stats row ── */}
      <OwnerDashboardStats
        totalHalls={stats.totalHalls}
        activeHalls={stats.activeHalls}
        pendingApproval={stats.pendingApproval}
        thisMonthRevenue={stats.thisMonthRevenue}
        totalRevenue={stats.totalRevenue}
      />

      {/* ── Revenue chart ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-[#1A1A2E]">Revenue overview</h2>
            <p className="text-sm text-[#9CA3AF]">Last 6 months</p>
          </div>
          <Link href="/owner/revenue" className="text-sm text-[#E8B86D] hover:underline">
            Full report →
          </Link>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          {monthlyRevenue.every((m) => m.revenue === 0) ? (
            <div className="text-center py-12">
              <BarChart3 size={40} className="mx-auto text-[#D1D5DB]" />
              <p className="mt-3 text-sm text-[#9CA3AF]">No revenue data yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48 mt-2">
              {monthlyRevenue.map((m) => {
                const hPct = (m.revenue / maxRev) * 100
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                    {m.revenue > 0 ? (
                      <span className="text-[10px] font-medium text-[#374151] text-center leading-tight">
                        {fmt(m.revenue)}
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-0">0</span>
                    )}
                    <div
                      title={`${m.month}: ${fmt(m.revenue)} DA`}
                      className="w-full bg-[#E8B86D] rounded-t-lg group-hover:bg-[#D4A558] transition-colors min-h-[4px]"
                      style={{ height: `${Math.max(hPct, 4)}%` }}
                    />
                    <span className="text-xs text-[#9CA3AF]">{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Pending bookings ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-[#1A1A2E]">Pending approval</h2>
          {stats.pendingApproval > 0 && (
            <Link href="/owner/reservations?status=pending" className="text-sm text-[#E8B86D] hover:underline">
              View all →
            </Link>
          )}
        </div>

        {stats.pendingApproval === 0 ? (
          <div className="bg-[#ECFDF5] border border-[#BBF7D0] rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 className="text-[#059669] flex-shrink-0" size={22} />
            <p className="text-sm text-[#065F46] font-medium">
              No pending bookings. You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((r) => {
              const hall = hallById[r.hall_id]
              return (
                <div
                  key={r.id}
                  className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex flex-wrap items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A2E]">
                    <Calendar size={15} className="text-[#D97706] flex-shrink-0" />
                    {r.check_in} → {r.check_out}
                  </div>
                  <span className="text-sm text-[#4B5563]">{r.guest_count} guests</span>
                  <span className="text-xs text-[#6B7280] flex-1 min-w-[100px] truncate">
                    {hall?.name ?? 'Hall'}
                  </span>
                  <Link href={`/owner/reservations/${r.id}`}>
                    <Button
                      size="sm"
                      className="bg-[#1A1A2E] text-white hover:bg-[#2D2D4E] rounded-lg text-xs"
                    >
                      Review →
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── My halls horizontal scroll ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-[#1A1A2E]">My halls</h2>
          <Link href="/owner/halls" className="text-sm text-[#E8B86D] hover:underline">
            Manage all →
          </Link>
        </div>

        {halls.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center">
            <Building2 size={48} className="text-[#D1D5DB] mx-auto" />
            <p className="font-semibold text-[#1A1A2E] mt-3">No halls yet</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Add your first hall to start receiving bookings
            </p>
            <Link href="/owner/halls/new">
              <Button className="mt-4 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl">
                Add a hall
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 -mb-3 snap-x snap-mandatory scrollbar-hide">
            {halls.map((hall) => {
              const cover =
                hall.hall_photos?.find((p) => p.is_cover)?.url ??
                hall.hall_photos?.[0]?.url ??
                null
              return (
                <div
                  key={hall.id}
                  className="w-60 flex-shrink-0 snap-start bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow"
                >
                  {/* Fixed height thumbnail — the critical fix */}
                  <div className="relative h-36 w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E]">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={hall.name}
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/30 text-2xl font-bold select-none">
                          {getInitials(hall.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-[#1A1A2E] line-clamp-1">
                        {hall.name}
                      </span>
                      <HallStatusBadge status={hall.status} />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1.5">
                      {hall.capacity} guests · {formatPrice(hall.price_per_day)} DA/day
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                      <Star size={11} className="text-[#E8B86D]" fill="#E8B86D" />
                      {Number(hall.rating).toFixed(1)}{' '}
                      <span className="text-[#9CA3AF]">({hall.review_count})</span>
                    </p>
                  </div>

                  <div className="border-t border-[#F3F4F6] px-4 py-3 flex justify-between text-xs font-medium">
                    <Link
                      href={`/owner/halls/${hall.id}/edit`}
                      className="text-[#1A1A2E] hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/owner/halls/${hall.id}`}
                      className="text-[#E8B86D] hover:underline"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

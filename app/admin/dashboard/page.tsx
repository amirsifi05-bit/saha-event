import { redirect } from 'next/navigation'
import { Building2, CalendarDays, ShieldAlert, TrendingUp, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import StatusBadge from '@/components/client/StatusBadge'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

function fmt(n: number) {
  return new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(n)
}

type RecentReservation = {
  id: string
  client_id: string
  status: ReservationStatus
  total_price: number
  check_in: string
  check_out: string
  guest_count: number
  created_at: string
  receipt_url: string | null
  event_halls: { name: string } | { name: string }[] | null
}

function hallName(eventHalls: RecentReservation['event_halls']): string {
  if (!eventHalls) return '—'
  const h = Array.isArray(eventHalls) ? eventHalls[0] : eventHalls
  return h?.name ?? '—'
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })

  const { count: totalClients } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  const { count: totalOwners } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'owner')

  const { count: totalHalls } = await supabase.from('event_halls').select('*', { count: 'exact', head: true })

  const { count: activeHalls } = await supabase
    .from('event_halls')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })

  const { count: pendingReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: revenueData } = await supabase
    .from('reservations')
    .select('total_price')
    .in('status', ['confirmed', 'completed'])

  const totalRevenue =
    revenueData?.reduce((s: number, r: { total_price: number }) => s + r.total_price, 0) ?? 0

  const { data: recentRaw } = await supabase
    .from('reservations')
    .select(
      `
      id, client_id, status, total_price, check_in, check_out, guest_count, created_at, receipt_url,
      event_halls(name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(10)

  const recentList = (recentRaw ?? []) as RecentReservation[]
  const clientIds = [...new Set(recentList.map((r) => r.client_id))]
  const { data: clientRows } =
    clientIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', clientIds)
      : { data: [] as { id: string; full_name: string }[] }

  const clientMap = Object.fromEntries((clientRows ?? []).map((c) => [c.id, c.full_name]))

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">Admin Dashboard</h1>
      <p className="text-sm text-[#6B7280] mt-1">Platform overview</p>

      <div className="flex gap-2 items-start bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 mb-6 text-sm text-[#92400E] mt-6">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden />
        <span>Admin access — changes affect all users and listings.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Users size={20} className="text-[#4338CA]" aria-hidden />
          </div>
          <div className="text-2xl font-bold text-[#1A1A2E] mt-3">{totalUsers ?? 0}</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">Total users</div>
          <div className="text-sm text-[#6B7280] mt-1">
            {totalClients ?? 0} clients · {totalOwners ?? 0} owners
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
            <Building2 size={20} className="text-[#059669]" aria-hidden />
          </div>
          <div className="text-2xl font-bold text-[#1A1A2E] mt-3">{totalHalls ?? 0}</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">Total halls</div>
          <div className="text-sm text-[#6B7280] mt-1">{activeHalls ?? 0} active</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
            <CalendarDays size={20} className="text-[#D97706]" aria-hidden />
          </div>
          <div className="text-2xl font-bold text-[#1A1A2E] mt-3">{totalReservations ?? 0}</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">Total reservations</div>
          <div className="text-sm text-[#6B7280] mt-1">{pendingReservations ?? 0} pending review</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
            <TrendingUp size={20} className="text-[#7C3AED]" aria-hidden />
          </div>
          <div className="text-xl font-bold text-[#1A1A2E] mt-3 leading-tight">{fmt(totalRevenue)} DA</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">Platform revenue</div>
          <div className="text-sm text-[#6B7280] mt-1">from confirmed bookings</div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-bold text-lg text-[#1A1A2E]">Recent reservations (all users)</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mt-4">
          {recentList.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#9CA3AF]">No reservations yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Hall</th>
                    <th className="text-left px-4 py-3">Dates</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {recentList.map((r) => (
                    <tr key={r.id} className="border-b border-[#F3F4F6] last:border-none">
                      <td className="px-4 py-3 font-medium text-[#1A1A2E]">
                        {clientMap[r.client_id] ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[#374151]">{hallName(r.event_halls)}</td>
                      <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                        {format(parseISO(r.check_in), 'd MMM yyyy')} → {format(parseISO(r.check_out), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1A1A2E]">{formatPrice(r.total_price)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.receipt_url ? (
                          <a
                            href={r.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#1A1A2E] underline text-xs font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

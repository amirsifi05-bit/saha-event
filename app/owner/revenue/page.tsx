import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getLast12MonthsRevenue } from '@/lib/owner/revenue'
import { createClient } from '@/lib/supabase/server'
import type { ReservationStatus } from '@/types/database'
import { formatDate, formatPrice } from '@/lib/utils'

function fmt(n: number) {
  return new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(n)
}

export default async function OwnerRevenuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: reservationsRaw } = await supabase
    .from('reservations')
    .select('id, hall_id, total_price, subtotal, service_fee, status, created_at, check_in')
    .eq('owner_id', user.id)
    .in('status', ['confirmed', 'completed'])
    .order('created_at', { ascending: false })

  const reservations = (reservationsRaw ?? []) as Array<{
    id: string
    hall_id: string
    total_price: number
    status: ReservationStatus
    created_at: string
  }>

  const { data: hallsRaw } = await supabase.from('event_halls').select('id, name').eq('owner_id', user.id)
  const halls = (hallsRaw ?? []) as Array<{ id: string; name: string }>
  const hallNames = Object.fromEntries(halls.map((h) => [h.id, h.name]))

  const now = new Date()
  const totalEarned = reservations.reduce((s, r) => s + r.total_price, 0)
  const thisMonth = reservations
    .filter((r) => {
      const d = new Date(r.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, r) => s + r.total_price, 0)
  const thisYear = reservations
    .filter((r) => new Date(r.created_at).getFullYear() === now.getFullYear())
    .reduce((s, r) => s + r.total_price, 0)

  const monthly = getLast12MonthsRevenue(reservations)
  const maxRev = Math.max(...monthly.map((m) => m.revenue), 1)

  const byHall: Record<string, { bookings: number; revenue: number }> = {}
  for (const r of reservations) {
    if (!byHall[r.hall_id]) byHall[r.hall_id] = { bookings: 0, revenue: 0 }
    byHall[r.hall_id].bookings += 1
    byHall[r.hall_id].revenue += r.total_price
  }

  const recent = reservations.slice(0, 20)

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">Revenue</h1>
      <p className="text-sm text-[#6B7280] mt-1">Track your earnings across all halls</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-sm text-[#6B7280]">Total earned</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalEarned)} DA</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-sm text-[#6B7280]">This month</p>
          <p className="text-2xl font-bold mt-1">{fmt(thisMonth)} DA</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <p className="text-sm text-[#6B7280]">This year</p>
          <p className="text-2xl font-bold mt-1">{fmt(thisYear)} DA</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-8">
        <h2 className="font-bold text-lg">Monthly revenue</h2>
        <div className="flex items-end gap-2 h-52 mt-6 overflow-x-auto pb-2">
          {monthly.map((m) => {
            const hPct = (m.revenue / maxRev) * 100
            return (
              <div key={`${m.year}-${m.month}`} className="flex flex-col items-center gap-2 min-w-[40px] flex-1">
                {m.revenue > 0 ? <span className="text-[10px] font-medium text-[#374151]">{fmt(m.revenue)}</span> : <span className="text-[10px] opacity-0">0</span>}
                <div className="w-full bg-[#E8B86D] rounded-t-lg min-h-[4px]" style={{ height: `${Math.max(hPct, 4)}%` }} />
                <span className="text-[10px] text-[#9CA3AF] text-center">{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-4">Revenue by hall</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F8FA] text-xs font-semibold text-[#6B7280] uppercase">
              <tr>
                <th className="text-left px-5 py-3">Hall</th>
                <th className="text-right px-5 py-3">Bookings</th>
                <th className="text-right px-5 py-3">Revenue</th>
                <th className="text-right px-5 py-3">Avg / booking</th>
              </tr>
            </thead>
            <tbody>
              {halls.map((h) => {
                const row = byHall[h.id] ?? { bookings: 0, revenue: 0 }
                const avg = row.bookings > 0 ? Math.round(row.revenue / row.bookings) : 0
                return (
                  <tr key={h.id} className="border-t border-[#F3F4F6]">
                    <td className="px-5 py-3 font-medium">{h.name}</td>
                    <td className="px-5 py-3 text-right">{row.bookings}</td>
                    <td className="px-5 py-3 text-right">{fmt(row.revenue)} DA</td>
                    <td className="px-5 py-3 text-right">{fmt(avg)} DA</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-[#E5E7EB] font-bold bg-[#F9FAFB]">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right">{reservations.length}</td>
                <td className="px-5 py-3 text-right">{fmt(totalEarned)} DA</td>
                <td className="px-5 py-3 text-right">
                  {reservations.length ? fmt(Math.round(totalEarned / reservations.length)) : 0} DA
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-4">Recent confirmed bookings</h2>
        <div className="space-y-2">
          {recent.map((r) => (
            <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-[#6B7280]">{formatDate(r.created_at)}</p>
                <p className="font-medium text-[#1A1A2E]">{hallNames[r.hall_id] ?? 'Hall'}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">{formatPrice(r.total_price)}</span>
                <Link href={`/owner/reservations/${r.id}`} className="text-sm text-[#1A1A2E] underline">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

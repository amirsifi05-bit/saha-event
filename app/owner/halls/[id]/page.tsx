import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BarChart3, CalendarDays, ExternalLink, Images, Pencil } from 'lucide-react'

import HallStatusBadge from '@/components/owner/HallStatusBadge'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

export default async function OwnerHallOverviewPage({
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

  const { data: hall } = await supabase
    .from('event_halls')
    .select('*, hall_photos(*)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!hall) notFound()

  const photos = (hall.hall_photos ?? []) as Array<{ url: string; is_cover: boolean; sort_order?: number }>
  const cover = photos.find((p) => p.is_cover)?.url ?? photos.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null

  const { data: reservationsRaw } = await supabase
    .from('reservations')
    .select('id, status, check_in, check_out, total_price, guest_count, created_at, client_id')
    .eq('hall_id', hall.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const reservations = (reservationsRaw ?? []) as Array<{
    id: string
    status: ReservationStatus
    check_in: string
    check_out: string
    total_price: number
    guest_count: number
    created_at: string
    client_id: string
  }>

  const hallStats = {
    totalBookings: reservations.length,
    revenue: reservations
      .filter((r) => ['confirmed', 'completed'].includes(r.status))
      .reduce((s, r) => s + r.total_price, 0),
    avgRating: hall.rating as number,
  }

  return (
    <div>
      <Link href="/owner/halls" className="text-sm text-[#6B7280] hover:text-[#1A1A2E]">
        ← My Halls
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-bold text-2xl text-[#1A1A2E]">{hall.name}</h1>
          <HallStatusBadge status={hall.status as string} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/halls/${hall.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl">
              <ExternalLink size={14} className="mr-2" />
              View public listing
            </Button>
          </Link>
          <Link href={`/owner/halls/${id}/edit`}>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Pencil size={14} className="mr-2" />
              Edit hall
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative h-64 rounded-2xl overflow-hidden mt-4">
        {cover ? (
          <Image
          src={cover}
          alt={hall.name}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center text-white/40 text-4xl font-bold">
            {getInitials(hall.name)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-[#6B7280]">Total bookings</p>
          <p className="text-2xl font-bold text-[#1A1A2E] mt-1">{hallStats.totalBookings}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-[#6B7280]">Revenue earned</p>
          <p className="text-2xl font-bold text-[#1A1A2E] mt-1">{formatPrice(hallStats.revenue)}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-[#6B7280]">Average rating</p>
          <p className="text-2xl font-bold text-[#1A1A2E] mt-1">{hallStats.avgRating.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {[
          { href: `/owner/halls/${id}/edit`, label: 'Edit Info', Icon: Pencil },
          { href: `/owner/halls/${id}/photos`, label: 'Manage Photos', Icon: Images },
          { href: `/owner/halls/${id}/availability`, label: 'Availability', Icon: CalendarDays },
          { href: `/owner/halls/${id}/analytics`, label: 'Analytics', Icon: BarChart3 },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center hover:shadow-md transition cursor-pointer">
            <Icon className="mx-auto text-[#1A1A2E]" size={22} />
            <p className="text-sm font-medium mt-2 text-[#1A1A2E]">{label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-4">Recent reservations</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          {reservations.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#9CA3AF]">No reservations yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F7F8FA] border-b text-xs font-semibold text-[#6B7280] uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Dates</th>
                  <th className="text-left px-5 py-3">Guests</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="px-5 py-4 font-medium text-[#1A1A2E]">{r.client_id.slice(0, 8)}</td>
                    <td className="px-5 py-4 text-[#6B7280]">
                      {formatDate(r.check_in)} – {formatDate(r.check_out)}
                    </td>
                    <td className="px-5 py-4 text-[#6B7280]">{r.guest_count}</td>
                    <td className="px-5 py-4 font-semibold">{formatPrice(r.total_price)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/owner/reservations/${r.id}`} className="text-xs text-[#1A1A2E] underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

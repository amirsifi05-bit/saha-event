import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck2, CheckCircle2, ExternalLink, FileText, MapPin, XCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, event_halls(*, hall_photos(url, is_cover))')
    .eq('id', id)
    .eq('client_id', user!.id)
    .single()
  if (!reservation) notFound()

  const hall = Array.isArray(reservation.event_halls) ? reservation.event_halls[0] : reservation.event_halls
  const cover = hall?.hall_photos?.find((p: { url: string; is_cover: boolean }) => p.is_cover)?.url ?? hall?.hall_photos?.[0]?.url ?? null
  const nights = Math.max(1, Math.ceil((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / 86400000))

  return (
    <div>
      <p className="text-sm text-[#6B7280] mb-4">My Reservations / #{id.slice(0, 8).toUpperCase()}</p>
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="relative h-40">
              {cover ? (
              <Image src={cover} alt={hall?.name ?? ''} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
            ) : <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center text-white/40 text-2xl font-bold">{getInitials(hall?.name ?? 'Hall')}</div>}
            </div>
            <div className="p-5">
              <h1 className="font-bold text-xl">{hall?.name}</h1>
              <p className="text-sm text-[#6B7280] mt-1 inline-flex items-center gap-1"><MapPin size={14} />{hall?.wilaya} · {hall?.address}</p>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-5 mt-4">
            <h2 className="font-bold mb-5">Booking status</h2>
            <div className="space-y-5">
              <TimelineRow done icon={<CheckCircle2 size={16} />} title="Booking submitted" subtitle={`on ${formatDate(reservation.created_at)}`} />
              <TimelineRow done={Boolean(reservation.receipt_url)} current={!reservation.receipt_url} icon={<FileText size={16} />} title="Receipt uploaded" subtitle={reservation.receipt_url ? 'CCP payment receipt provided' : 'Not yet uploaded'} />
              <TimelineRow done={['confirmed', 'rejected'].includes(reservation.status)} current={reservation.status === 'pending' && Boolean(reservation.receipt_url)} icon={<CalendarCheck2 size={16} />} title="Owner reviewing" subtitle="Waiting for owner response" />
              <TimelineRow rejected={reservation.status === 'rejected'} done={reservation.status === 'confirmed'} icon={reservation.status === 'rejected' ? <XCircle size={16} /> : <CheckCircle2 size={16} />} title={reservation.status === 'rejected' ? 'Booking rejected' : 'Booking confirmed'} subtitle={reservation.status === 'confirmed' ? 'Your booking is confirmed' : reservation.status === 'rejected' ? 'The owner rejected this booking' : 'Pending review'} />
            </div>
          </div>

          {reservation.receipt_url ? (
            <div className="bg-white border rounded-2xl p-5 mt-4">
              <h3 className="font-bold">Payment receipt</h3>
              <p className="text-sm text-[#6B7280] mt-1">Your CCP receipt has been uploaded.</p>
              <a href={reservation.receipt_url} target="_blank" className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-3 flex items-center gap-3 mt-3 hover:bg-[#F0F0F6]">
                <ExternalLink size={14} /> View receipt
              </a>
            </div>
          ) : null}
        </div>
        <aside className="w-72 hidden lg:block">
          <div className="bg-white border rounded-2xl p-5">
            <p className="text-xs text-[#9CA3AF] mb-3">#{id.slice(0, 8).toUpperCase()}</p>
            <StatusBadge status={reservation.status} />
            <div className="border-t my-3" />
            <Row label="Check-in" value={formatDate(reservation.check_in)} />
            <Row label="Check-out" value={formatDate(reservation.check_out)} />
            <Row label="Duration" value={`${nights} nights`} />
            <Row label="Guests" value={String(reservation.guest_count)} />
            <div className="border-t my-3" />
            <Row label="Subtotal" value={formatPrice(reservation.subtotal)} />
            <Row label="Service fee" value={formatPrice(reservation.service_fee)} />
            <Row label="Total" value={formatPrice(reservation.total_price)} bold />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Link href={`/halls/${hall?.slug}`}><Button variant="outline" className="w-full">View hall</Button></Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function TimelineRow({ icon, title, subtitle, done, current, rejected }: { icon: React.ReactNode; title: string; subtitle: string; done?: boolean; current?: boolean; rejected?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${rejected ? 'bg-[#FEE2E2] text-[#DC2626]' : done ? 'bg-[#D1FAE5] text-[#059669]' : current ? 'bg-[#FEF3C7] text-[#D97706] animate-pulse' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>
        {icon}
      </div>
      <div><p className="font-semibold text-sm text-[#1A1A2E]">{title}</p><p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p></div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className="flex justify-between text-sm py-1"><span className="text-[#4B5563]">{label}</span><span className={bold ? 'font-bold text-[#1A1A2E]' : 'text-[#1A1A2E]'}>{value}</span></div>
}


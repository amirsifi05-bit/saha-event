import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, CalendarDays } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDateLong, formatPrice } from '@/lib/utils'

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, event_halls(name, wilaya, slug)')
    .eq('id', id)
    .eq('client_id', user!.id)
    .single()

  if (!reservation) notFound()
  const hall = Array.isArray(reservation.event_halls) ? reservation.event_halls[0] : reservation.event_halls

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto">
        <CheckCircle2 size={52} className="text-[#059669]" />
      </div>
      <h1 className="font-bold text-3xl text-[#1A1A2E] mt-6">Booking submitted!</h1>
      <p className="text-[#6B7280] text-base mt-2">Your receipt is being reviewed by the hall owner.</p>

      <div className="flex items-center justify-center gap-4 mt-8">
        <FlowStep done icon={<CheckCircle2 size={18} />} label="Receipt uploaded" />
        <div className="w-10 border-t-2 border-dashed border-[#E5E7EB]" />
        <FlowStep current icon={<Clock size={18} />} label="Owner reviewing" />
        <div className="w-10 border-t-2 border-dashed border-[#E5E7EB]" />
        <FlowStep icon={<CalendarDays size={18} />} label="Booking confirmed" />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-8 text-left">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-[#1A1A2E]">Booking summary</h2>
          <span className="text-xs text-[#9CA3AF]">#{id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="space-y-2.5 mt-4 text-sm">
          <Row label="Hall" value={hall?.name ?? '-'} />
          <Row label="Location" value={hall?.wilaya ?? '-'} />
          <Row label="Check-in" value={formatDateLong(reservation.check_in)} />
          <Row label="Check-out" value={formatDateLong(reservation.check_out)} />
          <Row label="Guests" value={String(reservation.guest_count)} />
          <div className="flex justify-between"><span>Status</span><StatusBadge status="pending" /></div>
        </div>
        <div className="border-t border-[#E5E7EB] my-4" />
        <Row label="Total" value={formatPrice(reservation.total_price)} bold />
        {reservation.receipt_url ? (
          <a href={reservation.receipt_url} target="_blank" className="text-sm text-[#1A1A2E] underline mt-3 inline-block">
            View uploaded receipt →
          </a>
        ) : null}
      </div>

      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 mt-4 text-sm text-[#92400E] text-left">
        <div className="inline-flex items-center gap-2"><Clock size={16} className="text-[#D97706]" />Response time is typically under 24 hours. You will receive a notification when the owner reviews your booking.</div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Link href="/client/reservations"><Button variant="outline" className="rounded-xl">View my reservations</Button></Link>
        <Link href="/halls"><Button className="rounded-xl bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558]">Find more halls</Button></Link>
      </div>
    </div>
  )
}

function FlowStep({ icon, label, done, current }: { icon: React.ReactNode; label: string; done?: boolean; current?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-[#D1FAE5] text-[#059669]' : current ? 'bg-[#FEF3C7] text-[#D97706] animate-pulse' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>
        {icon}
      </div>
      <span className="text-xs text-[#6B7280] mt-2">{label}</span>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}><span>{label}</span><span>{value}</span></div>
}


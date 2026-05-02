import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, Clock, FileText, MapPin, Phone } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import OwnerReservationDetailActions from './OwnerReservationDetailActions'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'

export default async function OwnerReservationDetailPage({
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

  const { data: reservation } = await supabase
    .from('reservations')
    .select(
      `
      *,
      event_halls(*, hall_photos(url, is_cover))
    `
    )
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!reservation) notFound()

  const { data: clientUser } = await supabase
    .from('users')
    .select('full_name, phone, wilaya, avatar_url, created_at')
    .eq('id', reservation.client_id)
    .single()

  const hall = Array.isArray(reservation.event_halls) ? reservation.event_halls[0] : reservation.event_halls
  const hallTyped = hall as {
    name: string
    slug: string
    wilaya: string
    hall_photos?: { url: string; is_cover: boolean }[]
  } | null

  const nights = Math.max(1, differenceInDays(parseISO(reservation.check_out), parseISO(reservation.check_in)))
  const receiptUrl = reservation.receipt_url as string | null
  const isImageReceipt = receiptUrl ? /\.(jpg|jpeg|png)$/i.test(receiptUrl.split('?')[0] ?? '') : false

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/owner/reservations" className="text-sm text-[#6B7280] hover:underline">
        ← All Reservations
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h2 className="font-bold text-lg">Client information</h2>
            <div className="flex items-center gap-3 mt-4">
              {clientUser?.avatar_url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src={clientUser.avatar_url} alt="" fill sizes="48px" className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white font-bold flex items-center justify-center">
                  {getInitials(clientUser?.full_name ?? 'Client')}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{clientUser?.full_name ?? 'Client'}</p>
                {clientUser?.phone ? (
                  <p className="text-sm text-[#6B7280] inline-flex items-center gap-1 mt-1">
                    <Phone size={14} /> {clientUser.phone}
                  </p>
                ) : null}
                {clientUser?.wilaya ? (
                  <p className="text-sm text-[#6B7280] inline-flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {clientUser.wilaya}
                  </p>
                ) : null}
                {clientUser?.created_at ? (
                  <p className="text-sm text-[#6B7280] inline-flex items-center gap-1 mt-2">
                    <Clock size={14} /> Member since {formatDate(clientUser.created_at)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mt-4">
            <h2 className="font-bold">Payment receipt</h2>
            {receiptUrl ? (
              isImageReceipt ? (
                <div className="mt-3">
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border border-[#E5E7EB]">
                    <Image src={receiptUrl} alt="Receipt" width={400} height={300} className="object-contain w-full h-full bg-[#F9FAFB]" />
                  </div>
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-[#1A1A2E] underline mt-2 inline-block">
                    Open full size
                  </a>
                </div>
              ) : (
                <div className="bg-[#F7F8FA] border rounded-xl p-6 flex items-center gap-4 mt-3">
                  <FileText size={40} className="text-[#6B7280]" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">CCP Payment Receipt</p>
                    <a href={receiptUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="mt-2 rounded-xl">
                        Open PDF
                      </Button>
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 mt-3 flex gap-2 text-sm text-[#92400E]">
                <AlertCircle className="text-[#D97706] flex-shrink-0" size={20} />
                No receipt uploaded yet. The client has not provided proof of payment.
              </div>
            )}
          </div>

          {reservation.special_requests ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mt-4">
              <h2 className="font-bold">Special requests</h2>
              <p className="text-sm text-[#4B5563] leading-relaxed mt-2">{reservation.special_requests}</p>
            </div>
          ) : null}
        </div>

        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <p className="text-xs text-[#9CA3AF]">#{id.slice(0, 8).toUpperCase()}</p>
            <div className="mt-2">
              <StatusBadge status={reservation.status} />
            </div>
            <p className="font-semibold mt-3 text-[#1A1A2E]">{hallTyped?.name}</p>
            <div className="border-t border-[#F3F4F6] my-3" />
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-[#6B7280]">Check-in</dt><dd>{formatDate(reservation.check_in)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6B7280]">Check-out</dt><dd>{formatDate(reservation.check_out)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6B7280]">Nights</dt><dd>{nights}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6B7280]">Guests</dt><dd>{reservation.guest_count}</dd></div>
            </dl>
            <div className="border-t border-[#F3F4F6] my-3" />
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-[#6B7280]">Subtotal</dt><dd>{formatPrice(reservation.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#6B7280]">Service fee</dt><dd>{formatPrice(reservation.service_fee)}</dd></div>
              <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatPrice(reservation.total_price)}</dd></div>
            </dl>
            {reservation.owner_response && reservation.status === 'rejected' ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                <p className="text-xs font-semibold text-red-700">Rejection reason:</p>
                <p className="text-sm text-red-600 mt-1">{reservation.owner_response}</p>
              </div>
            ) : null}
          </div>

          <OwnerReservationDetailActions
            reservationId={id}
            hallSlug={hallTyped?.slug ?? ''}
            status={reservation.status}
            checkOut={reservation.check_out}
          />
        </aside>
      </div>
    </div>
  )
}

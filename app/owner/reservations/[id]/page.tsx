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

// ── Extract storage path from a Supabase public or private URL ──
function extractStoragePath(url: string, bucket: string): string | null {
  // Handles both:
  //   .../storage/v1/object/public/ccp-receipts/userId/file.pdf
  //   .../storage/v1/object/sign/ccp-receipts/userId/file.pdf
  const marker = `/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  // Strip any query string (?token=...) that may already be on the URL
  return url.slice(idx + marker.length).split('?')[0] ?? null
}

async function getSignedReceiptUrl(rawUrl: string): Promise<string> {
  const supabase = await createClient()
  const path = extractStoragePath(rawUrl, 'ccp-receipts')
  if (!path) return rawUrl // fallback — better than crashing

  const { data } = await supabase.storage
    .from('ccp-receipts')
    .createSignedUrl(decodeURIComponent(path), 3600) // valid 1 hour

  return data?.signedUrl ?? rawUrl
}

export default async function OwnerReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`*, event_halls(*, hall_photos(url, is_cover))`)
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!reservation) notFound()

  const { data: clientUser } = await supabase
    .from('users')
    .select('full_name, phone, wilaya, avatar_url, created_at')
    .eq('id', reservation.client_id)
    .single()

  const hall = Array.isArray(reservation.event_halls)
    ? reservation.event_halls[0]
    : reservation.event_halls

  const hallTyped = hall as {
    name: string
    slug: string
    wilaya: string
    hall_photos?: { url: string; is_cover: boolean }[]
  } | null

  const nights = Math.max(
    1,
    differenceInDays(parseISO(reservation.check_out), parseISO(reservation.check_in))
  )

  // ── Signed URL — only generate if a receipt exists ──
  const receiptSignedUrl = reservation.receipt_url
    ? await getSignedReceiptUrl(reservation.receipt_url as string)
    : null

  // Detect file type from the original URL (before signing), not the signed URL
  const isImageReceipt = reservation.receipt_url
    ? /\.(jpg|jpeg|png|webp)$/i.test(
        (reservation.receipt_url as string).split('?')[0] ?? ''
      )
    : false

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/owner/reservations" className="text-sm text-[#6B7280] hover:underline">
        ← All Reservations
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Client info */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h2 className="font-bold text-lg text-[#1A1A2E]">Client information</h2>
            <div className="flex items-start gap-4 mt-4">
              {clientUser?.avatar_url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={clientUser.avatar_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {getInitials(clientUser?.full_name ?? 'Client')}
                </div>
              )}
              <div className="space-y-1">
                <p className="font-bold text-[#1A1A2E]">
                  {clientUser?.full_name ?? 'Client'}
                </p>
                {clientUser?.phone && (
                  <p className="text-sm text-[#6B7280] flex items-center gap-1.5">
                    <Phone size={13} /> {clientUser.phone}
                  </p>
                )}
                {clientUser?.wilaya && (
                  <p className="text-sm text-[#6B7280] flex items-center gap-1.5">
                    <MapPin size={13} /> {clientUser.wilaya}
                  </p>
                )}
                {clientUser?.created_at && (
                  <p className="text-sm text-[#6B7280] flex items-center gap-1.5">
                    <Clock size={13} /> Member since {formatDate(clientUser.created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Receipt — uses signed URL */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h2 className="font-bold text-[#1A1A2E]">Payment receipt</h2>

            {receiptSignedUrl ? (
              isImageReceipt ? (
                <div className="mt-3">
                  <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB]"
                    style={{ aspectRatio: '4/3' }}>
                    <Image
                      src={receiptSignedUrl}
                      alt="Payment receipt"
                      fill
                      className="object-contain"
                      sizes="448px"
                    />
                  </div>
                  <a
                    href={receiptSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1A1A2E] underline mt-2 inline-block"
                  >
                    Open full size ↗
                  </a>
                </div>
              ) : (
                // PDF receipt
                <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-5 flex items-center gap-4 mt-3">
                  <FileText size={36} className="text-[#6B7280] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-[#1A1A2E]">CCP Payment Receipt</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">PDF document</p>
                    <a href={receiptSignedUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="mt-2 rounded-xl text-xs">
                        Open PDF ↗
                      </Button>
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 mt-3 flex gap-2 text-sm text-[#92400E]">
                <AlertCircle className="text-[#D97706] flex-shrink-0 mt-0.5" size={18} />
                <span>No receipt uploaded yet. The client has not provided proof of payment.</span>
              </div>
            )}
          </div>

          {/* Special requests */}
          {reservation.special_requests && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
              <h2 className="font-bold text-[#1A1A2E]">Special requests</h2>
              <p className="text-sm text-[#4B5563] leading-relaxed mt-2">
                {reservation.special_requests}
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <p className="text-xs text-[#9CA3AF] font-mono">
              #{id.slice(0, 8).toUpperCase()}
            </p>
            <div className="mt-2">
              <StatusBadge status={reservation.status} />
            </div>

            {hallTyped?.name && (
              <p className="font-semibold mt-3 text-[#1A1A2E]">{hallTyped.name}</p>
            )}

            <div className="border-t border-[#F3F4F6] my-3" />

            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Check-in</dt>
                <dd className="font-medium">{formatDate(reservation.check_in)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Check-out</dt>
                <dd className="font-medium">{formatDate(reservation.check_out)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Nights</dt>
                <dd className="font-medium">{nights}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Guests</dt>
                <dd className="font-medium">{reservation.guest_count}</dd>
              </div>
            </dl>

            <div className="border-t border-[#F3F4F6] my-3" />

            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Subtotal</dt>
                <dd>{formatPrice(reservation.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Service fee</dt>
                <dd>{formatPrice(reservation.service_fee)}</dd>
              </div>
              <div className="flex justify-between font-bold text-[#1A1A2E]">
                <dt>Total</dt>
                <dd>{formatPrice(reservation.total_price)} DA</dd>
              </div>
            </dl>

            {reservation.owner_response && reservation.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
                <p className="text-xs font-semibold text-red-700">Rejection reason:</p>
                <p className="text-sm text-red-600 mt-1">{reservation.owner_response}</p>
              </div>
            )}
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

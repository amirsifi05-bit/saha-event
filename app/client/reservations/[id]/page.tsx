import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  XCircle,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'

// ── Extract the storage path from any Supabase storage URL ──────
function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length).split('?')[0] ?? null
}

async function getSignedReceiptUrl(rawUrl: string): Promise<string> {
  const supabase = await createClient()
  const path = extractStoragePath(rawUrl, 'ccp-receipts')
  if (!path) return rawUrl

  const { data } = await supabase.storage
    .from('ccp-receipts')
    .createSignedUrl(decodeURIComponent(path), 3600) // valid 1 hour

  return data?.signedUrl ?? rawUrl
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, event_halls(*, hall_photos(url, is_cover))')
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!reservation) notFound()

  const hall = Array.isArray(reservation.event_halls)
    ? reservation.event_halls[0]
    : reservation.event_halls

  const cover =
    hall?.hall_photos?.find((p: { url: string; is_cover: boolean }) => p.is_cover)?.url ??
    hall?.hall_photos?.[0]?.url ??
    null

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) /
        86400000
    )
  )

  // ── Signed URL — private bucket, never use raw URL directly ──
  const receiptSignedUrl = reservation.receipt_url
    ? await getSignedReceiptUrl(reservation.receipt_url as string)
    : null

  const isImageReceipt = reservation.receipt_url
    ? /\.(jpg|jpeg|png|webp)$/i.test(
        (reservation.receipt_url as string).split('?')[0] ?? ''
      )
    : false

  return (
    <div>
      <p className="text-sm text-[#6B7280] mb-4">
        <Link href="/client/reservations" className="hover:underline">
          My Reservations
        </Link>{' '}
        / #{id.slice(0, 8).toUpperCase()}
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Hall card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E]">
              {cover ? (
                <Image
                  src={cover}
                  alt={hall?.name ?? ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/30 text-2xl font-bold select-none">
                    {getInitials(hall?.name ?? 'Hall')}
                  </span>
                </div>
              )}
            </div>
            <div className="p-5">
              <h1 className="font-bold text-xl text-[#1A1A2E]">{hall?.name}</h1>
              <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-1.5">
                <MapPin size={14} className="flex-shrink-0" />
                {hall?.wilaya} · {hall?.address}
              </p>
            </div>
          </div>

          {/* Booking status timeline */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h2 className="font-bold mb-5 text-[#1A1A2E]">Booking status</h2>
            <div className="space-y-5">
              <TimelineRow
                done
                icon={<CheckCircle2 size={16} />}
                title="Booking submitted"
                subtitle={`on ${formatDate(reservation.created_at)}`}
              />
              <TimelineRow
                done={Boolean(reservation.receipt_url)}
                current={!reservation.receipt_url}
                icon={<FileText size={16} />}
                title="Receipt uploaded"
                subtitle={
                  reservation.receipt_url
                    ? 'CCP payment receipt provided'
                    : 'Not yet uploaded'
                }
              />
              <TimelineRow
                done={['confirmed', 'rejected', 'completed'].includes(reservation.status)}
                current={
                  reservation.status === 'pending' && Boolean(reservation.receipt_url)
                }
                icon={<CalendarCheck2 size={16} />}
                title="Owner reviewing"
                subtitle="Waiting for owner response"
              />
              <TimelineRow
                rejected={reservation.status === 'rejected'}
                done={
                  reservation.status === 'confirmed' ||
                  reservation.status === 'completed'
                }
                icon={
                  reservation.status === 'rejected' ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )
                }
                title={
                  reservation.status === 'rejected'
                    ? 'Booking rejected'
                    : reservation.status === 'completed'
                    ? 'Stay completed'
                    : 'Booking confirmed'
                }
                subtitle={
                  reservation.status === 'confirmed'
                    ? 'Your booking is confirmed!'
                    : reservation.status === 'completed'
                    ? 'We hope you had a great event.'
                    : reservation.status === 'rejected'
                    ? 'The owner rejected this booking.'
                    : 'Pending review'
                }
              />
            </div>
          </div>

          {/* Receipt — uses signed URL */}
          {receiptSignedUrl && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
              <h3 className="font-bold text-[#1A1A2E]">Payment receipt</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                Your CCP receipt has been uploaded.
              </p>

              {isImageReceipt ? (
                <div className="mt-3">
                  <div
                    className="relative w-full max-w-sm rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB]"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <Image
                      src={receiptSignedUrl}
                      alt="Payment receipt"
                      fill
                      className="object-contain"
                      sizes="384px"
                    />
                  </div>
                  <a
                    href={receiptSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1A1A2E] underline mt-2 inline-flex items-center gap-1"
                  >
                    <ExternalLink size={11} /> Open full size
                  </a>
                </div>
              ) : (
                <a
                  href={receiptSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3 mt-3 hover:bg-[#F0F0F6] transition-colors"
                >
                  <FileText size={20} className="text-[#6B7280] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#1A1A2E]">View receipt</span>
                  <ExternalLink size={13} className="ml-auto text-[#9CA3AF]" />
                </a>
              )}
            </div>
          )}

          {/* Owner response (rejection reason) */}
          {reservation.owner_response && reservation.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-red-700">Rejection reason:</p>
              <p className="text-sm text-red-600 mt-1 leading-relaxed">
                {reservation.owner_response}
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <p className="text-xs text-[#9CA3AF] font-mono mb-2">
              #{id.slice(0, 8).toUpperCase()}
            </p>
            <StatusBadge status={reservation.status} />

            <div className="border-t border-[#F3F4F6] my-3" />
            <Row label="Check-in" value={formatDate(reservation.check_in)} />
            <Row label="Check-out" value={formatDate(reservation.check_out)} />
            <Row label="Duration" value={`${nights} nights`} />
            <Row label="Guests" value={String(reservation.guest_count)} />

            <div className="border-t border-[#F3F4F6] my-3" />
            <Row label="Subtotal" value={`${formatPrice(reservation.subtotal)} DA`} />
            <Row label="Service fee" value={`${formatPrice(reservation.service_fee)} DA`} />
            <Row label="Total" value={`${formatPrice(reservation.total_price)} DA`} bold />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {hall?.slug && (
              <Link href={`/halls/${hall.slug}`}>
                <Button variant="outline" className="w-full rounded-xl">
                  View hall listing
                </Button>
              </Link>
            )}
            <Link href="/client/reservations">
              <Button variant="outline" className="w-full rounded-xl text-[#6B7280]">
                ← All my reservations
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function TimelineRow({
  icon,
  title,
  subtitle,
  done,
  current,
  rejected,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  done?: boolean
  current?: boolean
  rejected?: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          rejected
            ? 'bg-[#FEE2E2] text-[#DC2626]'
            : done
            ? 'bg-[#D1FAE5] text-[#059669]'
            : current
            ? 'bg-[#FEF3C7] text-[#D97706] animate-pulse'
            : 'bg-[#F3F4F6] text-[#9CA3AF]'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm text-[#1A1A2E]">{title}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-[#4B5563]">{label}</span>
      <span className={bold ? 'font-bold text-[#1A1A2E]' : 'text-[#1A1A2E]'}>{value}</span>
    </div>
  )
}

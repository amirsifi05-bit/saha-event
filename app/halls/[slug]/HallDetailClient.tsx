// app/halls/[slug]/HallDetailClient.tsx
// CREATE this file in the same folder as the page above.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format, parseISO, differenceInDays, isBefore, startOfToday, isWithinInterval } from 'date-fns'
import {
  MapPin, Users, Star, CheckCircle2, ChevronRight,
  Clock, FileText, Shield, XCircle, CalendarDays,
  AlertCircle, Images,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { DateRange } from 'react-day-picker'

// ── Types ────────────────────────────────────────────────────────
interface Hall {
  id: string
  owner_id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  description: string | null
  amenities: string[]
  rating: number
  review_count: number
}

interface Photo {
  id: string
  url: string
  is_cover: boolean
  sort_order: number
  caption: string | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client_id: string
}

interface UnavailableRange {
  from: string
  to: string
}

interface Props {
  hall: Hall
  photos: Photo[]
  reviews: Review[]
  unavailableRanges: UnavailableRange[]
  initialCheckIn: string
  initialCheckOut: string
  initialGuests: number
}

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (price: number) =>
  new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(price)

const fmtDate = (d: string) => format(parseISO(d), 'd MMM yyyy')

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-[#E8B86D] fill-[#E8B86D]' : 'text-[#D1D5DB]'}
        />
      ))}
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function HallDetailClient({
  hall,
  photos,
  reviews,
  unavailableRanges,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Sidebar state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialCheckIn && initialCheckOut
      ? { from: parseISO(initialCheckIn), to: parseISO(initialCheckOut) }
      : undefined
  )
  const [guests, setGuests] = useState(initialGuests)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showFullDesc, setShowFullDesc] = useState(false)

  const checkIn = dateRange?.from
  const checkOut = dateRange?.to
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const subtotal = nights * hall.price_per_day
  const serviceFee = Math.round(subtotal * 0.05)
  const total = subtotal + serviceFee

  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0]
  const otherPhotos = photos.filter((p) => !p.is_cover).slice(0, 2)

  // Check if a date is blocked
  const isBlocked = (date: Date) => {
    if (isBefore(date, startOfToday())) return true
    return unavailableRanges.some((range) => {
      try {
        return isWithinInterval(date, {
          start: parseISO(range.from),
          end: parseISO(range.to),
        })
      } catch {
        return false
      }
    })
  }

  const handleReserve = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/signin?redirect=/halls/${hall.slug}`)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'owner') {
      toast.error('Hall owners cannot make reservations.')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select your check-in and check-out dates.')
      return
    }

    const cin = format(checkIn, 'yyyy-MM-dd')
    const cout = format(checkOut, 'yyyy-MM-dd')
    router.push(`/client/book/${hall.slug}?check_in=${cin}&check_out=${cout}&guests=${guests}`)
  }

  // ── Gradient placeholder ─────────────────────────────────────
  const Placeholder = ({ className = '' }: { className?: string }) => (
    <div
      className={`bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center ${className}`}
    >
      <span className="text-white/20 text-5xl font-bold select-none">
        {hall.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
      </span>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
        <Link href="/" className="hover:text-[#1A1A2E]">Home</Link>
        <ChevronRight size={14} />
        <Link href={`/halls?wilaya=${hall.wilaya}`} className="hover:text-[#1A1A2E]">{hall.wilaya}</Link>
        <ChevronRight size={14} />
        <Link href="/halls" className="hover:text-[#1A1A2E]">Event Halls</Link>
        <ChevronRight size={14} />
        <span className="text-[#1A1A2E] font-medium line-clamp-1">{hall.name}</span>
      </nav>

      {/* Photo Gallery */}
      <div className="grid gap-2 rounded-2xl overflow-hidden mb-8" style={{ height: 420 }}
        onClick={() => photos.length > 0 && setGalleryOpen(true)}
      >
        {photos.length === 0 ? (
          <Placeholder className="rounded-2xl cursor-default" />
        ) : photos.length === 1 ? (
          <div className="relative cursor-pointer">
            <Image src={coverPhoto.url} alt={hall.name} fill className="object-cover rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 h-full cursor-pointer">
            {/* Large left image */}
            <div className="col-span-2 relative rounded-l-2xl overflow-hidden">
              {coverPhoto ? (
                <Image src={coverPhoto.url} alt={hall.name} fill className="object-cover" />
              ) : (
                <Placeholder className="w-full h-full" />
              )}
            </div>
            {/* Two stacked right images */}
            <div className="flex flex-col gap-2">
              {[0, 1].map((i) => (
                <div key={i} className="relative flex-1 overflow-hidden last:rounded-br-2xl first:rounded-tr-2xl">
                  {otherPhotos[i] ? (
                    <Image src={otherPhotos[i].url} alt="" fill className="object-cover" />
                  ) : (
                    <Placeholder className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Show all photos button */}
      {photos.length > 1 && (
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm font-medium text-[#1A1A2E] hover:bg-[#F7F8FA] transition mb-6">
              <Images size={16} />
              Show all {photos.length} photos
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 mt-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative h-56 rounded-xl overflow-hidden">
                  <Image src={photo.url} alt={photo.caption ?? hall.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Two-column layout */}
      <div className="flex gap-8 items-start">

        {/* ── Left: main content ────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Hall header */}
          <h1 className="text-3xl font-bold text-[#1A1A2E]">{hall.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {hall.address}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="text-[#E8B86D] fill-[#E8B86D]" />
              <strong className="text-[#1A1A2E]">{hall.rating.toFixed(1)}</strong>
              &nbsp;({hall.review_count} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> Up to {hall.capacity} guests
            </span>
          </div>

          {/* Amenities row */}
          <div className="flex flex-wrap gap-2 mt-4">
            {hall.amenities.map((a) => (
              <span key={a} className="bg-[#EEF2FF] text-[#3730A3] text-xs font-medium px-3 py-1 rounded-full">
                {a}
              </span>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="bg-[#F3F4F6] rounded-xl p-1 w-full justify-start">
              <TabsTrigger value="overview" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="amenities" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Amenities</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Reviews ({hall.review_count})</TabsTrigger>
              <TabsTrigger value="location" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Location</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6">
              {hall.description ? (
                <div>
                  <p className="text-[#374151] leading-relaxed text-base">
                    {showFullDesc || hall.description.length <= 300
                      ? hall.description
                      : hall.description.slice(0, 300) + '...'}
                  </p>
                  {hall.description.length > 300 && (
                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="text-[#1A1A2E] font-medium text-sm underline mt-2"
                    >
                      {showFullDesc ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[#9CA3AF] italic">No description provided.</p>
              )}
            </TabsContent>

            {/* Amenities */}
            <TabsContent value="amenities" className="mt-6">
              <div className="grid grid-cols-2 gap-3">
                {hall.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">
                    <CheckCircle2 size={16} className="text-[#059669] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#1A1A2E]">{a}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-6">
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star size={40} className="text-[#D1D5DB] mx-auto" />
                  <p className="text-[#6B7280] mt-3">No reviews yet. Be the first to review after your visit.</p>
                </div>
              ) : (
                <div>
                  {/* Rating summary */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-[#F7F8FA] rounded-2xl">
                    <span className="text-5xl font-bold text-[#1A1A2E]">{hall.rating.toFixed(1)}</span>
                    <div>
                      <StarRow rating={hall.rating} size={20} />
                      <p className="text-sm text-[#6B7280] mt-1">Based on {hall.review_count} reviews</p>
                    </div>
                  </div>
                  {/* Review list */}
                  <div className="flex flex-col gap-5">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-[#F3F4F6] pb-5 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white text-xs font-bold">
                            G
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A2E]">Guest</p>
                            <p className="text-xs text-[#9CA3AF]">{fmtDate(r.created_at)}</p>
                          </div>
                          <StarRow rating={r.rating} />
                        </div>
                        {r.comment && (
                          <p className="text-sm text-[#374151] mt-2 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Location */}
            <TabsContent value="location" className="mt-6">
              <div className="bg-[#E5E7EB] rounded-2xl h-48 flex flex-col items-center justify-center gap-3">
                <MapPin size={32} className="text-[#6B7280]" />
                <p className="text-sm font-medium text-[#374151]">{hall.address}</p>
                <p className="text-xs text-[#9CA3AF]">Exact location shared after booking confirmation</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* House rules */}
          <div className="mt-8 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6">
            <h3 className="font-bold text-[#1A1A2E] mb-4">House rules</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#374151]">
              {[
                [Clock, 'Check-in from 09:00 AM'],
                [Clock, 'Check-out before 11:00 PM'],
                [Users, `Maximum ${hall.capacity} guests`],
                [FileText, 'CCP payment receipt required'],
                [XCircle, 'No noise after midnight'],
                [Shield, 'ID verification on arrival'],
              ].map(([Icon, text], i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* @ts-ignore */}
                  <Icon size={15} className="text-[#D97706] flex-shrink-0" />
                  <span>{text as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: sticky sidebar ─────────────────────────── */}
        <div className="w-[360px] flex-shrink-0 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sticky top-24"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            {/* Price */}
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-2xl font-bold text-[#1A1A2E]">{fmt(hall.price_per_day)} DA</span>
              <span className="text-sm text-[#9CA3AF]">/day</span>
            </div>

            {/* Date range picker */}
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-4">
              <div className="grid grid-cols-2 divide-x divide-[#E5E7EB]">
                <div className="p-3">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Check-in</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {checkIn ? format(checkIn, 'd MMM yyyy') : <span className="text-[#9CA3AF]">Add date</span>}
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {checkOut ? format(checkOut, 'd MMM yyyy') : <span className="text-[#9CA3AF]">Add date</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              disabled={isBlocked}
              numberOfMonths={1}
              className="rounded-xl border border-[#E5E7EB] p-3 w-full"
            />

            {/* Guests */}
            <div className="flex items-center justify-between border border-[#E5E7EB] rounded-xl px-4 py-3 mt-4">
              <span className="text-sm font-medium text-[#374151]">Guests</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-lg leading-none hover:bg-[#F7F8FA] transition"
                >
                  −
                </button>
                <span className="text-sm font-bold text-[#1A1A2E] w-4 text-center">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(hall.capacity, guests + 1))}
                  className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-lg leading-none hover:bg-[#F7F8FA] transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            {nights > 0 && (
              <div className="bg-[#F7F8FA] rounded-xl p-4 mt-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">{fmt(hall.price_per_day)} DA × {nights} night{nights > 1 ? 's' : ''}</span>
                  <span className="text-[#1A1A2E]">{fmt(subtotal)} DA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Service fee (5%)</span>
                  <span className="text-[#1A1A2E]">{fmt(serviceFee)} DA</span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-2 flex justify-between font-bold">
                  <span className="text-[#1A1A2E]">Total</span>
                  <span className="text-[#1A1A2E]">{fmt(total)} DA</span>
                </div>
              </div>
            )}

            {/* Reserve button */}
            <button
              onClick={handleReserve}
              disabled={!checkIn || !checkOut}
              className="w-full mt-4 bg-[#E8B86D] hover:bg-[#D4A558] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1A2E] font-bold rounded-xl py-3.5 transition-all active:scale-[0.98]"
            >
              Reserve
            </button>

            {/* Notes */}
            <p className="text-center text-xs text-[#9CA3AF] mt-2">You won't be charged yet</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span className="text-xs text-[#059669]">Free cancellation</span>
            </div>

            {/* Guest capacity warning */}
            {guests > hall.capacity && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600">Exceeds max capacity of {hall.capacity}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

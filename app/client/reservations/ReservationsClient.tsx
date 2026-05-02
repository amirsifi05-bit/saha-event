'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, CalendarX, CheckCircle2, MapPin, Users, XCircle } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'

type Reservation = {
  id: string
  check_in: string
  check_out: string
  guest_count: number
  total_price: number
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
  event_halls: any
}

function normalizeHall(h: any) {
  if (!h) return null
  return Array.isArray(h) ? h[0] : h
}

export default function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')
  const [items, setItems] = useState(reservations)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0] ?? ''

  const upcoming = useMemo(
    () => items.filter((r) => r.check_in >= today && !['cancelled', 'rejected'].includes(r.status)),
    [items, today]
  )

  const past = useMemo(
    () => items.filter((r) => r.check_out < today && r.status === 'completed'),
    [items, today]
  )

  const cancelled = useMemo(
    () => items.filter((r) => ['cancelled', 'rejected'].includes(r.status)),
    [items]
  )

  const filtered =
    activeTab === 'all'
      ? items
      : activeTab === 'upcoming'
      ? upcoming
      : activeTab === 'past'
      ? past
      : cancelled

  async function cancelBooking(id: string) {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    setLoading(false)

    if (error) return toast.error(error.message)

    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    )

    setCancelId(null)
    toast.success('Booking cancelled.')
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">My Reservations</h1>
      <p className="text-sm text-[#6B7280] mt-1">{items.length} reservations</p>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
        <TabsList className="bg-[#F3F4F6] rounded-xl p-1">
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4 mt-6">
        {filtered.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          filtered.map((r) => {
            const hall = normalizeHall(r.event_halls)
            if (!hall) return null

            const cover =
              hall.hall_photos?.find((p: any) => p.is_cover)?.url ??
              hall.hall_photos?.[0]?.url ??
              null

            const nights = Math.max(
              1,
              differenceInDays(parseISO(r.check_out), parseISO(r.check_in))
            )

            return (
              <div
                key={r.id}
                onClick={() => router.push(`/client/reservations/${r.id}`)}
                className="group cursor-pointer bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-md transition"
              >
                {/* IMAGE */}
                <div className="relative h-48 w-full overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={hall.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] text-white/20 text-5xl font-bold">
                      {getInitials(hall.name)}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* ✅ FIXED TEXT POSITION */}
                  <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                    <h3 className="text-lg font-bold">{hall.name}</h3>
                    <p className="text-xs opacity-80">ID: {r.id}</p>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <h3 className="font-bold text-base">{hall.name}</h3>
                    <div className="ml-auto">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-1">
                    <MapPin size={13} /> {hall.wilaya}
                  </p>

                  <p className="text-sm mt-2 flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(r.check_in)} → {formatDate(r.check_out)} · {nights} nights
                  </p>

                  <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-1">
                    <Users size={13} /> {r.guest_count} guests
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="font-bold">{formatPrice(r.total_price)}</p>

                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/client/reservations/${r.id}`}
                        className="border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100"
                      >
                        View details
                      </Link>

                      {r.status === 'pending' && (
                        <button
                          onClick={() => setCancelId(r.id)}
                          className="border border-red-300 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}

                      {r.status === 'completed' && (
                        <Link
                          href={`/client/reservations/${r.id}/review`}
                          className="bg-[#E8B86D] px-3 py-1.5 rounded-lg text-sm"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ALERT */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={() => cancelId && cancelBooking(cancelId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Cancelling...' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ tab }: any) {
  const cfg =
    tab === 'past'
      ? { icon: CheckCircle2, text: 'No past bookings.' }
      : tab === 'cancelled'
      ? { icon: XCircle, text: 'No cancelled bookings.' }
      : { icon: CalendarX, text: 'No reservations.' }

  const Icon = cfg.icon

  return (
    <div className="text-center py-12 bg-white border rounded-2xl">
      <Icon size={48} className="mx-auto text-gray-300" />
      <p className="mt-3 text-gray-500">{cfg.text}</p>

      <Link href="/halls">
        <Button className="mt-4">Browse halls</Button>
      </Link>
    </div>
  )
}
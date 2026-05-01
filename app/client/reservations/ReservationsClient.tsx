'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
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
  event_halls:
    | { name: string; slug: string; wilaya: string; address: string; hall_photos: { url: string; is_cover: boolean }[] }
    | { name: string; slug: string; wilaya: string; address: string; hall_photos: { url: string; is_cover: boolean }[] }[]
    | null
}

function normalizeHall(h: any) {
  if (!h) return null;
  // Your log shows h is an object { name: '...', slug: '...' }
  // So we just return h directly.
  return h;
}


export default function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  console.log("DEBUG RESERVATIONS:", reservations);
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')
  const [items, setItems] = useState(reservations)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0] ?? ''
  const upcoming = useMemo(() => items.filter((r) => r.check_in >= today && !['cancelled', 'rejected'].includes(r.status)), [items, today])
  const past = useMemo(() => items.filter((r) => r.check_out < today && r.status === 'completed'), [items, today])
  const cancelled = useMemo(() => items.filter((r) => ['cancelled', 'rejected'].includes(r.status)), [items])
  const filtered = activeTab === 'all' ? items : activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled

  async function cancelBooking(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id)
    if (error) return toast.error(error.message)
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
    setCancelId(null)
    toast.success('Booking cancelled.')
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">My Reservations</h1>
      <p className="text-sm text-[#6B7280] mt-1">{items.length} reservations</p>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-6">
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
          filtered.map((r: any) => {
            // 1. Try to find the hall data under common Supabase keys
            const hall = r.event_halls || r.event_hall || null;
            
            if (!hall) {
              console.warn("Hall data missing for reservation:", r.id);
              return null;
            }
          
            // 2. Extract photos safely
            const photos = Array.isArray(hall.hall_photos) ? hall.hall_photos : [];
            const cover = photos.find((p: any) => p.is_cover)?.url ?? photos[0]?.url ?? null;
            
            // 3. Calculate nights
            const nights = Math.max(1, differenceInDays(parseISO(r.check_out), parseISO(r.check_in)));
          
            return (
              <div key={r.id} className="group relative bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition duration-200">
                {/* Ghost Link for the whole card */}
                <Link href={`/client/reservations/${r.id}`} className="absolute inset-0 z-0">
                  <span className="sr-only">View details for {hall.name}</span>
                </Link>
          
                <div className="sm:w-48 w-full h-36 sm:h-auto flex-shrink-0 relative">
                  {cover ? (
                    <Image 
                      src={cover} 
                      alt={hall.name} 
                      fill 
                      sizes="200px"
                      priority={filtered.indexOf(r) === 0}
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
          
                <div className="flex-1 p-5 z-10 pointer-events-none">
                  <div className="flex items-start gap-3">
                    {/* Use hall.name - this is where "Salle Al Farah" comes from */}
                    <h3 className="font-bold text-base text-[#1A1A2E]">{hall.name || 'Unknown Hall'}</h3>
                    <div className="ml-auto pointer-events-auto">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#6B7280] mt-1 inline-flex items-center gap-1">
                    <MapPin size={13} /> {hall.wilaya || 'No location'}
                  </p>
                  
                  <p className="text-sm text-[#4B5563] mt-2 inline-flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(r.check_in)} → {formatDate(r.check_out)} 
                    <span className="text-[#9CA3AF]"> · {nights} nights</span>
                  </p>
          
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F3F4F6]">
                    <p className="font-bold text-base text-[#1A1A2E]">{formatPrice(r.total_price)}</p>
                    <div className="flex gap-2 pointer-events-auto">
                      <Link href={`/client/reservations/${r.id}`} className="border border-[#E5E7EB] px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50">
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={Boolean(cancelId)} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The booking will be cancelled.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelId && cancelBooking(cancelId)} className="bg-red-600 hover:bg-red-700">Yes, cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ tab }: { tab: 'all' | 'upcoming' | 'past' | 'cancelled' }) {
  const cfg = tab === 'past' ? { icon: CheckCircle2, text: 'No past completed bookings yet.' } : tab === 'cancelled' ? { icon: XCircle, text: 'No cancelled bookings.' } : { icon: CalendarX, text: 'No reservations in this section.' }
  const Icon = cfg.icon
  return (
    <div className="text-center py-12 bg-white border border-[#E5E7EB] rounded-2xl">
      <Icon size={48} className="text-[#D1D5DB] mx-auto" />
      <p className="mt-3 text-[#6B7280]">{cfg.text}</p>
      <Link href="/halls"><Button className="mt-4 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl">Browse halls</Button></Link>
    </div>
  )
}


'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  CalendarDays,
  ExternalLink,
  Images,
  MapPin,
  Pencil,
  Plus,
  Star,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import HallStatusBadge from '@/components/owner/HallStatusBadge'
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
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getInitials } from '@/lib/utils'
import type { HallStatus } from '@/types/database'

export type OwnerHallListRow = {
  id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  rating: number
  review_count: number
  status: HallStatus
  created_at: string
  hall_photos: { url: string; is_cover: boolean }[] | null
}

export default function OwnerHallsClient({
  halls,
  ownerId,
}: {
  halls: OwnerHallListRow[]
  ownerId: string
}) {
  const router = useRouter()
  const [items, setItems] = useState(halls)
  const [tab, setTab] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const active = useMemo(() => items.filter((h) => h.status === 'active'), [items])
  const pending = useMemo(() => items.filter((h) => h.status === 'pending'), [items])
  const inactive = useMemo(() => items.filter((h) => h.status === 'inactive'), [items])

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((h) => h.status === tab)
  }, [items, tab])

  async function setStatus(id: string, status: HallStatus) {
    const supabase = createClient()
    const { error } = await supabase
      .from('event_halls')
      .update({ status })
      .eq('id', id)
      .eq('owner_id', ownerId)
    
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)))
    toast.success(status === 'inactive' ? 'Hall paused.' : 'Hall activated.')
    router.refresh()
  }

  async function deleteHall(id: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('event_halls')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId)

    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((prev) => prev.filter((h) => h.id !== id))
    setDeleteId(null)
    toast.success('Hall deleted.')
    router.refresh()
  }

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-[#1A1A2E]">My Halls</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Managing {items.length} property listings
          </p>
        </div>
        <Link href="/owner/halls/new">
          <Button className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl font-semibold w-full sm:w-auto">
            <Plus size={18} className="mr-2" /> Add New Hall
          </Button>
        </Link>
      </div>

      {/* Tabs Logic like Reservations */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-6">
        <TabsList className="bg-[#F3F4F6] rounded-xl p-1">
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactive.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6 mt-6">
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          filtered.map((hall) => {
            const cover =
              hall.hall_photos?.find((p) => p.is_cover)?.url ??
              hall.hall_photos?.[0]?.url ??
              null

            return (
              <div
                key={hall.id}
                className="group bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col"
              >
                {/* IMAGE HEADER (Full width like Reservations) */}
                <div className="relative h-56 w-full overflow-hidden">
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
                  
                  {/* Overlay Gradient & Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{hall.name}</h3>
                        <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                           <MapPin size={12} /> {hall.wilaya}, {hall.address}
                        </p>
                      </div>
                      <HallStatusBadge status={hall.status} />
                    </div>
                  </div>
                </div>

                {/* CONTENT AREA */}
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Capacity</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" /> {hall.capacity} guests
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Pricing</p>
                      <p className="text-sm font-bold text-[#1A1A2E]">
                        {formatPrice(hall.price_per_day)} <span className="font-normal text-gray-500">/day</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Rating</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Star size={14} className="text-[#E8B86D]" fill="#E8B86D" /> 
                        {Number(hall.rating).toFixed(1)} ({hall.review_count})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Quick Links</p>
                      <div className="flex gap-2">
                         <Link href={`/halls/${hall.slug}`} target="_blank" className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <ExternalLink size={16} />
                         </Link>
                         <Link href={`/owner/halls/${hall.id}/analytics`} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <BarChart3 size={16} />
                         </Link>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" asChild className="rounded-lg h-9">
                        <Link href={`/owner/halls/${hall.id}/edit`}>
                          <Pencil size={14} className="mr-2" /> Edit Info
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="rounded-lg h-9">
                        <Link href={`/owner/halls/${hall.id}/photos`}>
                          <Images size={14} className="mr-2" /> Photos
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="rounded-lg h-9">
                        <Link href={`/owner/halls/${hall.id}/availability`}>
                          <CalendarDays size={14} className="mr-2" /> Calendar
                        </Link>
                      </Button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {hall.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-9"
                          onClick={() => setStatus(hall.id, 'inactive')}
                        >
                          Pause Listing
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-9 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => setStatus(hall.id, 'active')}
                        >
                          {hall.status === 'pending' ? 'Publish Now' : 'Activate'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteId(hall.id)}
                      >
                        <XCircle size={14} className="mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hall?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All listing data, pricing history, and photos for this hall will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteHall(deleteId)}
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  const isFilter = tab !== 'all'
  
  return (
    <div className="text-center py-16 bg-white border-2 border-dashed rounded-3xl">
      <Building2 size={48} className="mx-auto text-gray-300" />
      <h3 className="mt-4 font-bold text-[#1A1A2E]">
        {isFilter ? `No ${tab} halls found` : 'No halls listed yet'}
      </h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
        {isFilter 
          ? `You don't have any properties currently marked as ${tab}.` 
          : 'Start by adding your first event hall to the platform to begin receiving bookings.'}
      </p>

      {!isFilter && (
        <Link href="/owner/halls/new">
          <Button className="mt-6 bg-[#1A1A2E] text-white hover:bg-[#2D2D4E] rounded-xl px-8">
            Create listing
          </Button>
        </Link>
      )}
    </div>
  )
}
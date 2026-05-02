'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, MapPin, Star, Users } from 'lucide-react'
import { toast } from 'sonner'

import HallStatusBadge from '@/components/owner/HallStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getInitials } from '@/lib/utils'
import type { HallStatus } from '@/types/database'

export type AdminHallRow = {
  id: string
  name: string
  slug: string
  wilaya: string
  capacity: number
  price_per_day: number
  rating: number
  review_count: number
  status: HallStatus
  created_at: string
  owner_full_name: string | null
  hall_photos: { url: string; is_cover: boolean }[] | null
}

const STATUS_OPTIONS: HallStatus[] = ['pending', 'active', 'inactive', 'rejected']

export default function AdminHallsClient({ halls }: { halls: AdminHallRow[] }) {
  const router = useRouter()
  const [items, setItems] = useState(halls)
  const [tab, setTab] = useState<'all' | 'active' | 'pending' | 'inactive' | 'rejected'>('all')

  const counts = useMemo(() => {
    const active = items.filter((h) => h.status === 'active').length
    const pending = items.filter((h) => h.status === 'pending').length
    const inactive = items.filter((h) => h.status === 'inactive').length
    const rejected = items.filter((h) => h.status === 'rejected').length
    return { active, pending, inactive, rejected }
  }, [items])

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((h) => h.status === tab)
  }, [items, tab])

  async function updateStatus(id: string, newStatus: HallStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('event_halls').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, status: newStatus } : h)))
    toast.success(`Hall status updated to ${newStatus}`)
    router.refresh()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-[#1A1A2E]">All Halls</h1>
          <p className="text-sm text-[#6B7280] mt-1">{items.length} listings</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[#6B7280] sm:text-right">
          <span>
            <span className="font-semibold text-[#059669]">Active:</span> {counts.active}
          </span>
          <span className="text-[#E5E7EB]">|</span>
          <span>
            <span className="font-semibold text-[#D97706]">Pending:</span> {counts.pending}
          </span>
          <span className="text-[#E5E7EB]">|</span>
          <span>
            <span className="font-semibold text-[#6B7280]">Inactive:</span> {counts.inactive}
          </span>
          <span className="text-[#E5E7EB]">|</span>
          <span>
            <span className="font-semibold text-[#991B1B]">Rejected:</span> {counts.rejected}
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList className="bg-[#F3F4F6] rounded-xl p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({counts.inactive})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6 mt-6">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-[#9CA3AF] text-sm">
            No halls in this filter.
          </div>
        ) : (
          filtered.map((hall) => {
            const cover =
              hall.hall_photos?.find((p) => p.is_cover)?.url ?? hall.hall_photos?.[0]?.url ?? null
            return (
              <div
                key={hall.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col md:flex-row"
              >
                <div className="relative w-full md:w-72 flex-shrink-0 h-48 md:h-auto md:min-h-[200px]">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={hall.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center">
                      <span className="text-white/30 text-5xl font-bold">{getInitials(hall.name)}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-[#1A1A2E]">{hall.name}</h3>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{hall.owner_full_name ?? 'Unknown owner'}</p>
                      </div>
                      <HallStatusBadge status={hall.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6B7280]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} className="text-[#9CA3AF]" aria-hidden />
                        {hall.wilaya}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} className="text-[#9CA3AF]" aria-hidden />
                        {hall.capacity} guests
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="text-[#E8B86D]" fill="#E8B86D" aria-hidden />
                        {Number(hall.rating).toFixed(1)} ({hall.review_count})
                      </span>
                      <span className="font-semibold text-[#1A1A2E]">{formatPrice(hall.price_per_day)} / day</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-[#F3F4F6]">
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
                      <Link href={`/halls/${hall.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} className="mr-2" aria-hidden />
                        View
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2 flex-1 sm:justify-end">
                      <span className="text-xs text-[#6B7280] whitespace-nowrap">Set status</span>
                      <Select
                        value={hall.status}
                        onValueChange={(v) => updateStatus(hall.id, v as HallStatus)}
                      >
                        <SelectTrigger className="w-[160px] h-9 rounded-xl border-[#D1D5DB]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, FileText, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

import type { OwnerReservationRow } from './page'
import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

function fmt(n: number) {
  return new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(n)
}

export default function OwnerReservationsClient({
  reservations,
  initialStatus,
}: {
  reservations: OwnerReservationRow[]
  initialStatus?: string
}) {
  const router = useRouter()
  const [items, setItems] = useState(reservations)
  const [tab, setTab] = useState<'all' | ReservationStatus>(() => {
    if (initialStatus === 'pending') return 'pending'
    return 'all'
  })
  const [sort, setSort] = useState<'newest' | 'oldest' | 'checkin'>('newest')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filtered = useMemo(() => {
    let list = items
    if (tab !== 'all') list = list.filter((r) => r.status === tab)
    const sorted = [...list]
    if (sort === 'newest')
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sort === 'oldest')
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else sorted.sort((a, b) => a.check_in.localeCompare(b.check_in))
    return sorted
  }, [items, tab, sort])

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((r) => r.status === 'pending').length,
      confirmed: items.filter((r) => r.status === 'confirmed').length,
      rejected: items.filter((r) => r.status === 'rejected').length,
      completed: items.filter((r) => r.status === 'completed').length,
    }),
    [items]
  )

  async function confirmBooking(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', id)
    if (error) return toast.error(error.message)
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'confirmed' as const } : r))
    )
    toast.success('Booking confirmed! Client has been notified.')
    router.refresh()
  }

  async function rejectBooking() {
    if (!rejectId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'rejected', owner_response: rejectReason.trim() || null })
      .eq('id', rejectId)
    if (error) return toast.error(error.message)
    setItems((prev) =>
      prev.map((r) =>
        r.id === rejectId
          ? { ...r, status: 'rejected' as const, owner_response: rejectReason }
          : r
      )
    )
    setRejectId(null)
    setRejectReason('')
    toast.success('Booking rejected.')
    router.refresh()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-[#1A1A2E]">Reservations</h1>
          <p className="text-sm text-[#6B7280] mt-1">{items.length} total</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="checkin">Check-in date</option>
        </select>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-[#F3F4F6] rounded-xl p-1">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({counts.confirmed})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4 mt-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E5E7EB] rounded-2xl text-[#9CA3AF] text-sm">
            No reservations in this tab.
          </div>
        ) : (
          filtered.map((r) => {
            const hall = r.event_halls
            const clientName = r.users?.full_name ?? `Client ${r.client_id.slice(0, 8)}`
            const hasReceipt = Boolean(r.receipt_url)

            return (
              <div
                key={r.id}
                className={`bg-white border border-[#E5E7EB] rounded-2xl p-5 ${
                  r.status === 'pending' ? 'border-l-4 border-l-[#E8B86D]' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-base text-[#1A1A2E]">{hall?.name ?? 'Hall'}</p>
                    <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded mt-1 inline-block">
                      {hall?.wilaya}
                    </span>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {format(parseISO(r.created_at), 'd MMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#9CA3AF]" />
                    <span className="font-medium text-[#1A1A2E]">{clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#4B5563]">
                    <CalendarDays size={16} className="text-[#9CA3AF]" />
                    {r.check_in} → {r.check_out}
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Users size={16} className="text-[#9CA3AF]" />
                    {r.guest_count} guests
                  </div>
                  <div className="font-bold text-[#1A1A2E]">{fmt(r.total_price)} DA</div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {/* Receipt — always route to detail page to get signed URL */}
                  <div>
                    {hasReceipt ? (
                      <Link
                        href={`/owner/reservations/${r.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-[#1A1A2E] hover:underline"
                      >
                        <FileText size={15} className="text-[#6B7280]" />
                        View receipt
                      </Link>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] italic">No receipt uploaded</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {r.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setRejectId(r.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558]"
                          onClick={() => confirmBooking(r.id)}
                        >
                          Confirm
                        </Button>
                      </>
                    ) : (
                      <Link href={`/owner/reservations/${r.id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          View details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectId)} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this booking</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Hall unavailable on those dates"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={rejectBooking}>
              Reject booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

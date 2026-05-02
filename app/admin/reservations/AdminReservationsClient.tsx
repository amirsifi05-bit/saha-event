'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

import StatusBadge from '@/components/client/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

export type AdminReservationRow = {
  id: string
  status: ReservationStatus
  total_price: number
  check_in: string
  check_out: string
  guest_count: number
  created_at: string
  receipt_url: string | null
  client_name: string
  hall_name: string
  wilaya: string
}

type TabFilter = 'all' | ReservationStatus

function normalizeHall(
  raw: { name: string; wilaya: string } | { name: string; wilaya: string }[] | null
): { name: string; wilaya: string } {
  if (!raw) return { name: '—', wilaya: '—' }
  const h = Array.isArray(raw) ? raw[0] : raw
  return { name: h?.name ?? '—', wilaya: h?.wilaya ?? '—' }
}

export default function AdminReservationsClient({
  initialRows,
  filterUserId,
}: {
  initialRows: AdminReservationRow[]
  filterUserId: string | null
}) {
  const [items, setItems] = useState(initialRows)
  const [tab, setTab] = useState<TabFilter>('all')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialRows.length >= 50)

  useEffect(() => {
    setItems(initialRows)
    setHasMore(initialRows.length >= 50)
  }, [initialRows])

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((r) => r.status === tab)
  }, [items, tab])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const offset = items.length
      let q = supabase
        .from('reservations')
        .select(
          `
          id, status, total_price, check_in, check_out, guest_count, created_at, receipt_url, client_id,
          event_halls(name, wilaya)
        `
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + 49)

      if (filterUserId) {
        q = q.eq('client_id', filterUserId)
      }

      const { data: raw, error } = await q
      if (error) throw new Error(error.message)
      const batch = raw ?? []
      if (batch.length < 50) setHasMore(false)
      if (batch.length === 0) {
        setHasMore(false)
        return
      }

      const clientIds = [...new Set(batch.map((r: { client_id: string }) => r.client_id))]
      const { data: clientRows } =
        clientIds.length > 0
          ? await supabase.from('users').select('id, full_name').in('id', clientIds)
          : { data: [] as { id: string; full_name: string }[] }

      const clientMap = Object.fromEntries((clientRows ?? []).map((c) => [c.id, c.full_name]))

      const mapped: AdminReservationRow[] = batch.map(
        (r: {
          id: string
          status: ReservationStatus
          total_price: number
          check_in: string
          check_out: string
          guest_count: number
          created_at: string
          receipt_url: string | null
          client_id: string
          event_halls: { name: string; wilaya: string } | { name: string; wilaya: string }[] | null
        }) => {
          const hall = normalizeHall(r.event_halls)
          return {
            id: r.id,
            status: r.status,
            total_price: r.total_price,
            check_in: r.check_in,
            check_out: r.check_out,
            guest_count: r.guest_count,
            created_at: r.created_at,
            receipt_url: r.receipt_url,
            client_name: clientMap[r.client_id] ?? '—',
            hall_name: hall.name,
            wilaya: hall.wilaya,
          }
        }
      )

      setItems((prev) => [...prev, ...mapped])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }

  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((r) => r.status === 'pending').length,
      confirmed: items.filter((r) => r.status === 'confirmed').length,
      rejected: items.filter((r) => r.status === 'rejected').length,
      cancelled: items.filter((r) => r.status === 'cancelled').length,
      completed: items.filter((r) => r.status === 'completed').length,
    }
  }, [items])

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">All Reservations</h1>
      {filterUserId ? (
        <p className="text-sm text-[#6B7280] mt-1">Filtered by client ID {filterUserId.slice(0, 8)}…</p>
      ) : (
        <p className="text-sm text-[#6B7280] mt-1">Platform-wide audit view (read-only)</p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)} className="mt-6">
        <TabsList className="bg-[#F3F4F6] rounded-xl p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({tabCounts.confirmed})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({tabCounts.rejected})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({tabCounts.cancelled})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tabCounts.completed})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mt-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#9CA3AF]">No reservations in this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Hall</th>
                  <th className="text-left px-4 py-3">Wilaya</th>
                  <th className="text-left px-4 py-3">Dates</th>
                  <th className="text-left px-4 py-3">Guests</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[#F3F4F6] last:border-none">
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{r.client_name}</td>
                    <td className="px-4 py-3 text-[#374151]">{r.hall_name}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{r.wilaya}</td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {format(parseISO(r.check_in), 'd MMM yyyy')} → {format(parseISO(r.check_out), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{r.guest_count}</td>
                    <td className="px-4 py-3 font-semibold text-[#1A1A2E]">{formatPrice(r.total_price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.receipt_url ? (
                        <a
                          href={r.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1A1A2E] underline text-xs font-medium"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="flex justify-center mt-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

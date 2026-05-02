import { redirect } from 'next/navigation'

import AdminReservationsClient, {
  type AdminReservationRow,
} from './AdminReservationsClient'
import { createClient } from '@/lib/supabase/server'
import type { ReservationStatus } from '@/types/database'

function normalizeHall(
  raw: { name: string; wilaya: string } | { name: string; wilaya: string }[] | null
): { name: string; wilaya: string } {
  if (!raw) return { name: '—', wilaya: '—' }
  const h = Array.isArray(raw) ? raw[0] : raw
  return { name: h?.name ?? '—', wilaya: h?.wilaya ?? '—' }
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string }>
}) {
  const { user_id: filterUserId } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  let rq = supabase
    .from('reservations')
    .select(
      `
      id, status, total_price, check_in, check_out, guest_count, created_at, receipt_url, client_id,
      event_halls(name, wilaya)
    `
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (filterUserId) {
    rq = rq.eq('client_id', filterUserId)
  }

  const { data: raw } = await rq

  const list = raw ?? []
  const clientIds = [...new Set(list.map((r: { client_id: string }) => r.client_id))]
  const { data: clientRows } =
    clientIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', clientIds)
      : { data: [] as { id: string; full_name: string }[] }

  const clientMap = Object.fromEntries((clientRows ?? []).map((c) => [c.id, c.full_name]))

  const rows: AdminReservationRow[] = list.map(
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

  return <AdminReservationsClient initialRows={rows} filterUserId={filterUserId ?? null} />
}

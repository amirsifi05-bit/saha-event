import { redirect } from 'next/navigation'

import OwnerReservationsClient from './OwnerReservationsClient'
import { createClient } from '@/lib/supabase/server'
import type { Reservation } from '@/types/database'

export type OwnerReservationRow = Omit<Reservation, 'event_halls'> & {
  event_halls: { name: string; slug: string; wilaya: string } | null
  users: { full_name: string; phone: string | null; wilaya: string | null; avatar_url: string | null } | null
}

export default async function OwnerReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: raw } = await supabase
    .from('reservations')
    .select(
      `
      *,
      event_halls(name, slug, wilaya)
    `
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (raw ?? []) as (Omit<Reservation, 'event_halls'> & {
    event_halls: { name: string; slug: string; wilaya: string } | { name: string; slug: string; wilaya: string }[] | null
  })[]

  const clientIds = [...new Set(rows.map((r) => r.client_id))]
  const { data: clientRows } =
    clientIds.length > 0
      ? await supabase.from('users').select('id, full_name, phone, wilaya, avatar_url').in('id', clientIds)
      : { data: [] as { id: string; full_name: string; phone: string | null; wilaya: string | null; avatar_url: string | null }[] }

  type ClientPick = {
    id: string
    full_name: string
    phone: string | null
    wilaya: string | null
    avatar_url: string | null
  }
  const userMap: Record<string, ClientPick> = Object.fromEntries(
    (clientRows ?? []).map((u: ClientPick) => [u.id, u])
  )

  const reservations: OwnerReservationRow[] = rows.map((r) => {
    const h = r.event_halls
    const normalizedHall = Array.isArray(h) ? (h[0] ?? null) : h
    return {
      ...r,
      event_halls: normalizedHall,
      users: userMap[r.client_id] ?? null,
    }
  })

  return <OwnerReservationsClient reservations={reservations} initialStatus={statusParam} />
}

import { redirect } from 'next/navigation'

import AdminHallsClient, { type AdminHallRow } from './AdminHallsClient'
import { createClient } from '@/lib/supabase/server'

export default async function AdminHallsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  const { data: hallsRaw } = await supabase
    .from('event_halls')
    .select(
      `
      id, name, slug, wilaya, status, rating, review_count,
      price_per_day, capacity, created_at, owner_id,
      hall_photos(url, is_cover)
    `
    )
    .order('created_at', { ascending: false })

  const rows = hallsRaw ?? []
  const ownerIds = [...new Set(rows.map((h) => h.owner_id))]
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', ownerIds)
      : { data: [] as { id: string; full_name: string }[] }

  const ownerMap = Object.fromEntries((owners ?? []).map((o) => [o.id, o.full_name]))

  const halls: AdminHallRow[] = rows.map((h) => ({
    id: h.id,
    name: h.name,
    slug: h.slug,
    wilaya: h.wilaya,
    capacity: h.capacity,
    price_per_day: h.price_per_day,
    rating: h.rating,
    review_count: h.review_count,
    status: h.status,
    created_at: h.created_at,
    owner_full_name: ownerMap[h.owner_id] ?? null,
    hall_photos: (h.hall_photos ?? null) as AdminHallRow['hall_photos'],
  }))

  return <AdminHallsClient halls={halls} />
}

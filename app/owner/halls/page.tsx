import { redirect } from 'next/navigation'

import OwnerHallsClient, { type OwnerHallListRow } from './OwnerHallsClient'
import { createClient } from '@/lib/supabase/server'

export default async function OwnerHallsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: hallsRaw } = await supabase
    .from('event_halls')
    .select(
      `
    id, name, slug, wilaya, address, capacity, price_per_day,
    rating, review_count, status, created_at,
    hall_photos(url, is_cover)
  `
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const halls = (hallsRaw ?? []) as OwnerHallListRow[]

  return <OwnerHallsClient halls={halls} ownerId={user.id} />
}

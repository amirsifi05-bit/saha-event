import { createClient } from '@/lib/supabase/server'
import HallsClient from './HallsClient'

type HallListItem = {
  id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  rating: number
  review_count: number
  amenities: string[]
  hall_photos?: { url: string; is_cover: boolean }[]
}

export default async function HallsPage({
  searchParams,
}: {
  searchParams: Promise<{
    wilaya?: string
    check_in?: string
    check_out?: string
    guests?: string
    sort?: string
  }>
}) {
  // 1. THIS IS THE FIX: You MUST await the searchParams Promise first
  const resolvedParams = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('event_halls')
    .select(
      `
      id, name, slug, wilaya, address, capacity,
      price_per_day, rating, review_count, amenities,
      hall_photos!inner(url, is_cover)
    `
    )
    .eq('status', 'active')
    .eq('hall_photos.is_cover', true)

  // 2. Use 'resolvedParams' instead of 'searchParams'
  if (resolvedParams.wilaya) {
    query = query.eq('wilaya', resolvedParams.wilaya)
  }

  const { data: halls } = await query

  return (
    <HallsClient
      halls={((halls ?? []) as HallListItem[]).map((h) => ({
        ...h,
        hall_photos: h.hall_photos ?? [],
      }))}
      initialWilaya={resolvedParams.wilaya ?? ''}
      initialCheckIn={resolvedParams.check_in ?? ''}
      initialCheckOut={resolvedParams.check_out ?? ''}
      initialGuests={Number(resolvedParams.guests) || 2}
      initialSort={resolvedParams.sort ?? 'recommended'}
    />
  )
}
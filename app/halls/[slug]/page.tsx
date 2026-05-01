// app/halls/[slug]/page.tsx
// CREATE this file at exactly that path in your project.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import HallDetailClient from './HallDetailClient'

export default async function HallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ check_in?: string; check_out?: string; guests?: string }>
}) {
  const { slug } = await params
  const { check_in, check_out, guests } = await searchParams
  const supabase = await createClient()

  const { data: hall } = await supabase
    .from('event_halls')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!hall) notFound()

  // Fetch photos separately
  const { data: photos } = await supabase
    .from('hall_photos')
    .select('*')
    .eq('hall_id', hall.id)
    .order('sort_order', { ascending: true })

  // Fetch last 5 reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, client_id')
    .eq('hall_id', hall.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch confirmed reservations (for calendar blocking)
  const today = new Date().toISOString().split('T')[0]

  const { data: bookedDates } = await supabase
    .from('reservations')
    .select('check_in, check_out')
    .eq('hall_id', hall.id)
    .eq('status', 'confirmed')
    .gte('check_out', today)

  // Fetch manual availability blocks
  const { data: blocks } = await supabase
    .from('availability_blocks')
    .select('blocked_from, blocked_to')
    .eq('hall_id', hall.id)
    .gte('blocked_to', today)

  const unavailableRanges = [
    ...(bookedDates ?? []).map((r) => ({ from: r.check_in, to: r.check_out })),
    ...(blocks ?? []).map((b) => ({ from: b.blocked_from, to: b.blocked_to })),
  ]

  return (
    <HallDetailClient
      hall={hall}
      photos={photos ?? []}
      reviews={reviews ?? []}
      unavailableRanges={unavailableRanges}
      initialCheckIn={check_in ?? ''}
      initialCheckOut={check_out ?? ''}
      initialGuests={Number(guests) || 2}
    />
  )
}

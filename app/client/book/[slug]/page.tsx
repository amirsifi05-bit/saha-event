import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import BookingWizard from './BookingWizard'

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ check_in?: string; check_out?: string; guests?: string }>
}) {
  const { slug } = await params
  const { check_in, check_out, guests } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?redirect=/client/book/${slug}`)

  const { data: hall } = await supabase
    .from('event_halls')
    .select(
      `
      id, owner_id, name, slug, wilaya, address, capacity,
      price_per_day, description, amenities,
      hall_photos(url, is_cover, sort_order)
    `
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!hall) notFound()

  const todayIso = new Date().toISOString().split('T')[0] ?? ''

  const { data: blocks } = await supabase
    .from('availability_blocks')
    .select('blocked_from, blocked_to')
    .eq('hall_id', hall.id)
    .gte('blocked_to', todayIso)

  const { data: bookedDates } = await supabase
    .from('reservations')
    .select('check_in, check_out')
    .eq('hall_id', hall.id)
    .eq('status', 'confirmed')
    .gte('check_out', todayIso)

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const blockedRanges = [
    ...((blocks ?? []) as Array<{ blocked_from: string; blocked_to: string }>).map((b) => ({
      from: b.blocked_from,
      to: b.blocked_to,
    })),
    ...((bookedDates ?? []) as Array<{ check_in: string; check_out: string }>).map((b) => ({
      from: b.check_in,
      to: b.check_out,
    })),
  ]

  return (
    <BookingWizard
      hall={hall as {
        id: string
        owner_id: string
        name: string
        slug: string
        wilaya: string
        address: string
        capacity: number
        price_per_day: number
        hall_photos: { url: string; is_cover: boolean }[]
      }}
      userId={user.id}
      userEmail={user.email!}
      userFullName={profile?.full_name ?? ''}
      userPhone={profile?.phone ?? ''}
      unavailableRanges={blockedRanges}
      initialCheckIn={check_in ?? ''}
      initialCheckOut={check_out ?? ''}
      initialGuests={Number(guests) || 1}
    />
  )
}


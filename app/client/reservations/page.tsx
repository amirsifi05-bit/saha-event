import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReservationsClient from '@/app/client/reservations/ReservationsClient'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // Using a more explicit select to ensure all nested data is captured
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      *,
      event_halls (
        name, 
        slug, 
        wilaya, 
        address,
        hall_photos (url, is_cover)
      )
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  // Cast the data to 'any' temporarily to bypass the 'never' error
  return <ReservationsClient reservations={(reservations || []) as any} />
}
import { redirect } from 'next/navigation'

import OwnerLayout from '@/components/owner/OwnerLayout'
import { createClient } from '@/lib/supabase/server'

export default async function OwnerRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/owner/dashboard')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client') redirect('/client/dashboard')
  if (profile?.role === 'admin') redirect('/admin/dashboard')
  if (!profile || profile.role !== 'owner') redirect('/client/dashboard')

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <OwnerLayout
      userId={user.id}
      fullName={profile.full_name ?? 'Owner'}
      avatarUrl={profile.avatar_url ?? null}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </OwnerLayout>
  )
}

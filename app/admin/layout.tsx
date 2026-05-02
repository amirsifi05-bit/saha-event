import { redirect } from 'next/navigation'

import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/admin/dashboard')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/client/dashboard')
  }

  return (
    <AdminLayout userId={user.id} fullName={profile.full_name ?? 'Admin'} avatarUrl={profile.avatar_url ?? null}>
      {children}
    </AdminLayout>
  )
}

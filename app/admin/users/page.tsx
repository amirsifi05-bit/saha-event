import { redirect } from 'next/navigation'

import AdminUsersClient, { type AdminUserRow } from './AdminUsersClient'
import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  const { data: usersRaw } = await supabase
    .from('users')
    .select('id, role, full_name, phone, wilaya, created_at')
    .order('created_at', { ascending: false })

  const users = (usersRaw ?? []) as AdminUserRow[]

  return <AdminUsersClient users={users} />
}

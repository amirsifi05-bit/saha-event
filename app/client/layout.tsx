import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ClientSidebar from '@/components/client/ClientSidebar'
import MobileBottomNav from '@/components/client/MobileBottomNav'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/client/dashboard')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'owner') redirect('/owner/dashboard')
  if (profile?.role === 'admin') redirect('/admin/dashboard')
  if (!profile || profile.role !== 'client') redirect('/auth/signin')

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <ClientSidebar
        userId={user.id}
        fullName={profile.full_name ?? 'User'}
        avatarUrl={profile.avatar_url ?? null}
        unreadCount={unreadCount ?? 0}
      />
      <main className="flex-1 lg:ml-[240px] pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
      <MobileBottomNav unreadCount={unreadCount ?? 0} />
    </div>
  )
}


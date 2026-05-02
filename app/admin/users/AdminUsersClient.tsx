'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { UserRole } from '@/types/database'

export type AdminUserRow = {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  wilaya: string | null
  created_at: string
}

function roleBadgeClasses(role: UserRole) {
  if (role === 'client') return 'bg-[#EEF2FF] text-[#3730A3]'
  if (role === 'owner') return 'bg-[#D1FAE5] text-[#065F46]'
  return 'bg-[#FEE2E2] text-[#991B1B]'
}

export default function AdminUsersClient({ users }: { users: AdminUserRow[] }) {
  const router = useRouter()
  const [items, setItems] = useState(users)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'client' | 'owner' | 'admin'>('all')
  const [pendingRole, setPendingRole] = useState<{ id: string; next: UserRole } | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = items
    if (tab === 'client') list = list.filter((u) => u.role === 'client')
    else if (tab === 'owner') list = list.filter((u) => u.role === 'owner')
    else if (tab === 'admin') list = list.filter((u) => u.role === 'admin')
    if (!q) return list
    return list.filter((u) => u.full_name.toLowerCase().includes(q))
  }, [items, query, tab])

  async function applyRoleChange() {
    if (!pendingRole) return
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ role: pendingRole.next }).eq('id', pendingRole.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((prev) =>
      prev.map((u) => (u.id === pendingRole.id ? { ...u, role: pendingRole.next } : u))
    )
    toast.success('Role updated.')
    setPendingRole(null)
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-bold text-2xl text-[#1A1A2E]">All Users</h1>
      <p className="text-sm text-[#6B7280] mt-1">{items.length} accounts</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md rounded-xl border-[#D1D5DB]"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-4">
        <TabsList className="bg-[#F3F4F6] rounded-xl p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="client">Clients</TabsTrigger>
          <TabsTrigger value="owner">Owners</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mt-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#9CA3AF]">No users match.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Wilaya</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[#F3F4F6] last:border-none">
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{u.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClasses(u.role)}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{u.wilaya ?? '—'}</td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 items-start">
                        <Link
                          href={`/admin/reservations?user_id=${u.id}`}
                          className="text-xs text-[#1A1A2E] underline"
                        >
                          View reservations
                        </Link>
                        {u.role !== 'admin' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs rounded-lg"
                            onClick={() =>
                              setPendingRole({
                                id: u.id,
                                next: u.role === 'client' ? 'owner' : 'client',
                              })
                            }
                          >
                            {u.role === 'client' ? 'Make owner' : 'Make client'}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={pendingRole !== null} onOpenChange={(o) => !o && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the account role to{' '}
              <strong>{pendingRole?.next === 'owner' ? 'owner' : 'client'}</strong>. The user will see a different
              dashboard on next sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

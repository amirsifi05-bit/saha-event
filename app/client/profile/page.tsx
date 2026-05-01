'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { WILAYAS } from '@/lib/auth/wilayas'
import { formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  wilaya: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', phone: '', wilaya: '' },
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      setUserId(auth.user.id)
      setEmail(auth.user.email ?? '')
      const { data } = await supabase
        .from('users')
        .select('full_name, phone, wilaya, avatar_url, created_at')
        .eq('id', auth.user.id)
        .single()
      if (!data) return
      form.reset({
        full_name: data.full_name ?? '',
        phone: data.phone ?? '',
        wilaya: data.wilaya ?? '',
      })
      setAvatarUrl(data.avatar_url)
      setCreatedAt(data.created_at)
    }
    void load()
  }, [form])

  async function uploadAvatar(file: File) {
    const supabase = createClient()
    const path = `${userId}/avatar`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return toast.error(error.message)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
    if (updateError) return toast.error(updateError.message)
    setAvatarUrl(data.publicUrl)
    toast.success('Photo updated!')
  }

  const submit = form.handleSubmit(async (values) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update({
      full_name: values.full_name,
      phone: values.phone || null,
      wilaya: values.wilaya || null,
    }).eq('id', userId)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  })

  return (
    <div>
      <div className="bg-white border rounded-2xl p-6">
        <h1 className="font-bold mb-6">Personal information</h1>
        <div className="flex items-center gap-5 mb-6">
          {avatarUrl ? (
            <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden">
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A2E] text-white font-bold text-2xl flex items-center justify-center">
              {getInitials(form.watch('full_name') || 'Client')}
            </div>
          )}
          <button type="button" className="text-sm text-[#E8B86D] underline" onClick={() => fileRef.current?.click()}>Change photo</button>
          <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input {...form.register('full_name')} className="mt-1" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...form.register('phone')} className="mt-1" />
          </div>
          <div>
            <Label>Wilaya</Label>
            <Select value={form.watch('wilaya') || ''} onValueChange={(value) => form.setValue('wilaya', value)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select wilaya" /></SelectTrigger>
              <SelectContent>{WILAYAS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="bg-[#1A1A2E] hover:bg-[#2D2D4E] px-8 py-2 rounded-xl">Save changes</Button>
        </form>
      </div>

      <div className="bg-white border rounded-2xl p-6 mt-4">
        <h2 className="font-bold mb-4">Account information</h2>
        <div className="text-sm space-y-4">
          <div>
            <p className="text-[#6B7280]">Email</p>
            <p className="inline-flex items-center gap-2 mt-1"><Lock size={14} className="text-[#6B7280]" />{email}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Contact support to change your email address</p>
          </div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Member since</span><span>{createdAt ? formatDate(createdAt) : '-'}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Account type</span><span className="px-2 py-1 bg-[#EEF2FF] text-[#3730A3] rounded-md">Client account</span></div>
        </div>
        <Link href="/client/profile/security" className="text-sm underline text-[#6B7280] inline-block mt-4">
          Security settings
        </Link>
      </div>
    </div>
  )
}


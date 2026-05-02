'use client'

import { useEffect, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { WILAYAS } from '@/lib/auth/wilayas'
import { cn, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  business_name: z.string().min(1),
  bio: z.string().optional(),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  wilaya: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function OwnerProfilePage() {
  const [email, setEmail] = useState('')
  const [memberSince, setMemberSince] = useState('')
  const [verified, setVerified] = useState(false)
  const [userId, setUserId] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: '',
      bio: '',
      full_name: '',
      phone: '',
      wilaya: '',
    },
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      setUserId(auth.user.id)
      setEmail(auth.user.email ?? '')
      const { data: userRow } = await supabase
        .from('users')
        .select('full_name, phone, wilaya, created_at')
        .eq('id', auth.user.id)
        .single()
      const { data: ownerRow } = await supabase
        .from('owner_profiles')
        .select('business_name, bio, is_verified')
        .eq('user_id', auth.user.id)
        .single()
      if (userRow) {
        form.reset({
          full_name: userRow.full_name ?? '',
          phone: userRow.phone ?? '',
          wilaya: userRow.wilaya ?? '',
          business_name: ownerRow?.business_name ?? '',
          bio: ownerRow?.bio ?? '',
        })
        setMemberSince(userRow.created_at ?? '')
      }
      setVerified(Boolean(ownerRow?.is_verified))
    }
    void load()
  }, [form])

  const submit = form.handleSubmit(async (values) => {
    const supabase = createClient()
    const { error: uErr } = await supabase
      .from('users')
      .update({
        full_name: values.full_name,
        phone: values.phone || null,
        wilaya: values.wilaya || null,
      })
      .eq('id', userId)
    if (uErr) return toast.error(uErr.message)
    const { error: oErr } = await supabase.from('owner_profiles').upsert(
      {
        user_id: userId,
        business_name: values.business_name,
        bio: values.bio || null,
      },
      { onConflict: 'user_id' }
    )
    if (oErr) return toast.error(oErr.message)
    toast.success('Profile updated.')
  })

  return (
    <div>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
        <h1 className="font-bold text-lg mb-6">Business information</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Business name</Label>
            <Input {...form.register('business_name')} className="mt-1" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={4} {...form.register('bio')} className="mt-1" placeholder="Describe your business…" />
          </div>
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
            <Select value={form.watch('wilaya') || ''} onValueChange={(v) => form.setValue('wilaya', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {WILAYAS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(
              'bg-[#1A1A2E] hover:bg-[#2D2D4E] rounded-xl transition-all active:scale-[0.98]',
              form.formState.isSubmitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Save changes'
            )}
          </Button>
        </form>
      </div>

      <div className="mt-4">
        {verified ? (
          <div className="bg-[#D1FAE5] border border-[#BBF7D0] rounded-2xl p-5 flex items-center gap-3">
            <span className="text-[#059669] text-2xl">✓</span>
            <p className="font-semibold text-[#065F46]">Verified owner account</p>
          </div>
        ) : (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-5 flex gap-3">
            <span className="text-[#D97706] text-xl">!</span>
            <div>
              <p className="font-semibold text-[#92400E]">Account pending verification</p>
              <p className="text-sm text-[#92400E] mt-1">Our team will verify your account within 24-48 hours.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-4">
        <h2 className="font-bold mb-4">Account information</h2>
        <div className="text-sm space-y-3">
          <div>
            <p className="text-[#6B7280]">Email</p>
            <p className="inline-flex items-center gap-2 mt-1">
              <Lock size={14} className="text-[#6B7280]" />
              {email}
            </p>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Member since</span>
            <span>{memberSince ? formatDate(memberSince) : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280]">Account type</span>
            <span className="px-2 py-1 bg-[#EEF2FF] text-[#3730A3] rounded-md text-xs font-medium">Hall owner</span>
          </div>
        </div>
      </div>
    </div>
  )
}

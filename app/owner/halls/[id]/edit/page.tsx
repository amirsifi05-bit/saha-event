'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { WILAYAS } from '@/lib/auth/wilayas'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const AMENITY_OPTIONS = [
  'Air Conditioning',
  'Professional Sound System',
  'Private Parking',
  'On-site Catering',
  'Professional Stage',
  'Projector & Screen',
  'WiFi',
  'Dressing Rooms',
  'VIP Lounge',
  'Garden Area',
  'HD Lighting',
  'On-site Chef',
  'Security Staff',
  'Wheelchair Access',
] as const

const schema = z.object({
  name: z.string().min(3),
  wilaya: z.string().min(1),
  address: z.string().min(5),
  capacity: z.number().min(10).max(5000),
  description: z.string().min(20).max(1000),
  amenities: z.array(z.string()).min(1),
  price_per_day: z.number().min(1000),
})

type FormValues = z.infer<typeof schema>

export default function EditHallPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      wilaya: '',
      address: '',
      capacity: 100,
      description: '',
      amenities: [],
      price_per_day: 1000,
    },
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('event_halls').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error('Could not load hall')
        router.push('/owner/halls')
        return
      }
      form.reset({
        name: data.name,
        wilaya: data.wilaya,
        address: data.address,
        capacity: data.capacity,
        description: data.description ?? '',
        amenities: (data.amenities as string[]) ?? [],
        price_per_day: data.price_per_day,
      })
      setLoading(false)
    }
    void load()
  }, [id, form, router])

  function toggleAmenity(a: string) {
    const cur = form.getValues('amenities')
    if (cur.includes(a)) form.setValue(
      'amenities',
      cur.filter((x) => x !== a)
    )
    else form.setValue('amenities', [...cur, a])
  }

  const submit = form.handleSubmit(async (values) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const slug = values.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 60)
    const { error } = await supabase
      .from('event_halls')
      .update({
        name: values.name,
        slug,
        wilaya: values.wilaya,
        address: values.address,
        capacity: values.capacity,
        description: values.description,
        amenities: values.amenities,
        price_per_day: values.price_per_day,
      })
      .eq('id', id)
      .eq('owner_id', user.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Hall updated.')
    router.push(`/owner/halls/${id}`)
  })

  if (loading) return <p className="text-sm text-[#6B7280]">Loading...</p>

  const cap = form.watch('capacity')
  const price = form.watch('price_per_day')

  return (
    <div className="max-w-2xl">
      <Link href={`/owner/halls/${id}`} className="text-sm text-[#6B7280] hover:underline">
        Cancel
      </Link>
      <h1 className="font-bold text-2xl mt-4">Edit hall</h1>
      <form onSubmit={submit} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6 space-y-4">
        <div>
          <Label>Hall name</Label>
          <Input {...form.register('name')} className="mt-1" />
        </div>
        <div>
          <Label>Wilaya</Label>
          <Select value={form.watch('wilaya')} onValueChange={(v) => form.setValue('wilaya', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              {WILAYAS.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Address</Label>
          <Input {...form.register('address')} className="mt-1" />
        </div>
        <div>
          <Label>Capacity</Label>
          <div className="flex items-center gap-2 mt-1">
            <Button type="button" variant="outline" onClick={() => form.setValue('capacity', Math.max(10, cap - 10))}>-</Button>
            <Input type="number" className="w-24 text-center" {...form.register('capacity', { valueAsNumber: true })} />
            <Button type="button" variant="outline" onClick={() => form.setValue('capacity', Math.min(5000, cap + 10))}>+</Button>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={5} {...form.register('description')} className="mt-1" />
        </div>
        <div>
          <Label>Amenities</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {AMENITY_OPTIONS.map((a) => {
              const sel = form.watch('amenities').includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm text-left',
                    sel ? 'border-2 border-[#1A1A2E] bg-[#F0F0F6]' : 'border border-[#E5E7EB]'
                  )}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <Label>Price per day (DA)</Label>
          <Input type="number" min={1000} step={1000} {...form.register('price_per_day', { valueAsNumber: true })} className="mt-1" />
          <p className="text-sm text-[#E8B86D] mt-1">{formatPrice(price)} per day</p>
        </div>
        <div className="flex gap-3">
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
          <Link href={`/owner/halls/${id}`}>
            <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

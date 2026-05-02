'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Check, Info, Loader2, Upload } from 'lucide-react'
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

const step1Schema = z.object({
  name: z.string().min(3, 'Hall name must be at least 3 characters'),
  wilaya: z.string().min(1, 'Please select a wilaya'),
  address: z.string().min(5, 'Please enter the full address'),
  capacity: z.number().min(10, 'Minimum capacity is 10').max(5000),
  description: z.string().min(20, 'Please write at least 20 characters').max(1000),
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
})

const step3Schema = z.object({
  price_per_day: z.number().min(1000, 'Minimum price is 1,000 DA'),
})

type Step1Values = z.infer<typeof step1Schema>
type Step3Values = z.infer<typeof step3Schema>

export default function NewHallPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [slug, setSlug] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [pricePerDay, setPricePerDay] = useState(1000)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      wilaya: '',
      address: '',
      capacity: 100,
      description: '',
      amenities: [],
    },
  })

  const watchedName = form1.watch('name')
  useEffect(() => {
    const s = watchedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 60)
    setSlug(s)
  }, [watchedName])

  useEffect(() => {
    return () => {
      photoUrls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [photoUrls])

  function addPhotoFiles(files: FileList | null) {
    if (!files?.length) return
    const next: File[] = [...photos]
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    for (let i = 0; i < files.length && next.length < 10; i++) {
      const f = files[i]
      if (!allowed.includes(f.type) || f.size > 10 * 1024 * 1024) continue
      next.push(f)
    }
    setPhotos(next)
    setPhotoUrls(next.map((f) => URL.createObjectURL(f)))
    if (coverIndex >= next.length) setCoverIndex(0)
  }

  function removePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i)
    setPhotos(next)
    URL.revokeObjectURL(photoUrls[i] ?? '')
    setPhotoUrls(next.map((f) => URL.createObjectURL(f)))
    if (coverIndex >= next.length) setCoverIndex(Math.max(0, next.length - 1))
    else if (coverIndex === i) setCoverIndex(0)
  }

  function toggleAmenity(a: string) {
    const cur = form1.getValues('amenities')
    if (cur.includes(a)) form1.setValue(
      'amenities',
      cur.filter((x) => x !== a)
    )
    else form1.setValue('amenities', [...cur, a])
  }

  const capacity = form1.watch('capacity')

  async function handlePublish() {
    const v3 = step3Schema.safeParse({ price_per_day: pricePerDay })
    if (!v3.success) {
      toast.error(v3.error.issues[0]?.message ?? 'Invalid price')
      return
    }
    if (photos.length === 0) {
      toast.error('Add at least one photo.')
      return
    }

    const s1 = form1.getValues()
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: hall, error: hallError } = await supabase
        .from('event_halls')
        .insert({
          owner_id: user.id,
          name: s1.name,
          slug: slug || 'hall',
          wilaya: s1.wilaya,
          address: s1.address,
          capacity: s1.capacity,
          price_per_day: pricePerDay,
          description: s1.description,
          amenities: s1.amenities,
          status: 'active',
        })
        .select()
        .single()

      if (hallError) throw hallError

      const uploadedUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const path = `${user.id}/${hall.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('hall-photos').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('hall-photos').getPublicUrl(path)
          uploadedUrls.push(urlData.publicUrl)
        }
      }

      if (uploadedUrls.length > 0) {
        await supabase.from('hall_photos').insert(
          uploadedUrls.map((url, i) => ({
            hall_id: hall.id,
            url,
            is_cover: i === coverIndex,
            sort_order: i,
          }))
        )
      }

      toast.success('Hall published! It is now live on Saha-Event.')
      router.push(`/owner/halls/${hall.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = ['Hall Info', 'Photos', 'Pricing', 'Review & Publish'] as const

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-bold text-2xl text-[#1A1A2E]">Add new hall</h1>

      <div className="sticky top-16 bg-[#F7F8FA] z-20 py-4 -mx-4 px-4 border-b border-[#E5E7EB] mt-4">
        <div className="flex items-center max-w-3xl">
          {steps.map((label, idx) => {
            const n = idx + 1
            const done = n < step
            const current = n === step
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      done && 'bg-[#1A1A2E] text-white',
                      current && 'bg-[#E8B86D] text-[#1A1A2E] font-bold ring-2 ring-[#E8B86D] ring-offset-2',
                      !done && !current && 'border-2 border-[#E5E7EB] text-[#9CA3AF]'
                    )}
                  >
                    {done ? <Check size={14} /> : n}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-[#6B7280] mt-1 text-center max-w-[72px]">{label}</span>
                </div>
                {idx < steps.length - 1 ? (
                  <div className={cn('flex-1 h-0.5 mx-1', n < step ? 'bg-[#1A1A2E]' : 'bg-[#E5E7EB]')} />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {step === 1 ? (
        <form
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6 space-y-4"
          onSubmit={form1.handleSubmit(() => setStep(2))}
        >
          <div>
            <Label>Hall name</Label>
            <Input {...form1.register('name')} placeholder="Salle Al Farah" className="mt-1" />
            {form1.formState.errors.name ? <p className="text-sm text-red-600 mt-1">{form1.formState.errors.name.message}</p> : null}
            <p className="text-xs text-[#9CA3AF] mt-1">Your hall URL: saha-event.com/halls/{slug || '...'}</p>
          </div>
          <div>
            <Label>Wilaya</Label>
            <Select value={form1.watch('wilaya')} onValueChange={(v) => form1.setValue('wilaya', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select wilaya" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {WILAYAS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form1.formState.errors.wilaya ? <p className="text-sm text-red-600 mt-1">{form1.formState.errors.wilaya.message}</p> : null}
          </div>
          <div>
            <Label>Full address</Label>
            <Input {...form1.register('address')} placeholder="12 Rue des Fleurs, Hydra" className="mt-1" />
            {form1.formState.errors.address ? <p className="text-sm text-red-600 mt-1">{form1.formState.errors.address.message}</p> : null}
          </div>
          <div>
            <Label>Capacity</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button type="button" variant="outline" onClick={() => form1.setValue('capacity', Math.max(10, capacity - 10))}>-</Button>
              <Input
                type="number"
                className="text-center w-24"
                {...form1.register('capacity', { valueAsNumber: true })}
              />
              <Button type="button" variant="outline" onClick={() => form1.setValue('capacity', Math.min(5000, capacity + 10))}>+</Button>
            </div>
            {form1.formState.errors.capacity ? <p className="text-sm text-red-600 mt-1">{form1.formState.errors.capacity.message}</p> : null}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={5} {...form1.register('description')} className="mt-1" maxLength={1000} />
            <p className="text-xs text-[#9CA3AF] text-right">{form1.watch('description').length}/1000</p>
            {form1.formState.errors.description ? <p className="text-sm text-red-600">{form1.formState.errors.description.message}</p> : null}
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {AMENITY_OPTIONS.map((a) => {
                const sel = form1.watch('amenities').includes(a)
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm text-left transition',
                      sel ? 'border-2 border-[#1A1A2E] bg-[#F0F0F6] text-[#1A1A2E] font-medium' : 'border border-[#E5E7EB] text-[#374151] bg-white'
                    )}
                  >
                    {a}
                  </button>
                )
              })}
            </div>
            {form1.formState.errors.amenities ? <p className="text-sm text-red-600 mt-1">{form1.formState.errors.amenities.message}</p> : null}
          </div>
          <Button
            type="submit"
            disabled={form1.formState.isSubmitting}
            className={cn(
              'w-full bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl transition-all active:scale-[0.98]',
              form1.formState.isSubmitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {form1.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Continue →'
            )}
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6">
          <h2 className="font-bold text-lg">Add photos of your hall</h2>
          <p className="text-sm text-[#6B7280] mt-1">High-quality photos attract more clients. Add at least 1 photo.</p>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              addPhotoFiles(e.dataTransfer.files)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer mt-4 transition',
              dragOver ? 'border-[#E8B86D] bg-[#FFFBEB]' : 'border-[#D1D5DB] hover:border-[#1A1A2E] hover:bg-[#F7F8FA]'
            )}
          >
            <Upload size={40} className="text-[#9CA3AF] mx-auto" />
            <p className="font-medium mt-3">Drop images or click to browse</p>
            <p className="text-xs text-[#9CA3AF] mt-2">JPEG, PNG, WebP — max 10MB each, up to 10 photos</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => addPhotoFiles(e.target.files)}
          />
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {photos.map((f, i) => (
                <div key={`${f.name}-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={photoUrls[i] ?? ''} alt="" fill sizes="33vw" className="object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-[#374151] hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      removePhoto(i)
                    }}
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCoverIndex(i)
                    }}
                    className={cn(
                      'absolute bottom-1 left-1 text-xs px-2 py-1 rounded-full',
                      coverIndex === i ? 'bg-[#E8B86D] text-[#1A1A2E] font-semibold' : 'bg-white/80 text-[#374151]'
                    )}
                  >
                    {coverIndex === i ? '★ Cover' : 'Set cover'}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl" onClick={() => setStep(3)}>
              Continue →
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6 space-y-6">
          <div>
            <Label>Price per day (DA)</Label>
            <Input
              type="number"
              min={1000}
              step={1000}
              value={pricePerDay}
              onChange={(e) => setPricePerDay(Number(e.target.value) || 0)}
              className="mt-2 text-center text-3xl font-bold h-16"
              placeholder="85000"
            />
            <p className="text-center text-[#E8B86D] font-semibold mt-2">= {formatPrice(pricePerDay)} per day</p>
          </div>
          <div className="bg-[#F7F8FA] rounded-2xl p-5">
            <p className="text-sm font-semibold text-[#1A1A2E]">Market pricing guide</p>
            <ul className="text-sm text-[#6B7280] mt-3 space-y-2">
              <li className={capacity <= 150 ? 'font-semibold text-[#1A1A2E]' : ''}>Small halls (≤150 guests): 30,000 – 60,000 DA / day</li>
              <li className={capacity <= 300 && capacity > 150 ? 'font-semibold text-[#1A1A2E]' : ''}>Medium halls (≤300 guests): 60,000 – 100,000 DA / day</li>
              <li className={capacity > 300 ? 'font-semibold text-[#1A1A2E]' : ''}>Large halls (500+ guests): 100,000 – 200,000 DA / day</li>
            </ul>
          </div>
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex gap-2 text-sm text-[#1E40AF]">
            <Info size={16} className="flex-shrink-0 mt-0.5" />
            Saha-Event adds a 5% service fee on top of your listed price. Clients see the total (your price + fee) at checkout.
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl" onClick={() => setStep(4)}>
              Continue →
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6">
          <h2 className="font-bold text-lg">Review your hall listing</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E]">
              {photoUrls[coverIndex] ? (
                <Image src={photoUrls[coverIndex]} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              ) : null}
            </div>
            <div className="text-sm space-y-2">
              <p className="font-bold text-xl text-[#1A1A2E]">{form1.getValues('name')}</p>
              <p className="text-[#6B7280]">
                <span className="inline-block bg-[#F3F4F6] px-2 py-0.5 rounded text-xs">{form1.getValues('wilaya')}</span>{' '}
                {form1.getValues('address')}
              </p>
              <p>
                {form1.getValues('capacity')} guests · {formatPrice(pricePerDay)}/day
              </p>
              <p className="text-[#6B7280]">
                {(form1.getValues('amenities') ?? []).slice(0, 6).join(', ')}
                {(form1.getValues('amenities') ?? []).length > 6
                  ? ` +${(form1.getValues('amenities') ?? []).length - 6} more`
                  : ''}
              </p>
              <p className="text-[#4B5563] line-clamp-4">{form1.getValues('description').slice(0, 150)}...</p>
            </div>
          </div>
          <Button
            className={`w-full mt-6 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
            onClick={handlePublish}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Publish Hall Listing'
            )}
          </Button>
          <p className="text-xs text-[#9CA3AF] text-center mt-2">
            After publishing, clients can immediately find and book your hall.
          </p>
          <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setStep(3)}>
            ← Back
          </Button>
        </div>
      ) : null}
    </div>
  )
}

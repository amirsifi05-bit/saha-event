'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Check, CheckCircle2, Clock, FileText, Loader2, MapPin, Upload, AlertCircle, AlertTriangle } from 'lucide-react'
import { differenceInDays, format, isBefore, isWithinInterval, parseISO, startOfToday } from 'date-fns'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { calcPrice, cn, formatDate, formatPrice, getInitials } from '@/lib/utils'

const step1Schema = (capacity: number) =>
  z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().min(9, 'Phone must be at least 9 characters'),
    guestCount: z.number().min(1).max(capacity),
    specialRequests: z.string().optional(),
  })

type Hall = {
  id: string
  owner_id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  hall_photos: { url: string; is_cover: boolean }[]
}

type Range = { from: string; to: string }

export default function BookingWizard({
  hall,
  userId,
  userEmail,
  userFullName,
  userPhone,
  unavailableRanges,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  hall: Hall
  userId: string
  userEmail: string
  userFullName: string
  userPhone: string
  unavailableRanges: Range[]
  initialCheckIn: string
  initialCheckOut: string
  initialGuests: number
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [fullName, setFullName] = useState(userFullName)
  const [phone, setPhone] = useState(userPhone)
  const [guestCount, setGuestCount] = useState(Math.max(1, Math.min(initialGuests, hall.capacity)))
  const [specialRequests, setSpecialRequests] = useState('')

  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn ? parseISO(initialCheckIn) : null)
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut ? parseISO(initialCheckOut) : null)
  const [dateConflict, setDateConflict] = useState(false)

  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  const cover = hall.hall_photos?.find((p) => p.is_cover)?.url ?? hall.hall_photos?.[0]?.url ?? null
  const cin = checkIn ? format(checkIn, 'yyyy-MM-dd') : ''
  const cout = checkOut ? format(checkOut, 'yyyy-MM-dd') : ''
  const hasDates = Boolean(checkIn && checkOut)
  const pricing = hasDates ? calcPrice(hall.price_per_day, cin, cout) : null

  function isUnavailable(date: Date) {
    if (isBefore(date, startOfToday())) return true
    return unavailableRanges.some((range) => {
      try {
        return isWithinInterval(date, {
          start: parseISO(range.from),
          end: parseISO(range.to),
        })
      } catch {
        return false
      }
    })
  }

  function validateStep1() {
    const schema = step1Schema(hall.capacity)
    const result = schema.safeParse({ fullName, phone, guestCount, specialRequests })
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message
      })
      setStepErrors(errs)
      return false
    }
    setStepErrors({})
    return true
  }

  function validateStep2() {
    if (!checkIn || !checkOut) {
      setStepErrors({ dates: 'Please choose a date range.' })
      return false
    }
    if (checkOut <= checkIn) {
      setStepErrors({ dates: 'Check-out must be after check-in.' })
      return false
    }
    if (dateConflict) {
      setStepErrors({ dates: 'These dates overlap an unavailable period.' })
      return false
    }
    setStepErrors({})
    return true
  }

  function onRangeSelect(range: { from?: Date; to?: Date } | undefined) {
    if (!range?.from) return
    setCheckIn(range.from)
    setCheckOut(range.to ?? null)

    if (range.to) {
      const conflict = unavailableRanges.some((r) => {
        const s = parseISO(r.from)
        const e = parseISO(r.to)
        return isWithinInterval(range.from!, { start: s, end: e }) || isWithinInterval(range.to!, { start: s, end: e })
      })
      setDateConflict(conflict)
    } else {
      setDateConflict(false)
    }
  }

  function pickFile(file: File | null) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setStepErrors({ upload: 'File too large. Maximum 5MB.' })
      return
    }
    const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
    if (!ok) {
      setStepErrors({ upload: 'Only PDF, JPG, and PNG files are accepted.' })
      return
    }
    setStepErrors({})
    setReceiptFile(file)
    setReceiptUrl(null)
    setUploadProgress(0)
  }

  async function handleUpload() {
    if (!receiptFile) return
    setIsUploading(true)
    setUploadProgress(0)
    const supabase = createClient()
    const path = `${userId}/${Date.now()}_${receiptFile.name.replace(/\s+/g, '_')}`
    const progressInterval = window.setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85))
    }, 200)
    const { error } = await supabase.storage.from('ccp-receipts').upload(path, receiptFile, { upsert: true })
    clearInterval(progressInterval)
    if (error) {
      setUploadProgress(0)
      toast.error('Upload failed. Please try again.')
      setIsUploading(false)
      return
    }
    setUploadProgress(100)
    const { data } = supabase.storage.from('ccp-receipts').getPublicUrl(path)
    setReceiptUrl(data.publicUrl)
    setIsUploading(false)
  }

  async function handleSubmit() {
    if (!receiptUrl || !checkIn || !checkOut) return
    setIsSubmitting(true)
    const supabase = createClient()
    const cinIso = format(checkIn, 'yyyy-MM-dd')
    const coutIso = format(checkOut, 'yyyy-MM-dd')
    const nights = differenceInDays(checkOut, checkIn)
    const subtotal = nights * hall.price_per_day
    const serviceFee = Math.round(subtotal * 0.05)
    const totalPrice = subtotal + serviceFee
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        client_id: userId,
        hall_id: hall.id,
        owner_id: hall.owner_id,
        check_in: cinIso,
        check_out: coutIso,
        guest_count: guestCount,
        subtotal,
        service_fee: serviceFee,
        total_price: totalPrice,
        status: 'pending',
        receipt_url: receiptUrl,
        special_requests: specialRequests || null,
      })
      .select()
      .single()

    if (error) {
      toast.error('Booking failed. Please try again.')
      setIsSubmitting(false)
      return
    }
    router.push(`/client/reservations/${data.id}/confirmed`)
  }

  const ratingDatesText = useMemo(() => {
    if (!checkIn || !checkOut) return ''
    return `${formatDate(format(checkIn, 'yyyy-MM-dd'))} -> ${formatDate(format(checkOut, 'yyyy-MM-dd'))}`
  }, [checkIn, checkOut])

  return (
    <div>
      <div className="sticky top-16 bg-white border-b z-40 py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center">
          <Stepper step={step} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8 items-start">
        <div className="flex-1">
          {step === 1 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6">
              <h2 className="font-bold text-xl text-[#1A1A2E]">Your details</h2>
              <p className="text-sm text-[#6B7280] mt-1">Confirm your contact information</p>

              <div className="mt-6 space-y-4">
                <Field label="Full name" value={fullName} onChange={setFullName} />
                {stepErrors.fullName ? <ErrorText text={stepErrors.fullName} /> : null}

                <div>
                  <Label className="mb-1.5 block text-[13px] font-medium text-[#374151]">Email</Label>
                  <Input value={userEmail} readOnly className="bg-[#F7F8FA] h-11" />
                  <p className="text-xs text-[#9CA3AF] mt-1">Contact support to change your email</p>
                </div>

                <Field label="Phone number" value={phone} onChange={setPhone} placeholder="+213 6XX XXX XXX" />
                {stepErrors.phone ? <ErrorText text={stepErrors.phone} /> : null}

                <div>
                  <Label className="mb-1.5 block text-[13px] font-medium text-[#374151]">Number of guests</Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={guestCount === 1}
                      onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                      className="w-10 h-10 border rounded-xl disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="text-lg font-bold w-10 text-center">{guestCount}</div>
                    <button
                      type="button"
                      disabled={guestCount >= hall.capacity}
                      onClick={() => setGuestCount((g) => Math.min(hall.capacity, g + 1))}
                      className="w-10 h-10 border rounded-xl disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-2">Maximum capacity: {hall.capacity} guests</p>
                  {guestCount > hall.capacity ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2 text-sm text-red-600 flex gap-2">
                      <AlertCircle size={14} /> Exceeds maximum capacity
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label className="mb-1.5 block text-[13px] font-medium text-[#374151]">Special requests (optional)</Label>
                  <Textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. extra chairs, stage setup, microphone for speeches..."
                    className="rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (!validateStep1()) return
                  setStep(2)
                }}
                className="mt-6 w-full bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl"
              >
                Continue →
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6">
              <h2 className="font-bold text-xl text-[#1A1A2E]">Select your dates</h2>
              <p className="text-sm text-[#6B7280] mt-1">Choose your check-in and check-out dates</p>

              <div className="mt-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full text-left border rounded-xl p-3 text-sm text-[#374151]">
                      {checkIn && checkOut ? `${formatDate(format(checkIn, 'yyyy-MM-dd'))} - ${formatDate(format(checkOut, 'yyyy-MM-dd'))}` : 'Pick date range'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      selected={{ from: checkIn ?? undefined, to: checkOut ?? undefined }}
                      onSelect={onRangeSelect}
                      disabled={isUnavailable}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-6 mt-4 text-xs text-[#6B7280]">
                  <span>[blue circle] Selected range</span>
                  <span>[gray strikethrough] Unavailable dates</span>
                </div>
                {checkIn && checkOut && !dateConflict ? (
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mt-4 text-sm text-[#065F46] font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {differenceInDays(checkOut, checkIn)} nights: {ratingDatesText}
                  </div>
                ) : null}
                {dateConflict ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-red-600 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} /> These dates overlap an unavailable period.
                    </div>
                    <p className="mt-1">Please select different dates.</p>
                  </div>
                ) : null}
                {stepErrors.dates ? <ErrorText text={stepErrors.dates} /> : null}
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!validateStep2()) return
                    setStep(3)
                  }}
                  disabled={!checkIn || !checkOut || dateConflict}
                  className="bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl"
                >
                  Continue →
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mt-6">
              <h2 className="font-bold text-xl text-[#1A1A2E]">Upload your CCP receipt</h2>
              <p className="text-sm text-[#6B7280] mt-1">Proof of payment required to complete your booking</p>

              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mt-6 text-sm text-[#1E40AF]">
                Upload your CCP bank transfer receipt. The hall owner will review it and confirm your booking within 24 hours.
              </div>

              {!receiptFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    pickFile(e.dataTransfer.files?.[0] ?? null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  className={cn(
                    'border-2 border-dashed border-[#D1D5DB] rounded-2xl p-12 text-center cursor-pointer hover:border-[#1A1A2E] hover:bg-[#F7F8FA] transition-all duration-150 mt-6',
                    dragOver && 'border-[#E8B86D] bg-[#FFFBEB]'
                  )}
                >
                  <Upload size={40} className="text-[#9CA3AF] mx-auto" />
                  <p className="font-medium text-[#374151] mt-3 text-base">Drag your receipt here</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">or click to browse files</p>
                  <p className="text-xs text-[#9CA3AF] mt-2">PDF, JPG, PNG — max 5MB</p>
                </div>
              ) : (
                <div className="border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-4 mt-6">
                  <div>
                    {receiptFile.type === 'application/pdf' ? (
                      <FileText size={36} className="text-[#6B7280]" />
                    ) : (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image src={URL.createObjectURL(receiptFile)} alt="Receipt preview" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{receiptFile.name}</div>
                    <div className="text-xs text-[#9CA3AF]">{(receiptFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  <button
                    type="button"
                    className="text-[#9CA3AF] hover:text-red-500"
                    onClick={() => {
                      setReceiptFile(null)
                      setReceiptUrl(null)
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              {stepErrors.upload ? <ErrorText text={stepErrors.upload} /> : null}

              {receiptFile && !receiptUrl ? (
                <Button type="button" className="w-full mt-4 rounded-xl bg-[#1A1A2E] hover:bg-[#2D2D4E]" onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : 'Upload receipt'}
                </Button>
              ) : null}
              {isUploading || uploadProgress > 0 ? (
                <div className="mt-3">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-[#6B7280] text-center mt-1">{uploadProgress}% uploaded</p>
                </div>
              ) : null}
              {receiptUrl ? (
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mt-3 text-sm text-[#065F46]">
                  <div className="font-semibold flex items-center gap-2"><CheckCircle2 size={20} /> Receipt uploaded successfully!</div>
                  <button type="button" className="text-xs underline text-[#6B7280] mt-1" onClick={() => { setReceiptFile(null); setReceiptUrl(null); }}>Change file</button>
                </div>
              ) : null}

              {pricing ? (
                <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-5 mt-6 text-sm">
                  <Row label="Hall:" value={hall.name} />
                  <Row label="Check-in:" value={formatDate(format(checkIn!, 'yyyy-MM-dd'))} />
                  <Row label="Check-out:" value={formatDate(format(checkOut!, 'yyyy-MM-dd'))} />
                  <Row label="Duration:" value={`${pricing.nights} nights`} />
                  <Row label="Guests:" value={String(guestCount)} />
                  <div className="border-t border-[#E5E7EB] my-3" />
                  <Row label="Subtotal:" value={formatPrice(pricing.subtotal)} />
                  <Row label="Service fee:" value={formatPrice(pricing.serviceFee)} />
                  <div className="border-t border-[#E5E7EB] my-3" />
                  <Row label="Total:" value={formatPrice(pricing.total)} bold />
                </div>
              ) : null}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                  ← Back
                </Button>
                <Button
                  type="button"
                  disabled={!receiptUrl || isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 ml-3 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm booking'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="w-[320px] hidden lg:block sticky top-36 bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <div className="relative h-28 rounded-xl overflow-hidden">
            {cover ? (
              <Image src={cover} alt={hall.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center text-white/40">
                {getInitials(hall.name)}
              </div>
            )}
          </div>
          <div className="font-bold text-sm mt-3 line-clamp-1">{hall.name}</div>
          <div className="text-xs text-[#6B7280] mt-1 inline-flex items-center gap-1">
            <MapPin size={12} />
            {hall.wilaya}
          </div>

          <div className="border-t border-[#E5E7EB] my-4" />
          {pricing ? (
            <>
              <Row label={`${formatPrice(hall.price_per_day)} × ${pricing.nights} night(s)`} value={formatPrice(pricing.subtotal)} />
              <Row label="Service fee (5%)" value={formatPrice(pricing.serviceFee)} />
              <div className="border-t mt-2 pt-2" />
              <Row label="Total" value={formatPrice(pricing.total)} bold />
            </>
          ) : (
            <p className="text-xs text-[#9CA3AF] italic text-center">Select your dates to see the total</p>
          )}
          <p className="text-xs text-[#9CA3AF] text-center mt-3">You won&apos;t be charged until confirmed.</p>
          <p className="text-xs text-[#059669] flex items-center gap-1 justify-center mt-1">
            <CheckCircle2 size={13} /> Free cancellation
          </p>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-[13px] font-medium text-[#374151]">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11" />
    </div>
  )
}

function ErrorText({ text }: { text: string }) {
  return <p className="text-sm text-red-600 mt-1">{text}</p>
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Your details', 'Select dates', 'Upload receipt'] as const
  return (
    <div className="w-full flex items-center">
      {labels.map((label, idx) => {
        const i = (idx + 1) as 1 | 2 | 3
        const done = i < step
        const current = i === step
        return (
          <div className="flex items-center flex-1" key={label}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                done && 'bg-[#1A1A2E] text-white',
                current && 'bg-[#E8B86D] text-[#1A1A2E] font-bold ring-2 ring-[#E8B86D] ring-offset-2',
                !done && !current && 'border-2 border-[#E5E7EB] text-[#9CA3AF]'
              )}>
                {done ? <Check size={14} /> : i}
              </div>
              <span className="text-xs font-medium text-[#6B7280] mt-2">{label}</span>
            </div>
            {idx < labels.length - 1 ? (
              <div className={cn('flex-1 h-0.5 mx-2', i < step ? 'bg-[#1A1A2E]' : 'bg-[#E5E7EB]')} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className={cn(bold ? 'font-bold text-[#1A1A2E]' : 'text-[#6B7280]')}>{label}</span>
      <span className={cn('text-[#1A1A2E]', bold && 'font-bold text-base')}>{value}</span>
    </div>
  )
}


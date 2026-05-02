'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn, getInitials } from '@/lib/utils'

type Reservation = {
  id: string
  hall_id: string
  event_halls:
    | {
        name: string
        hall_photos: { url: string; is_cover: boolean }[]
      }
    | {
        name: string
        hall_photos: { url: string; is_cover: boolean }[]
      }[]
    | null
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [userId, setUserId] = useState('')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) {
        router.push('/auth/signin')
        return
      }
      setUserId(uid)
      const { data } = await supabase
        .from('reservations')
        .select('id, hall_id, event_halls(name, hall_photos(url, is_cover))')
        .eq('id', id)
        .eq('client_id', uid)
        .single()
      setReservation(data as Reservation | null)
      setLoading(false)
    }
    void load()
  }, [id, router])

  async function submit() {
    setTouched(true)
    if (rating === 0 || !reservation) return
    const hall = Array.isArray(reservation.event_halls) ? reservation.event_halls[0] : reservation.event_halls
    if (!hall) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reviews').insert({
        reservation_id: id,
        client_id: userId,
        hall_id: reservation.hall_id,
        rating,
        comment: comment || null,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Thank you for your review!')
      router.push('/client/reservations')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-xl mx-auto px-4 py-8 text-sm text-[#6B7280]">Loading...</div>
  const hall = reservation ? (Array.isArray(reservation.event_halls) ? reservation.event_halls[0] : reservation.event_halls) : null
  const cover = hall?.hall_photos?.find((p) => p.is_cover)?.url ?? hall?.hall_photos?.[0]?.url ?? null

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/client/reservations/${id}`} className="text-sm underline text-[#6B7280]">
        ← Back to reservation
      </Link>
      <h1 className="font-bold text-2xl mt-4">Write a review</h1>
      <p className="text-[#6B7280] mt-1">{hall?.name}</p>
      <div className="h-28 w-full rounded-2xl mt-4 relative overflow-hidden">
        {cover ? (
          <Image src={cover} alt={hall?.name ?? ''} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
        ) : <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center text-white/40 text-2xl font-bold">{getInitials(hall?.name ?? 'Hall')}</div>}
      </div>

      <div className="mt-8">
        <label className="font-semibold">Your rating *</label>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(i)} className="cursor-pointer transition-colors">
              <Star size={36} className={i <= (hovered || rating) ? 'text-[#E8B86D] fill-[#E8B86D]' : 'text-[#D1D5DB]'} />
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-[#E8B86D] mt-2 h-5">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</p>
      </div>

      <div className="mt-6">
        <Textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} placeholder="Share your experience..." maxLength={500} className="rounded-xl" />
        <p className="text-xs text-[#9CA3AF] text-right mt-1">{comment.length}/500</p>
      </div>
      {touched && rating === 0 ? <p className="text-sm text-red-600 mt-2">Please select a rating.</p> : null}

      <Button
        type="button"
        onClick={submit}
        disabled={rating === 0 || submitting}
        className={cn(
          'w-full mt-6 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl transition-all active:scale-[0.98]',
          submitting && 'opacity-70 cursor-not-allowed'
        )}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </span>
        ) : (
          'Submit review'
        )}
      </Button>
      <Link href={`/client/reservations/${id}`} className="text-sm text-[#6B7280] underline text-center block mt-3">
        Skip for now
      </Link>
    </div>
  )
}


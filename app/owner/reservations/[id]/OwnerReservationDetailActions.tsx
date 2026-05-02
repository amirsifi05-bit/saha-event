'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ReservationStatus } from '@/types/database'

export default function OwnerReservationDetailActions({
  reservationId,
  hallSlug,
  status,
  checkOut,
}: {
  reservationId: string
  hallSlug: string
  status: ReservationStatus
  checkOut: string
}) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<null | 'confirm' | 'reject' | 'complete'>(null)

  const today = new Date().toISOString().split('T')[0] ?? ''
  const canComplete = status === 'confirmed' && checkOut < today

  async function confirm() {
    setBusy('confirm')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', reservationId)
      if (error) return toast.error(error.message)
      toast.success('Booking confirmed! Client has been notified.')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function reject() {
    setBusy('reject')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'rejected', owner_response: reason.trim() || null })
        .eq('id', reservationId)
      if (error) return toast.error(error.message)
      setRejectOpen(false)
      setReason('')
      toast.success('Booking rejected.')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function markCompleted() {
    setBusy('complete')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reservations').update({ status: 'completed' }).eq('id', reservationId)
      if (error) return toast.error(error.message)
      toast.success('Marked as completed.')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mt-4">
        {status === 'pending' ? (
          <>
            <Button
              type="button"
              disabled={busy !== null}
              className={cn(
                'w-full bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] rounded-xl transition-all active:scale-[0.98]',
                busy !== null && 'opacity-70 cursor-not-allowed'
              )}
              onClick={confirm}
            >
              {busy === 'confirm' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </span>
              ) : (
                'Confirm booking'
              )}
            </Button>
            <Button variant="outline" className="w-full mt-2 border-red-200 text-red-600" onClick={() => setRejectOpen(true)}>
              Reject booking
            </Button>
          </>
        ) : null}
        {status === 'confirmed' ? (
          <div className="bg-[#D1FAE5] border border-[#BBF7D0] rounded-xl p-4">
            <p className="text-sm font-medium text-[#065F46] inline-flex items-center gap-2">
              <CheckCircle2 size={18} /> Booking confirmed
            </p>
            {canComplete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null}
                className={cn('w-full mt-3 rounded-xl transition-all active:scale-[0.98]', busy !== null && 'opacity-70 cursor-not-allowed')}
                onClick={markCompleted}
              >
                {busy === 'complete' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Mark as completed'
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
        {(status === 'rejected' || status === 'cancelled') && (
          <p className="text-sm text-[#6B7280]">This booking is {status}.</p>
        )}
        {status === 'completed' ? (
          <p className="text-sm text-[#6B7280]">This booking is completed.</p>
        ) : null}
      </div>

      <Link href={`/halls/${hallSlug}`} className="text-sm text-[#1A1A2E] underline mt-4 inline-block">
        View hall listing →
      </Link>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this booking</DialogTitle>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" rows={4} className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={busy !== null}
              className={cn('bg-red-600 hover:bg-red-700', busy !== null && 'opacity-70 cursor-not-allowed')}
              onClick={reject}
            >
              {busy === 'reject' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </span>
              ) : (
                'Reject booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { isWithinInterval, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'

type BlockRow = { id: string; blocked_from: string; blocked_to: string; reason: string | null }
type ResRow = { check_in: string; check_out: string; status: string }

function inConfirmedBooking(date: Date, reservations: ResRow[]) {
  return reservations.some((r) => {
    if (r.status !== 'confirmed') return false
    try {
      return isWithinInterval(date, { start: parseISO(r.check_in), end: parseISO(r.check_out) })
    } catch {
      return false
    }
  })
}

function inBlockRange(date: Date, blocks: BlockRow[]) {
  return blocks.some((b) => {
    try {
      return isWithinInterval(date, { start: parseISO(b.blocked_from), end: parseISO(b.blocked_to) })
    } catch {
      return false
    }
  })
}

export default function HallAvailabilityPage() {
  const { id: hallId } = useParams<{ id: string }>()
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [confirmed, setConfirmed] = useState<ResRow[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [blocking, setBlocking] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from('availability_blocks').select('id, blocked_from, blocked_to, reason').eq('hall_id', hallId).order('blocked_from'),
      supabase.from('reservations').select('check_in, check_out, status').eq('hall_id', hallId).eq('status', 'confirmed'),
    ])
    setBlocks((b ?? []) as BlockRow[])
    setConfirmed((r ?? []) as ResRow[])
  }, [hallId])

  useEffect(() => {
    void load()
  }, [load])

  const today = new Date().toISOString().split('T')[0] ?? ''

  async function addBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to || to < from) {
      toast.error('Please choose valid dates (to ≥ from).')
      return
    }
    const fromD = parseISO(from)
    const toD = parseISO(to)
    let cursor = new Date(fromD)
    while (cursor <= toD) {
      if (inConfirmedBooking(cursor, confirmed)) {
        toast.error('Range overlaps a confirmed booking.')
        return
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    setBlocking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('availability_blocks').insert({
        hall_id: hallId,
        blocked_from: from,
        blocked_to: to,
        reason: reason.trim() || null,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dates blocked.')
      setReason('')
      await load()
    } finally {
      setBlocking(false)
    }
  }

  async function removeBlock(blockId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('availability_blocks').delete().eq('id', blockId)
    if (error) return toast.error(error.message)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    toast.success('Block removed')
  }

  return (
    <div>
      <Link href={`/owner/halls/${hallId}`} className="text-sm text-[#6B7280]">
        ← Hall overview
      </Link>
      <h1 className="font-bold text-2xl mt-4">Availability</h1>
      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        <div className="flex-1 overflow-x-auto">
          <Calendar
            mode="single"
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            numberOfMonths={2}
            selected={undefined}
            onSelect={() => {}}
            modifiers={{
              booked: (date) => inConfirmedBooking(date, confirmed),
              blockedManual: (date) => inBlockRange(date, blocks) && !inConfirmedBooking(date, confirmed),
            }}
            modifiersClassNames={{
              booked: 'relative after:absolute after:inset-0 after:rounded-[var(--cell-radius)] after:bg-[#FEE2E2]/90 after:z-0 !text-[#991B1B]',
              blockedManual: 'relative after:absolute after:inset-0 after:rounded-[var(--cell-radius)] after:bg-[#FEF3C7]/90 after:z-0 !text-[#92400E]',
            }}
          />
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#6B7280]">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#991B1B]" /> Confirmed booking</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Manually blocked</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Available</span>
          </div>
        </div>
        <div className="w-full lg:w-72 flex-shrink-0">
          <h2 className="font-bold">Block dates</h2>
          <form onSubmit={addBlock} className="mt-4 space-y-3">
            <div>
              <Label>From</Label>
              <Input type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" placeholder="Maintenance, private event…" />
            </div>
            <Button
              type="submit"
              disabled={blocking}
              className={cn(
                'w-full bg-[#1A1A2E] hover:bg-[#2D2D4E] rounded-xl transition-all active:scale-[0.98]',
                blocking && 'opacity-70 cursor-not-allowed'
              )}
            >
              {blocking ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </span>
              ) : (
                'Block dates'
              )}
            </Button>
          </form>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">Current blocks</h3>
            {blocks.length === 0 ? <p className="text-xs text-[#9CA3AF] mt-2">No manual blocks</p> : null}
            {blocks.map((b) => (
              <div key={b.id} className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 mt-2 relative pr-8">
                <button type="button" className="absolute top-2 right-2 text-[#92400E] hover:text-red-600 text-lg leading-none" onClick={() => removeBlock(b.id)}>
                  ×
                </button>
                <p className="font-medium text-sm">
                  {formatDate(b.blocked_from)} → {formatDate(b.blocked_to)}
                </p>
                {b.reason ? <p className="text-xs text-[#92400E] mt-1">{b.reason}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

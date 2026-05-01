'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, isBefore, parseISO, startOfToday } from 'date-fns'
import { CalendarDays, MapPin, Search, Users as UsersIcon, Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WILAYAS } from '@/lib/auth/wilayas'
import { cn } from '@/lib/utils'

interface SearchWidgetProps {
  defaultWilaya?: string
  defaultCheckIn?: string
  defaultCheckOut?: string
  defaultGuests?: number
}

function formatShort(dateIso: string) {
  return format(parseISO(dateIso), 'dd MMM')
}

export default function SearchWidget({
  defaultWilaya,
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests,
}: SearchWidgetProps) {
  const router = useRouter()
  const today = startOfToday()

  const [wilaya, setWilaya] = useState<string>(defaultWilaya ?? '')
  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn ?? '')
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut ?? '')
  const [guests, setGuests] = useState<number>(defaultGuests ?? 2)
  const [wilayaFilter, setWilayaFilter] = useState('')
  const [openWilaya, setOpenWilaya] = useState(false)
  const [openGuests, setOpenGuests] = useState(false)
  const [openCheckIn, setOpenCheckIn] = useState(false)
  const [openCheckOut, setOpenCheckOut] = useState(false)

  const minCheckOutDate = useMemo(() => {
    if (checkIn) return addDays(parseISO(checkIn), 1)
    return addDays(today, 1)
  }, [checkIn, today])

  const filteredWilayas = useMemo(() => {
    const q = wilayaFilter.trim().toLowerCase()
    if (!q) return WILAYAS
    return WILAYAS.filter((w) => w.toLowerCase().includes(q))
  }, [wilayaFilter])

  function pushSearch() {
    const params = new URLSearchParams()
    if (wilaya) params.set('wilaya', wilaya)
    if (checkIn) params.set('check_in', checkIn)
    if (checkOut) params.set('check_out', checkOut)
    if (guests) params.set('guests', String(guests))
    const qs = params.toString()
    router.push(`/halls${qs ? `?${qs}` : ''}`)
  }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-2xl p-2 max-w-[820px] mx-auto',
        'flex flex-col md:flex-row md:items-stretch'
      )}
    >
      {/* Location */}
      <div className="flex-1 px-5 py-3">
        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Where?
        </div>
        <Popover open={openWilaya} onOpenChange={setOpenWilaya}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mt-1.5 w-full flex items-center gap-2 text-left"
            >
              <MapPin size={16} className="text-[#E8B86D]" aria-hidden />
              <span className="text-sm font-medium text-[#1A1A2E]">
                {wilaya ? wilaya : 'All of Algeria'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-3">
            <Input
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              placeholder="Search wilaya..."
              className="h-10 rounded-[10px] border-[#D1D5DB] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2"
            />
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  setWilaya('')
                  setOpenWilaya(false)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[#F7F8FA]"
              >
                All of Algeria
              </button>
              {filteredWilayas.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setWilaya(w)
                    setOpenWilaya(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#F7F8FA]"
                >
                  {w}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="hidden md:block w-px h-10 bg-[#E5E7EB] self-center flex-shrink-0" />

      {/* Check-in */}
      <div className="px-5 py-3 md:w-44">
        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Check-in
        </div>
        <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
          <PopoverTrigger asChild>
            <button type="button" className="mt-1.5 w-full flex items-center gap-2">
              <CalendarDays size={16} className="text-[#E8B86D]" aria-hidden />
              <span className={cn('text-sm font-medium', checkIn ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]')}>
                {checkIn ? formatShort(checkIn) : 'Add date'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={checkIn ? parseISO(checkIn) : undefined}
              onSelect={(d) => {
                if (!d) return
                if (isBefore(d, today)) return
                const iso = d.toISOString().split('T')[0] ?? ''
                setCheckIn(iso)
                if (checkOut) {
                  const out = parseISO(checkOut)
                  if (!isBefore(addDays(d, 1), out) && out <= addDays(d, 0)) {
                    setCheckOut('')
                  }
                }
                setOpenCheckIn(false)
              }}
              disabled={(date) => isBefore(date, today)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="hidden md:block w-px h-10 bg-[#E5E7EB] self-center flex-shrink-0" />

      {/* Check-out */}
      <div className="px-5 py-3 md:w-44">
        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Check-out
        </div>
        <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
          <PopoverTrigger asChild>
            <button type="button" className="mt-1.5 w-full flex items-center gap-2">
              <CalendarDays size={16} className="text-[#E8B86D]" aria-hidden />
              <span className={cn('text-sm font-medium', checkOut ? 'text-[#1A1A2E]' : 'text-[#9CA3AF]')}>
                {checkOut ? formatShort(checkOut) : 'Add date'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={checkOut ? parseISO(checkOut) : undefined}
              onSelect={(d) => {
                if (!d) return
                if (isBefore(d, minCheckOutDate)) return
                const iso = d.toISOString().split('T')[0] ?? ''
                setCheckOut(iso)
                setOpenCheckOut(false)
              }}
              disabled={(date) => isBefore(date, minCheckOutDate)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="hidden md:block w-px h-10 bg-[#E5E7EB] self-center flex-shrink-0" />

      {/* Guests */}
      <div className="px-5 py-3 md:w-36">
        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Guests
        </div>
        <Popover open={openGuests} onOpenChange={setOpenGuests}>
          <PopoverTrigger asChild>
            <button type="button" className="mt-1.5 w-full flex items-center gap-2">
              <UsersIcon size={16} className="text-[#E8B86D]" aria-hidden />
              <span className="text-sm font-medium text-[#1A1A2E]">
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <div className="text-sm font-semibold text-[#1A1A2E]">Number of guests</div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="h-9 w-9 rounded-lg border border-[#E5E7EB] hover:bg-[#F7F8FA] flex items-center justify-center"
                aria-label="Decrease guests"
              >
                <Minus size={16} />
              </button>
              <div className="text-base font-bold text-[#1A1A2E]">{guests}</div>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(9999, g + 1))}
                className="h-9 w-9 rounded-lg border border-[#E5E7EB] hover:bg-[#F7F8FA] flex items-center justify-center"
                aria-label="Increase guests"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button
              type="button"
              onClick={() => setOpenGuests(false)}
              className="mt-4 h-10 w-full rounded-xl bg-[#1A1A2E] text-white hover:bg-[#2D2D4E] font-semibold"
            >
              Done
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search button */}
      <div className="px-2 pb-2 md:pb-0 md:pr-2 md:pt-0 flex">
        <button
          type="button"
          onClick={pushSearch}
          className={cn(
            'w-full md:w-auto flex items-center justify-center gap-2',
            'bg-[#E8B86D] text-[#1A1A2E] font-bold',
            'rounded-xl px-8 py-4 md:py-5 h-full',
            'hover:bg-[#D4A558] transition-colors duration-150 active:scale-[0.98]'
          )}
        >
          <Search size={20} aria-hidden />
          <span>Search</span>
        </button>
      </div>
    </div>
  )
}


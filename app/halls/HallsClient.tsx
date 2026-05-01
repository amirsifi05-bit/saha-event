'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutGrid,
  List,
  SearchX,
  SlidersHorizontal,
  Star,
} from 'lucide-react'

import SearchWidget from '@/components/SearchWidget'
import { HallCard, HallCardSkeleton } from '@/components/HallCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type HallListItem = {
  id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  rating: number
  review_count: number
  amenities: string[]
  hall_photos?: { url: string; is_cover: boolean }[]
}

type SortBy = 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'capacity'

const AMENITIES = [
  'Air Conditioning',
  'Professional Sound System',
  'Private Parking',
  'On-site Catering',
  'Stage',
  'Projector & Screen',
  'WiFi',
] as const

const CAPACITY_BUCKETS = [
  { id: '100', label: 'Up to 100 guests' },
  { id: '100-250', label: '100 – 250 guests' },
  { id: '250-500', label: '250 – 500 guests' },
  { id: '500', label: '500+ guests' },
] as const

export default function HallsClient({
  halls,
  initialWilaya,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialSort,
}: {
  halls: HallListItem[]
  initialWilaya: string
  initialCheckIn: string
  initialCheckOut: string
  initialGuests: number
  initialSort: string
}) {
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState<SortBy>(
    (initialSort as SortBy) || 'recommended'
  )

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000])
  const [capacityFilters, setCapacityFilters] = useState<string[]>([])
  const [amenityFilters, setAmenityFilters] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 250)
    return () => window.clearTimeout(t)
  }, [])

  const filteredHalls = useMemo(() => {
    let result = halls

    result = result.filter(
      (h) => h.price_per_day >= priceRange[0] && h.price_per_day <= priceRange[1]
    )

    if (capacityFilters.length > 0) {
      result = result.filter((h) => {
        const checks = capacityFilters.map((c) => {
          if (c === '100') return h.capacity <= 100
          if (c === '100-250') return h.capacity > 100 && h.capacity <= 250
          if (c === '250-500') return h.capacity > 250 && h.capacity <= 500
          if (c === '500') return h.capacity > 500
          return true
        })
        return checks.some(Boolean)
      })
    }

    if (amenityFilters.length > 0) {
      result = result.filter((h) =>
        amenityFilters.every((a) => (h.amenities ?? []).includes(a))
      )
    }

    if (minRating > 0) {
      result = result.filter((h) => h.rating >= minRating)
    }

    const sorted = (() => {
      switch (sortBy) {
        case 'price_asc':
          return [...result].sort((a, b) => a.price_per_day - b.price_per_day)
        case 'price_desc':
          return [...result].sort((a, b) => b.price_per_day - a.price_per_day)
        case 'rating':
          return [...result].sort((a, b) => b.rating - a.rating)
        case 'capacity':
          return [...result].sort((a, b) => b.capacity - a.capacity)
        default:
          return [...result].sort((a, b) => b.rating - a.rating)
      }
    })()

    return sorted
  }, [amenityFilters, capacityFilters, halls, minRating, priceRange, sortBy])

  function clearAll() {
    setPriceRange([0, 200000])
    setCapacityFilters([])
    setAmenityFilters([])
    setMinRating(0)
  }

  const resultsCount = filteredHalls.length

  return (
    <div>
      <div className="bg-white border-b border-[#E5E7EB] sticky top-16 z-40 py-4 px-4">
        <SearchWidget
          defaultWilaya={initialWilaya || undefined}
          defaultCheckIn={initialCheckIn || undefined}
          defaultCheckOut={initialCheckOut || undefined}
          defaultGuests={initialGuests}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            {resultsCount} halls found
            {initialWilaya ? ` in ${initialWilaya}` : ''}
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#F0F0F6]"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} className="mr-2" aria-hidden />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <aside className="hidden md:block sticky top-24 self-start">
            <FiltersCard
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              capacityFilters={capacityFilters}
              setCapacityFilters={setCapacityFilters}
              amenityFilters={amenityFilters}
              setAmenityFilters={setAmenityFilters}
              minRating={minRating}
              setMinRating={setMinRating}
              onClearAll={clearAll}
            />
          </aside>

          <main>
            <div className="hidden md:flex items-center justify-between mb-4">
              <div className="text-sm text-[#6B7280]">
                {resultsCount} halls found
                {initialWilaya ? ` in ${initialWilaya}` : ''}
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortBy)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-[#D1D5DB] w-[220px] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="capacity">Largest capacity</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('grid')}
                    className={cn(
                      'h-10 w-10 rounded-xl border transition-colors',
                      mode === 'grid'
                        ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                        : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:bg-[#F7F8FA]'
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} className="mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className={cn(
                      'h-10 w-10 rounded-xl border transition-colors',
                      mode === 'list'
                        ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                        : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:bg-[#F7F8FA]'
                    )}
                    aria-label="List view"
                  >
                    <List size={18} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={cn(mode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4')}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <HallCardSkeleton key={i} mode={mode === 'grid' ? 'grid' : 'list'} />
                ))}
              </div>
            ) : filteredHalls.length === 0 ? (
              <div className="flex justify-center">
                <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
                  <SearchX size={48} className="text-[#D1D5DB] mx-auto" aria-hidden />
                  <h2 className="text-xl font-bold text-[#1A1A2E] mt-4">
                    No halls match your filters
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-2">
                    Try adjusting your filters or search in a different wilaya.
                  </p>
                  <Button
                    type="button"
                    onClick={clearAll}
                    className="mt-6 h-11 w-full rounded-xl font-semibold bg-[#1A1A2E] text-white hover:bg-[#2D2D4E]"
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  mode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                )}
              >
                {filteredHalls.map((hall, index) => (
                  <motion.div
                    key={hall.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HallCard
                      hall={hall}
                      mode={mode}
                      checkIn={initialCheckIn || undefined}
                      checkOut={initialCheckOut || undefined}
                      guests={initialGuests}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileFiltersOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/25"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              exit={{ y: 24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <FiltersCard
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                capacityFilters={capacityFilters}
                setCapacityFilters={setCapacityFilters}
                amenityFilters={amenityFilters}
                setAmenityFilters={setAmenityFilters}
                minRating={minRating}
                setMinRating={setMinRating}
                onClearAll={clearAll}
              />
              <Button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 h-11 w-full rounded-xl font-semibold bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558]"
              >
                Show {resultsCount} results
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function FiltersCard({
  priceRange,
  setPriceRange,
  capacityFilters,
  setCapacityFilters,
  amenityFilters,
  setAmenityFilters,
  minRating,
  setMinRating,
  onClearAll,
}: {
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  capacityFilters: string[]
  setCapacityFilters: (v: string[]) => void
  amenityFilters: string[]
  setAmenityFilters: (v: string[]) => void
  minRating: number
  setMinRating: (v: number) => void
  onClearAll: () => void
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[#1A1A2E]">Filters</h3>
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-[#E8B86D] hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="mt-6">
        <div className="font-semibold text-sm text-[#1A1A2E]">
          Price per day (DA)
        </div>
        <div className="mt-4">
          <Slider
            value={priceRange}
            min={0}
            max={200000}
            step={5000}
            onValueChange={(v) => setPriceRange([v[0] ?? 0, v[1] ?? 200000])}
          />
          <div className="text-sm text-[#6B7280] mt-3">
            {priceRange[0].toLocaleString()} DA — {priceRange[1].toLocaleString()} DA
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[#F3F4F6] pt-6">
        <div className="font-semibold text-sm text-[#1A1A2E]">Capacity</div>
        <div className="mt-3 space-y-3">
          {CAPACITY_BUCKETS.map((c) => {
            const checked = capacityFilters.includes(c.id)
            return (
              <div key={c.id} className="flex items-center gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(val) => {
                    const next = Boolean(val)
                      ? [...capacityFilters, c.id]
                      : capacityFilters.filter((x) => x !== c.id)
                    setCapacityFilters(next)
                  }}
                  id={`cap-${c.id}`}
                />
                <Label htmlFor={`cap-${c.id}`} className="text-sm text-[#374151]">
                  {c.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-[#F3F4F6] pt-6">
        <div className="font-semibold text-sm text-[#1A1A2E]">Amenities</div>
        <div className="mt-3 space-y-3">
          {AMENITIES.map((a) => {
            const checked = amenityFilters.includes(a)
            return (
              <div key={a} className="flex items-center gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(val) => {
                    const next = Boolean(val)
                      ? [...amenityFilters, a]
                      : amenityFilters.filter((x) => x !== a)
                    setAmenityFilters(next)
                  }}
                  id={`amen-${a}`}
                />
                <Label htmlFor={`amen-${a}`} className="text-sm text-[#374151]">
                  {a}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-[#F3F4F6] pt-6">
        <div className="font-semibold text-sm text-[#1A1A2E]">Rating</div>
        <div className="mt-3 flex gap-2">
          {[
            { label: '★ 4+', value: 4 },
            { label: '★ 3+', value: 3 },
            { label: '★ Any', value: 0 },
          ].map((r) => {
            const active = minRating === r.value
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => setMinRating(r.value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-sm font-semibold transition-colors',
                  active
                    ? 'bg-[#1A1A2E] text-white'
                    : 'bg-[#F3F4F6] text-[#374151]'
                )}
              >
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className={active ? 'text-white' : 'text-[#E8B86D]'} fill={active ? 'white' : '#E8B86D'} />
                  {r.value === 0 ? 'Any' : `${r.value}+`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


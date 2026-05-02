'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, MapPin, Star, Users } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface HallCardProps {
  hall: {
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
  mode: 'grid' | 'list'
  checkIn?: string
  checkOut?: string
  guests?: number
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(price)

function initials(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : ''
  return (first + second).toUpperCase()
}

function buildAvailabilityHref({
  slug,
  checkIn,
  checkOut,
  guests,
}: {
  slug: string
  checkIn?: string
  checkOut?: string
  guests?: number
}) {
  const params = new URLSearchParams()
  if (checkIn) params.set('check_in', checkIn)
  if (checkOut) params.set('check_out', checkOut)
  if (guests) params.set('guests', String(guests))
  const qs = params.toString()
  return `/halls/${slug}${qs ? `?${qs}` : ''}`
}

function StarsRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1
        const filled = rounded >= n
        return (
          <Star
            key={n}
            size={14}
            className={cn(
              'text-[#D1D5DB]',
              filled && 'text-[#E8B86D]'
            )}
            fill={filled ? '#E8B86D' : 'transparent'}
          />
        )
      })}
    </div>
  )
}

export function HallCard({ hall, mode, checkIn, checkOut, guests }: HallCardProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const coverUrl = useMemo(() => {
    const cover = hall.hall_photos?.find((p) => p.is_cover)?.url
    return cover ?? hall.hall_photos?.[0]?.url ?? null
  }, [hall.hall_photos])

  useEffect(() => {
    const loadFavorite = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('favorites')
        .select('hall_id')
        .eq('client_id', user.id)
        .eq('hall_id', hall.id)
        .maybeSingle()
      setFavorited(Boolean(data))
    }
    void loadFavorite()
  }, [hall.id])

  async function toggleFavorite() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/signin?redirect=/halls/${hall.slug}`)
      return
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'client') {
      router.push(`/halls/${hall.slug}`)
      return
    }

    setFavLoading(true)
    try {
      if (favorited) {
        await supabase.from('favorites').delete().eq('client_id', user.id).eq('hall_id', hall.id)
        setFavorited(false)
      } else {
        await supabase.from('favorites').insert({ client_id: user.id, hall_id: hall.id })
        setFavorited(true)
      }
    } finally {
      setFavLoading(false)
    }
  }

  const amenities = hall.amenities ?? []

  if (mode === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-72 flex-shrink-0 h-48 md:h-56">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={hall.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center">
                <div className="text-white/30 text-6xl font-bold">{initials(hall.name)}</div>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <Link href={`/halls/${hall.slug}`} className="font-bold text-xl text-[#1A1A2E]">
                  {hall.name}
                </Link>
                <span className="bg-[#EEF2FF] text-[#3730A3] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {hall.wilaya}
                </span>
              </div>
              <div className="mt-1 text-sm text-[#6B7280] flex items-center gap-2">
                <MapPin size={14} className="text-[#9CA3AF]" aria-hidden />
                <span className="line-clamp-1">{hall.address}</span>
              </div>
              <div className="mt-1 text-sm text-[#6B7280] flex items-center gap-2">
                <Users size={14} className="text-[#9CA3AF]" aria-hidden />
                <span>Up to {hall.capacity} guests</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {amenities.slice(0, 5).map((a) => (
                  <span
                    key={a}
                    className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-md"
                  >
                    {a}
                  </span>
                ))}
                {amenities.length > 5 ? (
                  <span className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-md">
                    +{amenities.length - 5} more
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <StarsRow rating={hall.rating} />
                  <span className="text-sm font-bold text-[#1A1A2E]">{hall.rating.toFixed(1)}</span>
                  <span className="text-sm text-[#6B7280]">({hall.review_count} reviews)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#1A1A2E]">
                  {formatPrice(hall.price_per_day)} DA{' '}
                  <span className="text-sm font-medium text-[#9CA3AF]">/day</span>
                </div>
                <div className="text-xs text-[#9CA3AF] mt-1">Includes service fee</div>
                <Link
                  href={buildAvailabilityHref({ slug: hall.slug, checkIn, checkOut, guests })}
                  className="mt-3 inline-flex items-center gap-2 bg-[#1A1A2E] text-white rounded-xl px-6 py-2.5 hover:bg-[#2D2D4E] transition-colors"
                >
                  See availability <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className="relative h-52">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={hall.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4E] flex items-center justify-center">
            <div className="text-white/30 text-6xl font-bold">{initials(hall.name)}</div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-white text-[#1A1A2E] text-xs font-medium px-2.5 py-0.5 rounded-full">
            {hall.wilaya}
          </span>
          <span className="bg-white text-[#1A1A2E] text-xs font-medium px-2.5 py-0.5 rounded-full">
            {hall.capacity} guests
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          disabled={favLoading}
          className="absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center"
          aria-label="Toggle favorite"
        >
          <span
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center shadow-md',
              favorited ? 'bg-white' : 'bg-white/90'
            )}
          >
            <Heart
              size={18}
              className={cn(
                favorited ? 'text-red-500' : 'text-[#1A1A2E]'
              )}
              fill={favorited ? '#EF4444' : 'transparent'}
            />
          </span>
        </button>
      </div>

      <div className="p-5">
        <Link href={`/halls/${hall.slug}`} className="font-bold text-lg text-[#1A1A2E] line-clamp-1">
          {hall.name}
        </Link>
        <div className="text-sm text-[#6B7280] mt-1 flex items-center gap-2">
          <MapPin size={12} className="text-[#9CA3AF]" aria-hidden />
          <span className="line-clamp-1">{hall.address}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((a) => (
            <span key={a} className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-md">
              {a}
            </span>
          ))}
          {amenities.length > 3 ? (
            <span className="bg-[#F3F4F6] text-[#374151] text-xs px-2 py-0.5 rounded-md">
              +{amenities.length - 3} more
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-[#E8B86D]" fill="#E8B86D" />
              <span className="font-bold text-sm text-[#1A1A2E]">{hall.rating.toFixed(1)}</span>
              <span className="text-sm text-[#9CA3AF]">({hall.review_count} reviews)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[#1A1A2E]">
              {formatPrice(hall.price_per_day)} DA
            </div>
            <div className="text-sm text-[#9CA3AF] -mt-1">/day</div>
          </div>
        </div>

        <Link
          href={buildAvailabilityHref({ slug: hall.slug, checkIn, checkOut, guests })}
          className="mt-4 block w-full text-center bg-[#E8B86D] text-[#1A1A2E] font-semibold rounded-xl py-2.5 hover:bg-[#D4A558] transition-colors"
        >
          See availability
        </Link>
      </div>
    </motion.div>
  )
}

export const formatHallPrice = formatPrice

export function HallCardSkeleton({ mode = 'list' }: { mode?: 'grid' | 'list' }) {
  if (mode === 'grid') {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-end justify-between pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="w-full md:w-72 h-48 md:h-56 rounded-none md:rounded-l-2xl" />
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="pt-6">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}


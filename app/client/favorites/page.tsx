'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { HallCard } from '@/components/HallCard'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type FavoriteHall = {
  hall_id: string
  event_halls: {
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
    hall_photos: { url: string; is_cover: boolean }[]
  } | null
}

export default function FavoritesPage() {
  const [userId, setUserId] = useState('')
  const [favorites, setFavorites] = useState<FavoriteHall[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      setUserId(auth.user.id)
      const { data } = await supabase
        .from('favorites')
        .select('hall_id, created_at, event_halls(*, hall_photos(url, is_cover))')
        .eq('client_id', auth.user.id)
        .order('created_at', { ascending: false })
      const normalized = (data ?? []).map((f) => ({
        hall_id: f.hall_id as string,
        event_halls: Array.isArray(f.event_halls) ? (f.event_halls[0] ?? null) : (f.event_halls as FavoriteHall['event_halls']),
      }))
      setFavorites(normalized)
    }
    void load()
  }, [])

  async function unfavorite(hallId: string) {
    const supabase = createClient()
    await supabase.from('favorites').delete().eq('client_id', userId).eq('hall_id', hallId)
    setFavorites((prev) => prev.filter((f) => f.hall_id !== hallId))
    toast.success('Removed from favorites')
  }

  const halls = favorites.filter((f) => f.event_halls).length

  return (
    <div>
      <h1 className="font-bold text-2xl">My Favorites</h1>
      <p className="text-sm text-[#6B7280] mt-1">{halls} saved halls</p>
      {halls === 0 ? (
        <div className="text-center mt-16">
          <Heart size={48} className="text-[#D1D5DB] mx-auto" />
          <p className="font-semibold text-[#1A1A2E] mt-3">No saved halls yet</p>
          <p className="text-[#6B7280] text-sm">Tap the heart on any hall to save it here.</p>
          <Link href="/halls"><Button className="mt-5 bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558]">Browse halls</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {favorites.map((fav) => {
            if (!fav.event_halls) return null
            return (
              <div key={fav.hall_id}>
                <HallCard hall={fav.event_halls} mode="grid" />
                <button onClick={() => unfavorite(fav.hall_id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 mt-2">
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


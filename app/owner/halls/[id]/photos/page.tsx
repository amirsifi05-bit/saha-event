'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

import { storagePublicPathFromUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { HallPhoto } from '@/types/database'

export default function HallPhotosPage() {
  const { id: hallId } = useParams<{ id: string }>()
  const [photos, setPhotos] = useState<HallPhoto[]>([])
  const [userId, setUserId] = useState('')

  const loadPhotos = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('hall_photos')
      .select('*')
      .eq('hall_id', hallId)
      .order('sort_order', { ascending: true })
    setPhotos((data ?? []) as HallPhoto[])
  }, [hallId])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: u } = await supabase.auth.getUser()
      if (u.user) setUserId(u.user.id)
      await loadPhotos()
    }
    void init()
  }, [loadPhotos])

  async function setCover(photoId: string) {
    const supabase = createClient()
    await supabase.from('hall_photos').update({ is_cover: false }).eq('hall_id', hallId)
    const { error } = await supabase.from('hall_photos').update({ is_cover: true }).eq('id', photoId)
    if (error) return toast.error(error.message)
    toast.success('Cover updated')
    await loadPhotos()
  }

  async function deletePhoto(photo: HallPhoto) {
    const supabase = createClient()
    const path = storagePublicPathFromUrl(photo.url, 'hall-photos')
    if (path) await supabase.storage.from('hall-photos').remove([path])
    const { error } = await supabase.from('hall_photos').delete().eq('id', photo.id)
    if (error) return toast.error(error.message)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    toast.success('Photo removed')
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !userId) return
    const supabase = createClient()
    const maxSort = photos.reduce((m, p) => Math.max(m, p.sort_order), -1)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue
      const path = `${userId}/${hallId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('hall-photos').upload(path, file)
      if (upErr) {
        toast.error(upErr.message)
        continue
      }
      const { data: pub } = supabase.storage.from('hall-photos').getPublicUrl(path)
      const { error: insErr } = await supabase.from('hall_photos').insert({
        hall_id: hallId,
        url: pub.publicUrl,
        is_cover: photos.length === 0 && i === 0,
        sort_order: maxSort + 1 + i,
        caption: null,
      })
      if (insErr) toast.error(insErr.message)
    }
    await loadPhotos()
    toast.success('Photos uploaded')
  }

  return (
    <div>
      <Link href={`/owner/halls/${hallId}`} className="text-sm text-[#6B7280]">
        ← Hall overview
      </Link>
      <h1 className="font-bold text-2xl mt-4">Manage photos</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
            <Image src={photo.url} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
            {photo.is_cover ? (
              <span className="absolute bottom-2 left-2 bg-[#E8B86D] text-[#1A1A2E] text-xs font-semibold px-2 py-1 rounded-full">★ Cover</span>
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
              {!photo.is_cover ? (
                <button
                  type="button"
                  className="bg-white/90 rounded-lg px-2 py-1 text-xs"
                  onClick={() => setCover(photo.id)}
                >
                  Set cover
                </button>
              ) : null}
              <button
                type="button"
                className="bg-red-500/90 text-white rounded-lg px-2 py-1 text-xs"
                onClick={() => deletePhoto(photo)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <label className="mt-6 block border-2 border-dashed border-[#D1D5DB] rounded-2xl p-8 text-center cursor-pointer hover:border-[#1A1A2E] hover:bg-[#F7F8FA]">
        <Upload className="mx-auto text-[#9CA3AF]" size={32} />
        <p className="text-sm mt-2">Add more photos</p>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
      </label>
      <p className="text-xs text-[#9CA3AF] mt-4">Drag photos to reorder — coming soon</p>
    </div>
  )
}

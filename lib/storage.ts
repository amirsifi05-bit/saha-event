/** Extract object path from Supabase public storage URL for `remove([path])`. */
export function storagePublicPathFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  const path = url.slice(i + marker.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('count')
  return (
    <main>
      <h1>Saha-Event</h1>
      <p>DB connection: {error ? 'FAILED — ' + error.message : 'OK'}</p>
    </main>
  )
}
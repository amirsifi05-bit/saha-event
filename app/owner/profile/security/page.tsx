'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function OwnerSecurityPage() {
  const router = useRouter()
  const [inlineError, setInlineError] = useState('')
  const [open, setOpen] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const submit = form.handleSubmit(async (values) => {
    setInlineError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.newPassword })
    if (error) {
      setInlineError(error.message)
      return
    }
    toast.success('Password updated successfully!')
    form.reset()
  })

  async function signOutEverywhere() {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'global' })
    toast.success('Signed out from all devices.')
    router.push('/')
  }

  return (
    <div>
      <div className="bg-white border rounded-2xl p-6">
        <h1 className="font-bold mb-6">Change password</h1>
        <form onSubmit={submit} className="space-y-4">
          <PasswordInput label="New password" placeholder="New password" {...form.register('newPassword')} />
          <PasswordInput label="Confirm password" placeholder="Confirm new password" {...form.register('confirmPassword')} />
          {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(
              'bg-[#1A1A2E] hover:bg-[#2D2D4E] px-8 rounded-xl transition-all active:scale-[0.98]',
              form.formState.isSubmitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </div>

      <div className="bg-white border rounded-2xl p-6 mt-4">
        <h2 className="font-bold mb-4">Session management</h2>
        <p className="text-sm text-[#4B5563] mb-3">Sign out of all devices</p>
        <p className="text-xs text-[#9CA3AF] mb-4">This will sign you out on every browser and device.</p>
        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setOpen(true)}>
          Sign out everywhere
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out everywhere?</AlertDialogTitle>
            <AlertDialogDescription>This will end all active sessions across devices.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={signOutEverywhere} className="bg-red-600 hover:bg-red-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

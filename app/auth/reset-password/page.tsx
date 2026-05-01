'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        setReady(true)
      }
    })

    const t = window.setTimeout(() => {
      if (cancelled) return
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return
        if (session?.user) setReady(true)
      })
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      subscription.unsubscribe()
    }
  }, [])

  async function onSubmit(values: FormValues) {
    setFormError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setFormError(error.message)
      return
    }

    toast.success('Password updated successfully!')
    router.push('/auth/signin')
  }

  const disabled = isSubmitting

  if (!ready) {
    return (
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={36} className="animate-spin text-[#1A1A2E]" aria-label="Loading" />
        <p className="text-sm text-[#6B7280]">Verifying reset link…</p>
      </div>
    )
  }

  return (
    <AuthCard>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Set a new password</h1>
        <p className="text-sm text-[#6B7280] mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          disabled={disabled}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          disabled={disabled}
          placeholder="••••••••"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        {formError ? (
          <p className="text-red-500 text-sm text-center">{formError}</p>
        ) : null}

        <Button
          type="submit"
          disabled={disabled}
          className={cn(
            'h-11 w-full rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]',
            'bg-[#1A1A2E] text-white hover:bg-[#2D2D4E]'
          )}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            'Update password'
          )}
        </Button>
      </form>
    </AuthCard>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: FormValues) {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setSent(true)
  }

  const disabled = isSubmitting

  return (
    <AuthCard>
      <Link
        href="/auth/signin"
        className="inline-flex items-center text-sm text-[#1A1A2E] font-medium hover:underline transition-colors duration-150 mb-6"
      >
        ← Back
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Reset your password</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <MailCheck size={32} className="text-green-600" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Check your inbox</h2>
          <p className="text-[#6B7280] text-sm">
            If an account exists for that email, we&apos;ve sent a password reset link. It may
            take a minute to arrive.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block text-[#1A1A2E] font-medium hover:underline transition-colors duration-150"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label
              htmlFor="email"
              className="text-[13px] font-medium text-[#374151] mb-1.5 block"
            >
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={disabled}
              className={cn(
                'mt-1.5 h-11 rounded-[10px] border-[#D1D5DB] text-sm',
                'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2'
              )}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={disabled}
            className={cn(
              'h-11 w-full rounded-xl font-semibold transition-all active:scale-[0.98]',
              'bg-[#1A1A2E] text-white hover:bg-[#2D2D4E]',
              isSubmitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

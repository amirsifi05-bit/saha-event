'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatSignInError } from '@/lib/auth/auth-errors'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})

type FormValues = z.infer<typeof schema>

function isSafeRelativeRedirect(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setAuthError(null)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setAuthError(formatSignInError(error.message))
      return
    }

    const redirectParam = searchParams.get('redirect')
    if (redirectParam && isSafeRelativeRedirect(redirectParam)) {
      router.push(redirectParam)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'owner') {
      router.push('/owner/dashboard')
    } else if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/client/dashboard')
    }
  }

  const disabled = isSubmitting

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome back</h1>
        <p className="text-sm text-[#6B7280] mt-1">Sign in to your account</p>
      </div>

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

        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            disabled={disabled}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end mt-2">
            <Link
              href="/auth/forgot-password"
              className="text-[13px] text-[#6B7280] hover:text-[#1A1A2E] transition-colors duration-150"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

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
            'Sign in'
          )}
        </Button>

        {authError ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" aria-hidden />
            <span>{authError}</span>
          </div>
        ) : null}
      </form>

      <p className="text-center text-sm text-[#6B7280] mt-8">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-[#1A1A2E] font-medium hover:underline transition-colors duration-150"
        >
          Create one →
        </Link>
      </p>
    </AuthCard>
  )
}

function SignInFallback() {
  return (
    <div className="w-full max-w-[480px] mx-auto flex justify-center py-24">
      <Loader2 size={32} className="animate-spin text-[#1A1A2E]" aria-label="Loading" />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  )
}

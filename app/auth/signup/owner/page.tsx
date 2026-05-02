'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { WilayaField } from '@/components/auth/WilayaField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatSignupError } from '@/lib/auth/auth-errors'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    business_name: z.string().min(2, 'Business name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
    phone: z
      .string()
      .refine((s) => s.trim().length >= 9, 'Please enter a valid phone number'),
    wilaya: z.string().min(1, 'Please select your wilaya'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

export default function OwnerSignupPage() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      business_name: '',
      email: '',
      password: '',
      confirm: '',
      phone: '',
      wilaya: '',
    },
  })

  const wilaya = watch('wilaya')

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          role: 'owner',
          full_name: values.full_name,
          business_name: values.business_name,
        },
      },
    })

    if (error) {
      setSubmitError(formatSignupError(error.message))
      return
    }

    if (data.user) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ phone: values.phone.trim(), wilaya: values.wilaya })
        .eq('id', data.user.id)

      if (userUpdateError) {
        setSubmitError(userUpdateError.message)
        return
      }

      const { error: ownerUpdateError } = await supabase
        .from('owner_profiles')
        .update({ business_name: values.business_name })
        .eq('user_id', data.user.id)

      if (ownerUpdateError) {
        setSubmitError(ownerUpdateError.message)
        return
      }
    }

    toast.success('Welcome! Your owner account has been created.')
    router.push('/owner/dashboard')
  }

  const disabled = isSubmitting

  return (
    <AuthCard>
      <Link
        href="/auth/signup"
        className="inline-flex items-center text-sm text-[#1A1A2E] font-medium hover:underline transition-colors duration-150 mb-6"
      >
        ← Back
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Create your account</h1>
        <p className="text-sm text-[#6B7280] mt-1">List your hall and grow your business</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label
            htmlFor="full_name"
            className="text-[13px] font-medium text-[#374151] mb-1.5 block"
          >
            Full name
          </Label>
          <Input
            id="full_name"
            autoComplete="name"
            disabled={disabled}
            placeholder="Ahmed Benali"
            className={cn(
              'mt-1.5 h-11 rounded-[10px] border-[#D1D5DB] text-sm',
              'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2'
            )}
            {...register('full_name')}
          />
          {errors.full_name ? (
            <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
          ) : null}
        </div>

        <div>
          <Label
            htmlFor="business_name"
            className="text-[13px] font-medium text-[#374151] mb-1.5 block"
          >
            Business / Hall name
          </Label>
          <Input
            id="business_name"
            autoComplete="organization"
            disabled={disabled}
            placeholder="Benali Events"
            className={cn(
              'mt-1.5 h-11 rounded-[10px] border-[#D1D5DB] text-sm',
              'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2'
            )}
            {...register('business_name')}
          />
          {errors.business_name ? (
            <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>
          ) : null}
        </div>

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
            placeholder="you@example.com"
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

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          disabled={disabled}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          disabled={disabled}
          placeholder="••••••••"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <div>
          <Label
            htmlFor="phone"
            className="text-[13px] font-medium text-[#374151] mb-1.5 block"
          >
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            placeholder="+213 6XX XXX XXX"
            className={cn(
              'mt-1.5 h-11 rounded-[10px] border-[#D1D5DB] text-sm',
              'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2'
            )}
            {...register('phone')}
          />
          {errors.phone ? (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          ) : null}
        </div>

        <WilayaField
          id="wilaya"
          value={wilaya}
          onChange={(v) => setValue('wilaya', v, { shouldValidate: true })}
          disabled={disabled}
          error={errors.wilaya?.message}
        />

        <div
          className="flex gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4"
          role="note"
        >
          <Info size={16} className="text-[#3B82F6] shrink-0 mt-0.5" aria-hidden />
          <p className="text-[13px] text-[#1E40AF] leading-snug">
            After registration, you can immediately add your hall listings. Our team will review
            and activate your account within 24 hours.
          </p>
        </div>

        {submitError ? (
          <p className="text-red-500 text-sm text-center">{submitError}</p>
        ) : null}

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
            'Create owner account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[#6B7280] mt-8">
        Already have an account?{' '}
        <Link
          href="/auth/signin"
          className="text-[#1A1A2E] font-medium hover:underline transition-colors duration-150"
        >
          Sign in →
        </Link>
      </p>
    </AuthCard>
  )
}

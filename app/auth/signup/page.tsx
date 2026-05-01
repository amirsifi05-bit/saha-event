'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, Users } from 'lucide-react'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function SignupRolePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<'client' | 'owner' | null>(null)

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Create your account</h1>
        <p className="text-sm text-[#6B7280] mt-1">What brings you to Saha-Event?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setSelected('client')}
          className={cn(
            'relative text-left rounded-2xl p-6 border transition-all duration-200 cursor-pointer',
            selected === 'client'
              ? 'border-2 border-[#1A1A2E] bg-[#F0F0F6]'
              : 'border border-[#E5E7EB] hover:border-[#1A1A2E] hover:shadow-md'
          )}
        >
          {selected === 'client' ? (
            <CheckCircle2
              size={20}
              className="absolute top-4 right-4 text-[#1A1A2E]"
              aria-hidden
            />
          ) : null}
          <Users size={32} className="text-[#E8B86D] mb-3" aria-hidden />
          <h2 className="font-semibold text-[#1A1A2E] text-base">I want to book</h2>
          <p className="text-xs text-[#6B7280] mt-1 leading-snug">
            Find and reserve event halls for your celebrations
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelected('owner')}
          className={cn(
            'relative text-left rounded-2xl p-6 border transition-all duration-200 cursor-pointer',
            selected === 'owner'
              ? 'border-2 border-[#1A1A2E] bg-[#F0F0F6]'
              : 'border border-[#E5E7EB] hover:border-[#1A1A2E] hover:shadow-md'
          )}
        >
          {selected === 'owner' ? (
            <CheckCircle2
              size={20}
              className="absolute top-4 right-4 text-[#1A1A2E]"
              aria-hidden
            />
          ) : null}
          <Building2 size={32} className="text-[#E8B86D] mb-3" aria-hidden />
          <h2 className="font-semibold text-[#1A1A2E] text-base">I own a hall</h2>
          <p className="text-xs text-[#6B7280] mt-1 leading-snug">
            List your venue and manage bookings from one place
          </p>
        </button>
      </div>

      <Button
        type="button"
        disabled={!selected}
        onClick={() => {
          if (selected === 'client') router.push('/auth/signup/client')
          if (selected === 'owner') router.push('/auth/signup/owner')
        }}
        className={cn(
          'h-11 w-full rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]',
          'bg-[#1A1A2E] text-white hover:bg-[#2D2D4E] disabled:opacity-50'
        )}
      >
        Continue
      </Button>

      <p className="text-center text-sm text-[#6B7280] mt-8">
        Already have an account?{' '}
        <Link
          href="/auth/signin"
          className="text-[#1A1A2E] font-medium hover:underline transition-colors duration-150"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}

'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, className, id, disabled, ...props }, ref) {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const [show, setShow] = React.useState(false)

    return (
      <div className="space-y-0">
        <Label
          htmlFor={inputId}
          className="text-[13px] font-medium text-[#374151] mb-1.5 block"
        >
          {label}
        </Label>
        <div className="relative mt-1.5">
          <Input
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            disabled={disabled}
            className={cn(
              'h-11 w-full rounded-[10px] border-[#D1D5DB] px-3 pr-10 text-sm text-[#1A1A2E] placeholder:text-[#9CA3AF]',
              'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2',
              className
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A2E] transition-colors duration-150 disabled:pointer-events-none"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error ? (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        ) : null}
      </div>
    )
  }
)

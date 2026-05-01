'use client'

import { WILAYAS } from '@/lib/auth/wilayas'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface WilayaFieldProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export function WilayaField({
  id,
  label = 'Wilaya',
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select your wilaya',
}: WilayaFieldProps) {
  const selectId = id
  return (
    <div className="space-y-0">
      <Label
        htmlFor={selectId}
        className="text-[13px] font-medium text-[#374151] mb-1.5 block"
      >
        {label}
      </Label>
      <Select
        value={value ? value : undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            'mt-1.5 h-11 w-full rounded-[10px] border-[#D1D5DB] text-sm text-[#1A1A2E]',
            'focus-visible:border-[#1A1A2E] focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {WILAYAS.map((w) => (
            <SelectItem key={w} value={w}>
              {w}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null}
    </div>
  )
}

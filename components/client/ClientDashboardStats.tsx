'use client'

import { CalendarDays, CheckCircle2, Clock, Wallet } from 'lucide-react'

import { AnimatedNumber } from '@/components/AnimatedNumber'

export function ClientDashboardStats({
  total,
  upcoming,
  confirmed,
  totalSpent,
}: {
  total: number
  upcoming: number
  confirmed: number
  totalSpent: number
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EEF2FF]">
            <CalendarDays size={20} className="text-[#4338CA]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#1A1A2E] mt-3">
          <AnimatedNumber value={total} />
        </div>
        <div className="text-sm text-[#6B7280] mt-1">Total bookings</div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FEF3C7]">
            <Clock size={20} className="text-[#D97706]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#1A1A2E] mt-3">
          <AnimatedNumber value={upcoming} />
        </div>
        <div className="text-sm text-[#6B7280] mt-1">Upcoming events</div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#D1FAE5]">
            <CheckCircle2 size={20} className="text-[#059669]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#1A1A2E] mt-3">
          <AnimatedNumber value={confirmed} />
        </div>
        <div className="text-sm text-[#6B7280] mt-1">Confirmed</div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EDE9FE]">
            <Wallet size={20} className="text-[#7C3AED]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#1A1A2E] mt-3">
          <AnimatedNumber value={Math.round(totalSpent)} />{' '}
          <span className="text-xl font-bold">DA</span>
        </div>
        <div className="text-sm text-[#6B7280] mt-1">Total spent</div>
      </div>
    </div>
  )
}

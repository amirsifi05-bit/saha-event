'use client'

import Link from 'next/link'
import { Building2, Clock, TrendingUp, Wallet } from 'lucide-react'

import { AnimatedNumber } from '@/components/AnimatedNumber'

export function OwnerDashboardStats({
  totalHalls,
  activeHalls,
  pendingApproval,
  thisMonthRevenue,
  totalRevenue,
}: {
  totalHalls: number
  activeHalls: number
  pendingApproval: number
  thisMonthRevenue: number
  totalRevenue: number
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
          <Building2 size={20} className="text-[#4338CA]" />
        </div>
        <div className="text-3xl font-bold text-[#1A1A2E] mt-3">
          <AnimatedNumber value={totalHalls} />
        </div>
        <div className="text-xs text-[#9CA3AF] mt-0.5">Total halls</div>
        <div className="text-sm text-[#6B7280] mt-1">{activeHalls} active</div>
      </div>

      <Link href="/owner/reservations?status=pending" className="block group">
        <div
          className={`bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] h-full transition group-hover:shadow-md ${
            pendingApproval > 0 ? 'ring-2 ring-amber-300' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
            <Clock size={20} className="text-[#D97706]" />
          </div>
          <div
            className={`text-3xl font-bold mt-3 ${
              pendingApproval > 0 ? 'text-red-600 animate-pulse' : 'text-[#1A1A2E]'
            }`}
          >
            <AnimatedNumber value={pendingApproval} />
          </div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">Pending bookings</div>
          <div className="text-sm text-[#6B7280] mt-1">Needs review →</div>
        </div>
      </Link>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
          <TrendingUp size={20} className="text-[#059669]" />
        </div>
        <div className="text-xl font-bold text-[#1A1A2E] mt-3 leading-tight">
          <AnimatedNumber value={Math.round(thisMonthRevenue)} /> DA
        </div>
        <div className="text-xs text-[#9CA3AF] mt-0.5">This month</div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
          <Wallet size={20} className="text-[#7C3AED]" />
        </div>
        <div className="text-xl font-bold text-[#1A1A2E] mt-3 leading-tight">
          <AnimatedNumber value={Math.round(totalRevenue)} /> DA
        </div>
        <div className="text-xs text-[#9CA3AF] mt-0.5">Total earned (all time)</div>
      </div>
    </div>
  )
}

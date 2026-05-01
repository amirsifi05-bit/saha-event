'use client'

import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'

export interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="flex items-center justify-center gap-2 mb-8">
        <CalendarDays size={24} className="text-[#E8B86D]" />
        <span className="text-[22px] font-bold text-[#1A1A2E] tracking-tight lowercase">
          saha·event
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-8"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

'use client'

type Status = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

const cfg: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pending review', className: 'bg-[#FEF3C7] text-[#92400E]' },
  confirmed: { label: 'Confirmed', className: 'bg-[#D1FAE5] text-[#065F46]' },
  rejected: { label: 'Rejected', className: 'bg-[#FEE2E2] text-[#991B1B]' },
  cancelled: { label: 'Cancelled', className: 'bg-[#F3F4F6] text-[#374151]' },
  completed: { label: 'Completed', className: 'bg-[#EDE9FE] text-[#5B21B6]' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className } = cfg[status] ?? cfg.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}


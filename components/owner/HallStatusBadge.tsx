const config = {
  active: { label: 'Active', className: 'bg-[#D1FAE5] text-[#065F46]' },
  pending: { label: 'Pending', className: 'bg-[#FEF3C7] text-[#92400E]' },
  inactive: { label: 'Inactive', className: 'bg-[#F3F4F6] text-[#374151]' },
  rejected: { label: 'Rejected', className: 'bg-[#FEE2E2] text-[#991B1B]' },
} as const

export default function HallStatusBadge({ status }: { status: string }) {
  const c = config[status as keyof typeof config] ?? config.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  )
}

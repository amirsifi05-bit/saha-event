import type { ReservationStatus } from '@/types/database'

export type RevenueReservationRow = {
  created_at: string
  total_price: number
  status: ReservationStatus
}

export function getLast6MonthsRevenue(reservations: RevenueReservationRow[]) {
  const months: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.toLocaleString('en', { month: 'short' })
    const year = d.getFullYear()
    const revenue = reservations
      .filter((r) => {
        const rd = new Date(r.created_at)
        return (
          rd.getMonth() === d.getMonth() &&
          rd.getFullYear() === year &&
          ['confirmed', 'completed'].includes(r.status)
        )
      })
      .reduce((s, r) => s + r.total_price, 0)
    months.push({ month, revenue })
  }
  return months
}

export function getLast12MonthsRevenue(reservations: RevenueReservationRow[]) {
  const months: { month: string; year: number; revenue: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.toLocaleString('en', { month: 'short' })
    const year = d.getFullYear()
    const revenue = reservations
      .filter((r) => {
        const rd = new Date(r.created_at)
        return (
          rd.getMonth() === d.getMonth() &&
          rd.getFullYear() === year &&
          ['confirmed', 'completed'].includes(r.status)
        )
      })
      .reduce((s, r) => s + r.total_price, 0)
    months.push({ month, year, revenue })
  }
  return months
}

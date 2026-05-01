import { clsx, type ClassValue } from "clsx"
import { differenceInDays, format, parseISO } from 'date-fns'
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: number) =>
  `${new Intl.NumberFormat('en-DZ', { minimumFractionDigits: 0 }).format(price)} DA`

export const formatDate = (date: string) =>
  format(parseISO(date), 'd MMM yyyy')

export const formatDateLong = (date: string) =>
  format(parseISO(date), 'EEEE, d MMMM yyyy')

export const calcNights = (checkIn: string, checkOut: string) =>
  differenceInDays(parseISO(checkOut), parseISO(checkIn))

export const calcPrice = (pricePerDay: number, checkIn: string, checkOut: string) => {
  const nights = calcNights(checkIn, checkOut)
  const subtotal = nights * pricePerDay
  const serviceFee = Math.round(subtotal * 0.05)
  return { nights, subtotal, serviceFee, total: subtotal + serviceFee }
}

export const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

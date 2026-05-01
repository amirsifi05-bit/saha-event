export type UserRole = 'client' | 'owner' | 'admin'
export type HallStatus = 'pending' | 'active' | 'inactive' | 'rejected'
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export interface User {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  wilaya: string | null
  avatar_url: string | null
  created_at: string
}

export interface OwnerProfile {
  user_id: string
  business_name: string | null
  national_id_url: string | null
  is_verified: boolean
  bio: string | null
}

export interface HallPhoto {
  id: string
  hall_id: string
  url: string
  caption: string | null
  is_cover: boolean
  sort_order: number
}

export interface EventHall {
  id: string
  owner_id: string
  name: string
  slug: string
  wilaya: string
  address: string
  capacity: number
  price_per_day: number
  description: string | null
  amenities: string[]
  rating: number
  review_count: number
  status: HallStatus
  created_at: string
  hall_photos?: HallPhoto[]
  users?: Pick<User, 'full_name' | 'avatar_url'>
}

export interface Reservation {
  id: string
  client_id: string
  hall_id: string
  owner_id: string
  check_in: string
  check_out: string
  guest_count: number
  subtotal: number
  service_fee: number
  total_price: number
  status: ReservationStatus
  receipt_url: string | null
  owner_response: string | null
  special_requests: string | null
  created_at: string
  event_halls?: EventHall
}

export interface Review {
  id: string
  reservation_id: string
  client_id: string
  hall_id: string
  rating: number
  comment: string | null
  created_at: string
  users?: Pick<User, 'full_name' | 'avatar_url'>
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  related_reservation_id: string | null
  related_hall_id: string | null
  created_at: string
}

export interface Favorite {
  client_id: string
  hall_id: string
  created_at: string
}


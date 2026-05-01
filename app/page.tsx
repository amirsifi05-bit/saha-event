import Link from 'next/link'
import { ArrowRight, CalendarDays, PartyPopper, Search } from 'lucide-react'

import FadeUp from '@/components/FadeUp'
import { HallCard } from '@/components/HallCard'
import SearchWidget from '@/components/SearchWidget'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data: featuredHalls } = await supabase
    .from('event_halls')
    .select(
      `
      id, name, slug, wilaya, address, capacity, price_per_day,
      rating, review_count, amenities,
      hall_photos(url, is_cover)
    `
    )
    .eq('status', 'active')
    .order('rating', { ascending: false })
    .limit(6)

  const { count: hallCount } = await supabase
    .from('event_halls')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const halls = (featuredHalls ?? []) as Array<{
    id: string
    name: string
    slug: string
    wilaya: string
    address: string
    capacity: number
    price_per_day: number
    rating: number
    review_count: number
    amenities: string[]
    hall_photos?: { url: string; is_cover: boolean }[]
  }>

  return (
    <div>
      {/* Section 1 — Hero */}
      <section
        className="w-full text-center"
        style={{
          background:
            'linear-gradient(135deg, #1A1A2E 0%, #2D2D4E 60%, #1A1A2E 100%)',
        }}
      >
        <div className="min-h-[500px] md:min-h-[580px] flex flex-col items-center justify-center px-4">
          <FadeUp>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-sm text-[#E8B86D] mb-6"
              style={{
                backgroundColor: 'rgba(232,184,109,0.15)',
                borderColor: 'rgba(232,184,109,0.3)',
              }}
            >
              <span aria-hidden>✨</span>
              <span>Algeria&apos;s #1 Hall Booking Platform</span>
            </div>

            <h1 className="text-white font-extrabold leading-[1.1] text-[36px] md:text-[56px]">
              Find Your Perfect
              <br />
              Event{' '}
              <span className="relative">
                Hall
                <span
                  className="absolute left-0 right-0 -bottom-2 h-[3px] bg-[#E8B86D]"
                  aria-hidden
                />
              </span>
            </h1>

            <p className="text-[16px] md:text-[18px] text-white/75 max-w-[520px] mx-auto mt-4">
              Browse hundreds of event halls across Algeria. Reserve in minutes,
              celebrate in style.
            </p>
          </FadeUp>

          <FadeUp delay={0.12} className="mt-10">
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                <div className="text-[28px] font-bold text-[#E8B86D]">
                  {(hallCount ?? 0).toLocaleString()}+
                </div>
                <div className="text-[13px] text-white/60">Halls listed</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/15" />
              <div className="flex flex-col items-center">
                <div className="text-[28px] font-bold text-[#E8B86D]">48+</div>
                <div className="text-[13px] text-white/60">Cities covered</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/15" />
              <div className="flex flex-col items-center">
                <div className="text-[28px] font-bold text-[#E8B86D]">2,000+</div>
                <div className="text-[13px] text-white/60">Events hosted</div>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="mt-10 w-full">
            <SearchWidget defaultGuests={2} />
          </FadeUp>
        </div>
      </section>

      {/* Section 2 — Popular Wilayas */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div>
              <h2 className="text-[28px] font-bold text-[#1A1A2E]">
                Popular destinations
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Find the perfect hall in Algeria&apos;s most popular cities
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                {
                  wilaya: 'Algiers',
                  count: 42,
                  gradient: 'linear-gradient(135deg, #1A1A2E, #2D2D4E)',
                },
                {
                  wilaya: 'Oran',
                  count: 28,
                  gradient: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                },
                {
                  wilaya: 'Constantine',
                  count: 19,
                  gradient: 'linear-gradient(135deg, #B45309, #78350F)',
                },
                {
                  wilaya: 'Blida',
                  count: 15,
                  gradient: 'linear-gradient(135deg, #065F46, #064E3B)',
                },
              ].map((d) => (
                <Link
                  key={d.wilaya}
                  href={`/halls?wilaya=${encodeURIComponent(d.wilaya)}`}
                  className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <div
                    className="h-40 relative"
                    style={{ background: d.gradient }}
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(135deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 2px, transparent 2px, transparent 10px)',
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <div className="text-white font-bold text-xl">
                        {d.wilaya}
                      </div>
                      <div className="text-white/70 text-sm">
                        {d.count} halls available
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Section 3 — Featured Halls */}
      <section className="bg-[#F7F8FA] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-[28px] font-bold text-[#1A1A2E]">
                  Top-rated halls
                </h2>
                <p className="text-sm text-[#6B7280] mt-1">
                  Handpicked venues with the highest guest ratings
                </p>
              </div>
              <Link
                href="/halls"
                className="text-[#1A1A2E] font-medium hover:underline"
              >
                View all halls →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {halls.map((hall, index) => (
                <FadeUp key={hall.id} delay={index * 0.08}>
                  <HallCard hall={hall} mode="grid" />
                </FadeUp>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Section 4 — How It Works */}
      <section id="how-it-works" className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="text-center">
              <h2 className="text-[28px] font-bold text-[#1A1A2E]">
                How Saha-Event works
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Reserve your perfect hall in three simple steps
              </p>
            </div>

            <div className="relative mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
                  <Search size={28} className="text-[#4338CA]" aria-hidden />
                </div>
                <div className="text-xs font-bold text-[#9CA3AF] mt-4">01</div>
                <div className="text-[18px] font-bold text-[#1A1A2E] mt-2">
                  Search &amp; Compare
                </div>
                <p className="text-[#6B7280] text-sm mt-2 leading-relaxed">
                  Browse halls by wilaya, capacity, and price. Filter by
                  amenities and read genuine reviews.
                </p>
              </div>

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] flex items-center justify-center">
                  <CalendarDays size={28} className="text-[#D97706]" aria-hidden />
                </div>
                <div className="text-xs font-bold text-[#9CA3AF] mt-4">02</div>
                <div className="text-[18px] font-bold text-[#1A1A2E] mt-2">
                  Book in minutes
                </div>
                <p className="text-[#6B7280] text-sm mt-2 leading-relaxed">
                  Choose your dates, upload your CCP payment receipt, and send
                  your booking request instantly.
                </p>
              </div>

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] flex items-center justify-center">
                  <PartyPopper size={28} className="text-[#059669]" aria-hidden />
                </div>
                <div className="text-xs font-bold text-[#9CA3AF] mt-4">03</div>
                <div className="text-[18px] font-bold text-[#1A1A2E] mt-2">
                  Celebrate
                </div>
                <p className="text-[#6B7280] text-sm mt-2 leading-relaxed">
                  Once the owner confirms, you&apos;re all set. Show up and enjoy
                  your perfect event.
                </p>
              </div>

              {/* dashed arrows on desktop */}
              <div className="hidden md:block absolute inset-x-0 top-8 pointer-events-none">
                <div className="absolute left-[20%] right-[54%] top-8 border-t border-dashed border-[#E5E7EB]">
                  <ArrowRight
                    size={16}
                    className="absolute -right-2 -top-2 text-[#E5E7EB]"
                    aria-hidden
                  />
                </div>
                <div className="absolute left-[54%] right-[20%] top-8 border-t border-dashed border-[#E5E7EB]">
                  <ArrowRight
                    size={16}
                    className="absolute -right-2 -top-2 text-[#E5E7EB]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Section 5 — CTA Banner */}
      <section className="px-4">
        <FadeUp className="max-w-7xl mx-auto">
          <div
            className="rounded-[24px] py-16 px-4 text-center"
            style={{
              background:
                'linear-gradient(135deg, #1A1A2E 0%, #2D2D4E 100%)',
              margin: '0 24px 80px',
            }}
          >
            <h2 className="text-white font-bold text-3xl">Own an event hall?</h2>
            <p className="text-white/70 text-base mt-3 max-w-lg mx-auto">
              Join hundreds of owners who trust Saha-Event to manage their
              bookings and grow their business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center bg-[#E8B86D] text-[#1A1A2E] rounded-xl font-semibold px-8 py-3 hover:bg-[#D4A558] active:scale-[0.98] transition-all duration-150"
              >
                List your hall
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center justify-center rounded-xl font-semibold px-8 py-3 border border-white text-white hover:bg-white hover:text-[#1A1A2E] transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Section 6 — Testimonials */}
      <section className="bg-[#F7F8FA] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <h2 className="text-[28px] font-bold text-[#1A1A2E] text-center">
              What our clients say
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <TestimonialCard
                stars={5}
                quote="Found the perfect hall for my daughter's wedding in under 10 minutes. The owner confirmed the same day. Absolutely seamless experience."
                name="Meriem B."
                city="Algiers"
                badge={null}
                avatarClassName="bg-[#1A1A2E] text-white"
              />
              <TestimonialCard
                stars={5}
                quote="As a hall owner, the platform has saved me hours every week. I manage all my bookings from one clean dashboard."
                name="Karim O."
                city="Oran"
                badge="Owner"
                avatarClassName="bg-[#E8B86D] text-[#1A1A2E]"
              />
              <TestimonialCard
                stars={5}
                quote="The receipt upload feature made the payment process so much easier. No back and forth, everything is documented."
                name="Fatima Z."
                city="Constantine"
                badge={null}
                avatarClassName="bg-[#065F46] text-white"
              />
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="text-[#E8B86D]">
          ★
        </span>
      ))}
    </div>
  )
}

function avatarInitials(name: string) {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

function TestimonialCard({
  stars,
  quote,
  name,
  city,
  badge,
  avatarClassName,
}: {
  stars: number
  quote: string
  name: string
  city: string
  badge: string | null
  avatarClassName: string
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <Stars n={stars} />
      <p className="text-[#374151] text-sm leading-relaxed mt-4">“{quote}”</p>
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarClassName}`}
        >
          {avatarInitials(name)}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <span>{name}</span>
            {badge ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3730A3]">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-[#6B7280]">{city}</div>
        </div>
      </div>
    </div>
  )
}
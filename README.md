# Saha-Event

> Algeria's trusted platform for booking event halls — built with Next.js 14, Supabase, and Vercel.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat&logo=vercel)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

**[→ View Live App](https://saha-event.vercel.app)**

---

## Overview

Saha-Event is a two-sided marketplace that allows **clients** to search,
browse, and book event halls (salles des fêtes) across Algeria, and allows
**hall owners** to list their venues, manage bookings, and track revenue —
all from one platform. Clients upload a CCP payment receipt as proof of
payment, and owners confirm or reject bookings after reviewing the receipt.

---

## Project Theme Mapping

**Theme:** Événementiel — "Saha-Event"

An extranet allowing clients to find and book event halls across Algeria,
with CCP payment receipt upload as proof of payment, and a dedicated owner
portal for hall management and booking approval.

| Role    | Table / Resource       | Description |
|---------|------------------------|-------------|
| Table A | `users`                | All registered users — both clients and owners. Managed via Supabase Auth. Fields: `id` (UUID, FK → auth.users), `role` ('client' \| 'owner' \| 'admin'), `full_name`, `phone`, `wilaya`, `avatar_url`, `created_at`. A database trigger auto-creates this row on signup, reading the role from `raw_user_meta_data`. |
| Table B | `event_halls`          | The catalog of bookable event halls. Fields: `id`, `owner_id` (FK → users), `name`, `slug`, `wilaya`, `address`, `capacity`, `price_per_day`, `description`, `amenities[]`, `rating`, `review_count`, `status` ('active' \| 'pending' \| 'inactive'). Only halls with `status = 'active'` appear in public listings. |
| Table C | `reservations`         | The join table linking clients (A) to halls (B). Fields: `id`, `client_id` (FK → users), `hall_id` (FK → event_halls), `owner_id` (FK → users, denormalized), `check_in`, `check_out`, `guest_count`, `subtotal`, `service_fee`, `total_price`, `status` (enum: pending / confirmed / rejected / cancelled / completed), `receipt_url`, `owner_response`, `special_requests`. |
| File    | CCP receipt            | The payment receipt (PDF, JPG, or PNG) uploaded by the client. Stored in Supabase Storage bucket `ccp-receipts` at path `{user_id}/{timestamp}_{filename}`. The public or signed URL is saved in `reservations.receipt_url`. |

**Supporting tables:** `owner_profiles`, `hall_photos`, `availability_blocks`,
`reviews`, `notifications`, `favorites`.

**Relationship summary:**
- One client → many reservations (1→N)
- One hall → many reservations (1→N)
- One reservation → one client + one hall (N→1 both ways)
- One reservation → one review maximum (1→1, only after status = completed)
- RLS enforces that clients see only their own reservations and owners see
  only reservations on their halls — the eliminatory security criterion.

---

## Architecture Analysis

The decision to build Saha-Event on Vercel and Supabase rather than a
traditional physical server is rooted in a fundamental distinction between
two types of IT expenditure: **CAPEX** (capital expenditure) and **OPEX**
(operational expenditure). Provisioning a physical server requires
significant upfront CAPEX — purchasing hardware, network switches, UPS
units, rack equipment, and establishing a server room with proper power
and cooling infrastructure. This capital commitment must be made before
a single user exists and before the product has proven any market fit.
Vercel and Supabase, by contrast, operate on a pure **OPEX model**: costs
are ongoing, proportional, and tied directly to actual usage. Both
platforms offer generous **free tiers** — Vercel's Hobby plan includes
unlimited deployments, while Supabase Free provides 500MB of database
storage, 1GB of file storage, and 50,000 monthly active users. A student
team can build, deploy, and run a fully functional production application
at zero cost until scale genuinely demands it. The **pay-as-you-go**
pricing eliminates financial risk during the critical early stage: the
marginal cost of serving one additional user is effectively zero at low
scale, whereas a physical server bought for peak load sits 70–80% idle
during off-peak hours, wasting capital with no return.

Scalability tells a similarly contrasting story. Scaling a physical data
center requires human intervention: ordering additional rack servers,
waiting weeks for delivery and installation, reconfiguring load balancers,
managing SSL certificate renewals, and maintaining air conditioning systems
sized for peak thermal load. A single hardware failure creates a **single
point of failure** that can take the entire application offline. Vercel's
serverless architecture eliminates this entirely through **auto-scaling**:
whether one user or ten thousand visit simultaneously, Vercel dynamically
allocates compute resources without any manual action. More significantly,
Vercel deploys on a global **edge network** spanning over 80 locations
worldwide. A request from a user in Algiers is served from the nearest
edge node — typically Paris or Frankfurt — rather than from a single
central server, dramatically reducing latency. The application's static
assets and server-rendered pages are distributed via **CDN**, meaning
repeated page loads cost almost no compute. This distributed architecture
has no geographic single point of failure; even if one edge node goes
offline, traffic is automatically rerouted through others.

The Saha-Event data model cleanly illustrates the distinction between
**structured data** and **unstructured data**. Structured data lives in
the PostgreSQL tables managed by Supabase: the `users`, `event_halls`, and
`reservations` tables each have a strict **relational schema** with typed
columns, primary keys, foreign key constraints, and check constraints.
This structure enables precise **SQL queries** — filtering halls by wilaya
and capacity, joining reservations with hall names and client profiles,
calculating total revenue per owner per month, and enforcing business rules
such as preventing overlapping confirmed bookings through the
`is_hall_available()` function. Supabase's **Row Level Security** policies
operate at this structured layer, ensuring that clients can only read their
own reservation rows and owners can only read reservations on their own
halls. Unstructured data, by contrast, lives in Supabase Storage: the CCP
payment receipts (PDF, JPEG, PNG) and hall photos are binary objects with
no internal schema. They cannot be filtered by column, joined in SQL, or
indexed for full-text search — they are referenced solely by the URL stored
in `reservations.receipt_url` or `hall_photos.url`. This **hybrid
architecture** — relational database plus object storage — precisely mirrors
the industry-standard patterns used by AWS (RDS + S3), Google Cloud
(Cloud SQL + GCS), and Microsoft Azure (SQL Database + Blob Storage),
demonstrating that even a student project can be architected to the same
standards as production enterprise systems.

---

## Tech Stack

| Layer      | Technology                  | Purpose                                   |
|------------|-----------------------------|-------------------------------------------|
| Frontend   | Next.js 16 (App Router)     | React framework with SSR and SSG          |
| Styling    | Tailwind CSS + shadcn/ui    | Utility CSS + accessible components       |
| Animation  | Framer Motion               | Page transitions and micro-interactions   |
| Auth       | Supabase Auth               | Email/password, session management, JWT   |
| Database   | Supabase (PostgreSQL)       | Relational data + RLS security            |
| Storage    | Supabase Storage            | Hall photos + CCP receipt file uploads    |
| Hosting    | Vercel                      | CI/CD, edge deployment, auto-scaling      |
| Repo       | GitHub                      | Version control, Vercel integration       |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (free)
- A Vercel account (free)

### Local setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/saha-event.git
cd saha-event

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local

# 4. Run the database schema
# Open Supabase SQL Editor, paste and run schema.sql

# 5. Create storage buckets
# In Supabase Storage, create: hall-photos (public), ccp-receipts (private), owner-docs (private)

# 6. Start development server
npm run dev

# Open http://localhost:3000
```

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Test Credentials

> **Note:** These are pre-created demo accounts for grader testing.

| Role   | Email                      | Password          |
|--------|----------------------------|-------------------|
| Client | client@saha-event.com      | TestClient2026!   |
| Owner  | owner@saha-event.com       | TestOwner2026!    |

The client account has a pre-existing pending reservation. The owner account
has 4 active hall listings and can confirm or reject the client's reservation.

---

## Project Structure

```
saha-event/
├── app/
│   ├── page.tsx                        Landing page
│   ├── layout.tsx                      Root layout (Navbar, Footer)
│   ├── error.tsx                       Global error boundary
│   ├── not-found.tsx                   Global 404 page
│   ├── halls/
│   │   ├── page.tsx                    Hall search results
│   │   ├── HallsClient.tsx             Client-side filters
│   │   └── [slug]/
│   │       ├── page.tsx                Hall detail (server)
│   │       └── HallDetailClient.tsx    Hall detail (client)
│   ├── auth/
│   │   ├── layout.tsx                  Auth layout (no Navbar)
│   │   ├── signup/page.tsx             Role choice screen
│   │   ├── signup/client/page.tsx      Client registration
│   │   ├── signup/owner/page.tsx       Owner registration
│   │   ├── signin/page.tsx             Sign in
│   │   ├── forgot-password/page.tsx    Password reset request
│   │   └── reset-password/page.tsx     New password form
│   ├── client/
│   │   ├── dashboard/page.tsx
│   │   ├── book/[slug]/
│   │   │   ├── page.tsx
│   │   │   └── BookingWizard.tsx
│   │   ├── reservations/
│   │   │   ├── page.tsx
│   │   │   ├── ReservationsClient.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── confirmed/page.tsx
│   │   │       └── review/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── profile/
│   │       ├── page.tsx
│   │       └── security/page.tsx
│   └── owner/
│       ├── dashboard/page.tsx
│       ├── halls/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       ├── edit/page.tsx
│       │       ├── photos/page.tsx
│       │       ├── availability/page.tsx
│       │       └── analytics/page.tsx
│       ├── reservations/
│       │   ├── page.tsx
│       │   ├── OwnerReservationsClient.tsx
│       │   └── [id]/page.tsx
│       ├── revenue/page.tsx
│       ├── notifications/page.tsx
│       └── profile/
│           ├── page.tsx
│           └── security/page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── HallCard.tsx
│   ├── FadeUp.tsx
│   ├── PageTransition.tsx
│   ├── SearchWidget.tsx
│   ├── auth/
│   │   ├── AuthCard.tsx
│   │   └── PasswordInput.tsx
│   ├── client/
│   │   ├── ClientLayout.tsx
│   │   └── ReservationStatusBadge.tsx
│   └── owner/
│       ├── OwnerLayout.tsx
│       └── HallStatusBadge.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── types/
│   └── database.ts
├── proxy.ts                            Route protection middleware
├── schema.sql                          Complete database schema
└── README.md
```

---

## Grading Checklist

- [x] App is live on Vercel with a public URL
- [x] Authentication: signup with role choice → signin → role-based redirect
- [x] Table A (`users`): linked to Supabase Auth, auto-created on signup via trigger
- [x] Table B (`event_halls`): browsable catalog with search, filters, and detail page
- [x] Table C (`reservations`): full booking flow — dates, guests, receipt upload, status lifecycle
- [x] File upload: CCP receipt stored in Supabase Storage (`ccp-receipts` bucket)
- [x] RLS enabled on all 9 tables — clients see only their own reservations, owners see only their halls' bookings
- [x] Two-sided marketplace: separate client and owner portals with role-based access
- [x] Owner flow: add hall → manage photos → block availability → confirm/reject bookings
- [x] GitHub repository with regular commits from both team members
- [x] Vercel CI/CD: every `git push` triggers a new deployment automatically
- [x] README with theme mapping and architecture analysis (500 words)

---

## Team

| Name         | Role                              |
|--------------|-----------------------------------|
| [Sifi Amir]  | Frontend + Deployment (Vercel/CI) |
| [Student 2]  | Backend + Database (Supabase/RLS) |

**Module:** Architecture Cloud & Vibe Programming — 2CP 2026
**Institution:** [Your institution]

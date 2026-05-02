"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  CalendarDays,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Heart,
  Bookmark,
  UserRound,
  Building2,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"

type Profile = { role: UserRole; full_name: string; avatar_url: string | null } | null

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + last).toUpperCase()
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = useMemo(() => {
    const isOwner = profile?.role === "owner"
    return [
      { href: "/halls", label: "Find a Hall", active: pathname === "/halls" },
      { href: "/#how-it-works", label: "How it works", active: pathname === "/" && false },
      ...(isOwner
        ? []
        : [{ href: "/auth/signup", label: "List your hall", active: pathname.startsWith("/auth") }]),
    ]
  }, [pathname, profile?.role])

// Find the useEffect that fetches the user and replace it with this:
useEffect(() => {
  const supabase = createClient()

  // Fetch immediately on mount
  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role, full_name, avatar_url')
        .eq('id', user.id)
        .single()
      setProfile(data)
    } else {
      setProfile(null)
    }
  }
  fetchUser()

  // Also listen for auth state changes — this fires on signin/signout
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isAuthed = Boolean(profile)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] h-16 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CalendarDays size={20} className="text-[#E8B86D]" />
            <span className="text-[20px] font-bold text-[#1A1A2E] lowercase tracking-tight">
              saha·event
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className={cn(
                  "text-sm font-medium text-[#4B5563] hover:text-[#1A1A2E] transition-colors duration-150 pb-1",
                  l.active && "text-[#1A1A2E] border-b-2 border-[#E8B86D]"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isAuthed ? (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm rounded-xl border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#F0F0F6]"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="px-4 py-2 text-sm rounded-xl font-semibold bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558] active:scale-[0.98] transition-all duration-150">
                    Get started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      profile?.role === "owner"
                        ? "/owner/notifications"
                        : "/client/notifications"
                    )
                  }
                  className="relative h-10 w-10 rounded-xl hover:bg-[#F7F8FA] flex items-center justify-center transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-[#1A1A2E]" />
                  {hasUnread ? (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                  ) : null}
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center font-bold text-sm"
                      aria-label="Open user menu"
                    >
                      {initialsFromName(profile?.full_name ?? "User")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    {profile?.role === "owner" ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => router.push("/owner/dashboard")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <LayoutDashboard size={16} /> My Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/owner/halls")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <Building2 size={16} /> My Halls
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/owner/reservations")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <Bookmark size={16} /> Reservations
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/owner/profile")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <UserRound size={16} /> Account
                        </button>
                        <Separator className="my-2 bg-[#E5E7EB]" />
                        <button
                          type="button"
                          onClick={signOut}
                          className="w-full px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => router.push("/client/dashboard")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <LayoutDashboard size={16} /> My Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/client/reservations")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <Bookmark size={16} /> My Reservations
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/client/favorites")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <Heart size={16} /> Favorites
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/client/profile")}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[#F7F8FA] flex items-center gap-2 text-sm"
                        >
                          <UserRound size={16} /> Account
                        </button>
                        <Separator className="my-2 bg-[#E5E7EB]" />
                        <button
                          type="button"
                          onClick={signOut}
                          className="w-full px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <button
              type="button"
              className="md:hidden h-10 w-10 rounded-xl hover:bg-[#F7F8FA] flex items-center justify-center"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} className="text-[#1A1A2E]" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/20"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-x-0 top-0 bg-white border-b border-[#E5E7EB] shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <CalendarDays size={20} className="text-[#E8B86D]" />
                  <span className="text-[20px] font-bold text-[#1A1A2E] lowercase tracking-tight">
                    saha·event
                  </span>
                </Link>
                <button
                  type="button"
                  className="h-10 w-10 rounded-xl hover:bg-[#F7F8FA] flex items-center justify-center"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} className="text-[#1A1A2E]" />
                </button>
              </div>

              <div className="px-4 pb-6 space-y-2">
                {navLinks.map((l) => (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 rounded-xl hover:bg-[#F7F8FA] text-[#1A1A2E] font-medium"
                  >
                    {l.label}
                  </Link>
                ))}

                <div className="pt-2">
                  {!isAuthed ? (
                    <div className="grid grid-cols-1 gap-3">
                      <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-xl border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#F0F0F6]"
                        >
                          Sign in
                        </Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full h-11 rounded-xl font-semibold bg-[#E8B86D] text-[#1A1A2E] hover:bg-[#D4A558]">
                          Get started
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false)
                          router.push(profile?.role === "owner" ? "/owner/dashboard" : "/client/dashboard")
                        }}
                        className="w-full h-11 rounded-xl font-semibold bg-[#1A1A2E] text-white hover:bg-[#2D2D4E]"
                      >
                        My dashboard
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false)
                          void signOut()
                        }}
                        variant="outline"
                        className="w-full h-11 rounded-xl border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}


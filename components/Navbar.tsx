'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const links = [
    { href: '/', label: 'Overview' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/submit', label: 'Submit' },
    { href: '/submissions', label: 'Projects' },
  ]

  return (
    <header className="border-b border-zinc-850 bg-zinc-950/95 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 min-h-[64px] flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="AI Generation Club"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-500/30 group-hover:ring-emerald-400/50 transition-all shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors leading-none">
              AI Generation Club
            </span>
            <span className="text-[10px] text-emerald-400/90 font-medium tracking-wide uppercase mt-1 leading-none">
              AIGen Hackathon
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 text-xs overflow-x-auto py-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap font-medium ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Auth / Profile */}
        <div className="flex items-center gap-2.5 text-xs">
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline-block max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-red-400 text-xs transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs transition-all shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}

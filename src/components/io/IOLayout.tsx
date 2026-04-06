'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpToLine,
  Home, Globe, FileText, BookOpen,
  LogOut, Menu, X, Sun, Moon, ChevronRight,
} from 'lucide-react'

const BASE             = '/inward-outward'
const SESSION_KEY      = 'io-last-activity'
const REMEMBER_KEY     = 'io-remember-me'
const INACTIVITY_MS    = 24 * 60 * 60 * 1000   // 24 hours
const CHECK_INTERVAL   = 60 * 1000              // check every minute

const NAV = [
  { href: `${BASE}/dashboard`,      label: 'Dashboard',     icon: LayoutDashboard },
  { href: `${BASE}/inward`,         label: 'Inward',        icon: ArrowDownToLine },
  { href: `${BASE}/outward`,        label: 'Outward',       icon: ArrowUpToLine },
  { href: `${BASE}/domestic`,       label: 'Domestic',      icon: Home },
  { href: `${BASE}/international`,  label: 'International', icon: Globe },
  { href: `${BASE}/quotation`,      label: 'Quotation',     icon: FileText },
  { href: `${BASE}/master`,         label: 'Master',        icon: BookOpen },
]

export default function IOLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [themeMounted, setThemeMounted] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/inward-outward/login'); return }

      // Check inactivity session (skip if remember-me is on)
      const remember = localStorage.getItem(REMEMBER_KEY) === 'true'
      if (!remember) {
        const last = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10)
        if (last && Date.now() - last > INACTIVITY_MS) {
          supabase.auth.signOut()
          router.replace('/inward-outward/login')
          return
        }
      }

      setUser(data.user)
    })
  }, [])

  // Activity tracking — update timestamp on every interaction
  useEffect(() => {
    const bump = () => {
      const remember = localStorage.getItem(REMEMBER_KEY) === 'true'
      if (!remember) localStorage.setItem(SESSION_KEY, Date.now().toString())
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(ev => window.addEventListener(ev, bump, { passive: true }))

    // Periodic check every minute
    const timer = setInterval(() => {
      const remember = localStorage.getItem(REMEMBER_KEY) === 'true'
      if (remember) return
      const last = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10)
      if (last && Date.now() - last > INACTIVITY_MS) {
        supabase.auth.signOut()
        router.replace('/inward-outward/login')
      }
    }, CHECK_INTERVAL)

    return () => {
      events.forEach(ev => window.removeEventListener(ev, bump))
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const saved = (localStorage.getItem('io-theme') as 'dark' | 'light' | null) ?? 'light'
    setTheme(saved)
    document.documentElement.dataset.theme = saved
    setThemeMounted(true)
  }, [])

  useEffect(() => {
    if (!themeMounted) return
    document.documentElement.dataset.theme = theme
    localStorage.setItem('io-theme', theme)
  }, [theme, themeMounted])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(REMEMBER_KEY)
    await supabase.auth.signOut()
    router.replace('/inward-outward/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <div className="font-display text-lg font-bold text-primary tracking-wider uppercase">
              I/<span className="text-inputer">O</span> Portal
            </div>
            <div className="font-mono text-[10px] text-muted tracking-widest">INWARD · OUTWARD</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="text-muted hover:text-primary p-2 border border-border rounded-lg bg-layer-sm"
          >
            {!themeMounted || theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted hover:text-primary p-1">
            <X size={20}/>
          </button>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border text-inputer border-inputer/30 bg-inputer/10">
          <div className="w-8 h-8 rounded-lg bg-inputer/20 flex items-center justify-center text-sm font-bold flex-shrink-0 text-inputer">
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary truncate">{user?.email ?? '—'}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">I/O User</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 group min-h-[44px]',
                active
                  ? 'text-primary font-medium bg-inputer/15 border border-inputer/30'
                  : 'text-muted hover:text-primary hover:bg-layer-sm'
              )}
            >
              <Icon
                size={17}
                className={active ? 'text-inputer' : 'text-muted group-hover:text-primary'}
              />
              {label}
              {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16}/> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col fixed top-0 left-0 h-screen z-30"
        style={{ background: 'var(--color-panel)', borderRight: '1px solid var(--color-border)' }}>
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 z-50"
            style={{ background: 'var(--color-panel)', borderRight: '1px solid var(--color-border)' }}>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border"
          style={{ background: 'var(--color-panel)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-primary">
            <Menu size={20}/>
          </button>
          <div className="text-sm font-bold text-primary">I/O Portal</div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, FlaskConical,
  Factory, BarChart3, LogOut, ChevronRight,
  Users, Shield, Menu, X, Sun, Moon, CalendarRange
} from 'lucide-react'

interface NavItem { href: string; label: string; icon: React.ReactNode }

const navByRole: Record<Role, NavItem[]> = {
  owner: [
    { href: '/owner',             label: 'Dashboard',    icon: <LayoutDashboard size={18}/> },
    { href: '/owner/factories',   label: 'Factories',    icon: <Factory size={18}/> },
    { href: '/owner/stock',       label: 'Stock Ledger', icon: <Package size={18}/> },
    { href: '/owner/usage',       label: 'Usage Log',    icon: <FlaskConical size={18}/> },
    { href: '/owner/monthly-entry', label: 'Monthly Material', icon: <CalendarRange size={18}/> },
    { href: '/owner/reports',     label: 'Reports',      icon: <BarChart3 size={18}/> },
    { href: '/owner/permissions', label: 'Permissions',  icon: <Shield size={18}/> },
    { href: '/owner/users',       label: 'Users',        icon: <Users size={18}/> },
  ],
  inputer: [
    { href: '/inputer',         label: 'Dashboard',  icon: <LayoutDashboard size={18}/> },
    { href: '/inputer/new',     label: 'New Entry',  icon: <Package size={18}/> },
    { href: '/inputer/history', label: 'My Entries', icon: <BarChart3 size={18}/> },
  ],
  chemist: [
    { href: '/chemist',         label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
    { href: '/chemist/use',     label: 'Log Usage', icon: <FlaskConical size={18}/> },
    { href: '/chemist/monthly-entry', label: 'Monthly Material', icon: <CalendarRange size={18}/> },
    { href: '/chemist/history', label: 'My Usage',  icon: <BarChart3 size={18}/> },
  ],
}

const roleColors: Record<Role, string> = {
  owner:   'text-owner border-owner/30 bg-owner/10',
  inputer: 'text-inputer border-inputer/30 bg-inputer/10',
  chemist: 'text-chemist border-chemist/30 bg-chemist/10',
}
const roleAccent: Record<Role, string> = {
  owner:   'bg-owner',
  inputer: 'bg-inputer',
  chemist: 'bg-chemist',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()
  const role     = profile?.role ?? 'chemist'
  const navItems = navByRole[role]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = (localStorage.getItem('theme') as 'dark' | 'light' | null) ?? 'dark'
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = saved
    return saved
  })

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Theme persistence
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  function navigate(href: string) {
    setSidebarOpen(false)
    router.push(href)
  }

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  const accentText = role === 'owner' ? 'text-owner' : role === 'inputer' ? 'text-inputer' : 'text-chemist'
  const accentBg   = role === 'owner' ? 'bg-owner'   : role === 'inputer' ? 'bg-inputer'   : 'bg-chemist'

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(item => {
        const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href))
        return (
          <button
            key={item.href}
            onPointerDown={() => navigate(item.href)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 group',
              active
                ? clsx('text-primary font-medium',
                    role === 'owner'   ? 'bg-owner/15 border border-owner/30' :
                    role === 'inputer' ? 'bg-inputer/15 border border-inputer/30' :
                                         'bg-chemist/15 border border-chemist/30')
                : 'text-muted hover:text-primary hover:bg-layer-sm'
            )}
          >
            <span className={active ? accentText : 'text-muted group-hover:text-primary'}>
              {item.icon}
            </span>
            {item.label}
            {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </button>
        )
      })}
    </nav>
  )

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚗️</span>
          <div>
            <div className="font-display text-lg font-bold text-primary tracking-wider uppercase">
              Chem<span className={accentText}>Factory</span>
            </div>
            <div className="font-mono text-[10px] text-muted tracking-widest">MANAGEMENT PORTAL</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-muted hover:text-primary p-2 border border-border rounded-lg bg-layer-sm"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted hover:text-primary p-1">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-4 border-b border-border">
        <div className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 border', roleColors[role])}>
          <div className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-primary truncate">{profile?.full_name}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">{role}</div>
          </div>
        </div>
      </div>

      <NavLinks />

      {/* Factories */}
      {profile?.factories && profile.factories.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">Assigned Factories</div>
          {profile.factories.slice(0, 3).map((f: any) => (
            <div key={f.id} className="flex items-center gap-2 py-1">
              <div className={clsx('w-1.5 h-1.5 rounded-full', accentBg)} />
              <span className="text-xs text-muted truncate">{f.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-panel border-r border-border flex-col fixed top-0 left-0 h-screen z-30">
        <SidebarInner />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-72 bg-panel border-r border-border flex flex-col z-50">
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-panel border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-primary p-2">
            <Menu size={22} />
          </button>
          <div className="font-display text-base font-bold text-primary tracking-wider uppercase">
            Chem<span className={accentText}>Factory</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-muted hover:text-primary p-2 border border-border rounded-lg bg-layer-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold', roleColors[role])}>
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </div>

        <main className="flex-1 grid-bg">
          {children}
        </main>

      </div>
    </div>
  )
}

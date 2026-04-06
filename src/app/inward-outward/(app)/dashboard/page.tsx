'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { fetchIOStats, fetchInwards, fetchOutwards, fetchDomestics, fmtDate } from '@/lib/io/api'
import {
  ArrowDownToLine, ArrowUpToLine, Home, Globe, FileText,
  TrendingUp, Building2,
} from 'lucide-react'

const BASE = '/inward-outward'

interface Stats {
  inward: number; outward: number; domestic: number; international: number; quotations: number
}

export default function IODashboard() {
  const { profile } = useAuth()
  const [factoryId, setFactoryId] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInwards, setRecentInwards] = useState<any[]>([])
  const [recentOutwards, setRecentOutwards] = useState<any[]>([])
  const [recentDomestics, setRecentDomestics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const factories = profile?.factories ?? []

  useEffect(() => {
    if (profile && factories.length > 0 && !factoryId) {
      setFactoryId(factories[0].id)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [factoryId])

  async function load() {
    setLoading(true)
    try {
      const fid = factoryId || undefined
      const [s, inwards, outwards, domestics] = await Promise.all([
        fetchIOStats(fid),
        fetchInwards(fid),
        fetchOutwards(fid),
        fetchDomestics(fid),
      ])
      setStats(s)
      setRecentInwards(inwards.slice(0, 5))
      setRecentOutwards(outwards.slice(0, 5))
      setRecentDomestics(domestics.slice(0, 5))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const kpis = stats ? [
    { label: 'Inward',        value: stats.inward,         icon: ArrowDownToLine, colorVar: 'var(--color-inputer)', href: `${BASE}/inward` },
    { label: 'Outward',       value: stats.outward,        icon: ArrowUpToLine,   colorVar: 'var(--color-owner)',   href: `${BASE}/outward` },
    { label: 'Domestic',      value: stats.domestic,       icon: Home,            colorVar: 'var(--color-chemist)', href: `${BASE}/domestic` },
    { label: 'International', value: stats.international,  icon: Globe,           colorVar: 'var(--color-owner)',   href: `${BASE}/international` },
    { label: 'Quotations',    value: stats.quotations,     icon: FileText,        colorVar: 'var(--color-muted)',   href: `${BASE}/quotation` },
  ] : []

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Overview of all transactions</p>
        </div>
        {factories.length > 1 && (
          <select
            value={factoryId}
            onChange={e => setFactoryId(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Factories</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-8 w-8 bg-layer rounded-lg mb-3" />
              <div className="h-6 w-12 bg-layer rounded mb-1" />
              <div className="h-3 w-16 bg-layer rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map(({ label, value, icon: Icon, colorVar, href }) => (
            <Link key={label} href={href} className="card p-4 hover:shadow-sm transition-all group" style={{ ['--kpi-color' as any]: colorVar }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-layer">
                <Icon size={17} style={{ color: colorVar }} />
              </div>
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Inwards */}
        <RecentTable
          title="Recent Inward"
          icon={<ArrowDownToLine size={14} className="text-inputer" />}
          href={`${BASE}/inward`}
          loading={loading}
          rows={recentInwards.map(r => ({
            number: r.inward_number,
            party: r.supplier?.company_name ?? '—',
            date: fmtDate(r.inward_date),
            total: r.items?.reduce((s: number, it: any) => s + it.price * it.quantity, 0) ?? 0,
          }))}
        />
        {/* Recent Outwards */}
        <RecentTable
          title="Recent Outward"
          icon={<ArrowUpToLine size={14} style={{ color: 'var(--color-owner)' }} />}
          href={`${BASE}/outward`}
          loading={loading}
          rows={recentOutwards.map(r => ({
            number: r.outward_number,
            party: r.supplier?.company_name ?? '—',
            date: fmtDate(r.outward_date),
            total: r.items?.reduce((s: number, it: any) => s + it.price * it.quantity, 0) ?? 0,
          }))}
        />
        {/* Recent Domestic */}
        <RecentTable
          title="Recent Domestic"
          icon={<Home size={14} style={{ color: 'var(--color-chemist)' }} />}
          href={`${BASE}/domestic`}
          loading={loading}
          rows={recentDomestics.map(r => ({
            number: r.invoice_number,
            party: r.customer?.company_name ?? '—',
            date: fmtDate(r.invoice_date),
            total: r.items?.reduce((s: number, it: any) => s + it.price * it.quantity, 0) ?? 0,
          }))}
        />
      </div>
    </div>
  )
}

function RecentTable({ title, icon, href, loading, rows }: {
  title: string
  icon: React.ReactNode
  href: string
  loading: boolean
  rows: { number: string; party: string; date: string; total: number }[]
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {icon} {title}
        </div>
        <Link href={href} className="text-xs text-inputer hover:underline">View all</Link>
      </div>
      {loading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-layer-sm rounded animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">No records yet</div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-xs font-mono font-semibold text-primary">{r.number}</div>
                <div className="text-[11px] text-muted">{r.party} · {r.date}</div>
              </div>
              <div className="text-xs font-semibold text-primary-70">
                ₹{r.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

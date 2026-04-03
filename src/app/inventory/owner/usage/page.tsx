'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function OwnerUsagePage() {
  const { profile, loading: authLoading } = useAuth()
  const [entries, setEntries]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [factory, setFactory]     = useState('all')
  const [factories, setFactories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (authLoading) return
      const factoryIds = (profile?.factories ?? []).map((f: any) => f.id).filter(Boolean)
      if (factoryIds.length === 0) {
        setEntries([]); setFactories([]); setLoading(false); return
      }
      const [e, f] = await Promise.all([
        supabase.from('usage_entries')
          .select('*, factories(name), profiles(full_name)')
          .in('factory_id', factoryIds)
          .order('created_at', { ascending: false }),
        supabase.from('factories').select('id, name').in('id', factoryIds),
      ])
      const entryList = e.data ?? []

      // Fetch remaining/loaded for each invoice
      const invNums = Array.from(new Set(entryList.map((x: any) => x.invoice_number).filter(Boolean)))
      const balMap: Record<string, { tons_remaining: number | null; tons_loaded: number | null }> = {}
      let stockMap: Record<string, { supplier_name: string | null; material_type: string | null; tons_loaded: number | null }> = {}
      if (invNums.length > 0) {
        const [{ data: bals }, { data: stocks }] = await Promise.all([
          supabase
            .from('stock_balance')
            .select('invoice_number, tons_remaining, tons_loaded')
            .in('invoice_number', invNums),
          supabase
            .from('stock_entries_safe')
            .select('invoice_number, supplier_name, material_type, tons_loaded')
            .in('invoice_number', invNums),
        ])
        ;(bals ?? []).forEach((b: any) => { balMap[b.invoice_number] = { tons_remaining: b.tons_remaining, tons_loaded: b.tons_loaded } })
        stockMap = Object.fromEntries(
          (stocks ?? []).map((s: any) => [s.invoice_number, {
            supplier_name: s.supplier_name,
            material_type: s.material_type,
            tons_loaded: s.tons_loaded,
          }])
        )
      }

      // Compute remaining after each usage entry (per invoice)
      const grouped: Record<string, any[]> = {}
      entryList.forEach((entry: any) => {
        if (!grouped[entry.invoice_number]) grouped[entry.invoice_number] = []
        grouped[entry.invoice_number].push(entry)
      })

      const remainingById: Record<string, number | null> = {}
      Object.entries(grouped).forEach(([inv, list]) => {
        list.sort((a, b) => {
          const aDate = new Date(a.usage_date).getTime()
          const bDate = new Date(b.usage_date).getTime()
          if (aDate !== bDate) return aDate - bDate
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        const totalLoaded =
          Number(stockMap[inv]?.tons_loaded) ||
          Number(balMap[inv]?.tons_loaded) ||
          (balMap[inv]?.tons_remaining !== undefined && balMap[inv]?.tons_remaining !== null
            ? Number(balMap[inv]?.tons_remaining) + list.reduce((s, x) => s + Number(x.tons_used || 0), 0)
            : 0)

        let remaining = totalLoaded
        list.forEach((entry: any) => {
          remaining -= Number(entry.tons_used || 0)
          remainingById[entry.id] = remaining
        })
      })

      setEntries(entryList.map((e: any) => ({
        ...e,
        stock_entries: stockMap[e.invoice_number] ?? null,
        kgs_remaining: remainingById[e.id] ?? balMap[e.invoice_number]?.tons_remaining ?? null,
      })))
      setFactories(f.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = entries.filter(e => {
    const matchSearch  = !search  || e.invoice_number?.toLowerCase().includes(search.toLowerCase())
    const matchFactory = factory === 'all' || e.factory_id === factory
    return matchSearch && matchFactory
  })

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader title="Usage Log" subtitle="Owner · All Consumption Records" accent="owner" />

        <div className="flex flex-wrap gap-3 mb-6">
          <input className="input-field owner-focus max-w-xs" placeholder="Search invoice..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="input-field owner-focus max-w-xs" value={factory} onChange={e=>setFactory(e.target.value)}>
            <option value="all">All Factories</option>
            {factories.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-owner border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier / Product</th>
                      <th>Invoice</th>
                      <th>Batch ID</th>
                      <th>Batch Month</th>
                      <th>Factory</th>
                      <th>Chemist</th>
                      <th>Material</th>
                      <th>KGS Used</th>
                      <th>Remaining KGS</th>
                      <th>Shift</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => {
                      const remaining = e.kgs_remaining
                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="text-chemist font-semibold text-sm">{e.stock_entries?.supplier_name ?? '—'}</div>
                            <div className="text-primary text-xs">{e.stock_entries?.material_type ?? '—'}</div>
                          </td>
                          <td className="font-mono text-chemist text-xs">{e.invoice_number}</td>
                          <td className="text-xs text-primary">{e.batch_id ?? '—'}</td>
                          <td className="text-xs text-primary">{e.batch_month ?? '—'}</td>
                          <td className="text-primary text-xs">{e.factories?.name}</td>
                          <td className="text-primary">{e.profiles?.full_name}</td>
                          <td className="text-muted">{e.stock_entries?.material_type}</td>
                          <td className="font-mono text-chemist">{e.tons_used} KGS</td>
                          <td className={`font-mono ${remaining !== null && Number(remaining) < 5 ? 'text-red-400' : 'text-chemist'}`}>
                            {remaining !== null ? `${Number(remaining).toFixed(3)} KGS` : '—'}
                          </td>
                          <td>{e.shift ? <span className="badge badge-muted capitalize">{e.shift}</span> : '—'}</td>
                          <td className="text-muted text-xs">{new Date(e.usage_date).toLocaleDateString('en-IN')}</td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-muted py-12">No usage records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden data-card-list p-4">
                {filtered.length === 0 && (
                  <div className="text-center text-muted py-6 border border-dashed border-[color-mix(in srgb, var(--color-border) 80%, transparent)] rounded-lg">
                    No usage records found
                  </div>
                )}
                {filtered.map(e => {
                  const remaining = e.kgs_remaining
                  return (
                    <div key={e.id} className="data-card">
                      <div className="data-card-header">
                        <div>
                          <div className="text-chemist font-semibold text-sm">{e.stock_entries?.supplier_name ?? '—'}</div>
                          <div className="text-primary text-xs">{e.stock_entries?.material_type ?? '—'}</div>
                          <div className="data-card-title font-mono text-[11px] text-muted">{e.invoice_number}</div>
                        </div>
                        <span className="data-card-meta">{new Date(e.usage_date).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="data-card-grid">
                        <span className="data-card-label">Factory</span>
                        <span className="data-card-value">{e.factories?.name ?? '—'}</span>

                        <span className="data-card-label">Chemist</span>
                        <span className="data-card-value">{e.profiles?.full_name ?? '—'}</span>

                        <span className="data-card-label">Material</span>
                        <span className="text-muted text-right">{e.stock_entries?.material_type ?? '—'}</span>

                        <span className="data-card-label">Batch ID</span>
                        <span className="text-primary text-right">{e.batch_id ?? '—'}</span>

                        <span className="data-card-label">Batch Month</span>
                        <span className="text-primary text-right">{e.batch_month ?? '—'}</span>

                        <span className="data-card-label">Used</span>
                        <span className="font-mono text-chemist text-right">{e.tons_used} KGS</span>

                        <span className="data-card-label">Remaining</span>
                        <span className={`font-mono text-right ${remaining !== null && Number(remaining) < 5 ? 'text-red-400' : 'text-chemist'}`}>
                          {remaining !== null ? `${Number(remaining).toFixed(3)} KGS` : '—'}
                        </span>

                        <span className="data-card-label">Shift</span>
                        <span className="text-right">
                          {e.shift ? <span className="badge badge-muted capitalize">{e.shift}</span> : <span className="text-muted">—</span>}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

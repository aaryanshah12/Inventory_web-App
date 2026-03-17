'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { StockEntry } from '@/types'
import { Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function OwnerStockPage() {
  const { profile, loading: authLoading } = useAuth()
  const [entries, setEntries]     = useState<StockEntry[]>([])
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
        supabase.from('stock_entries').select('*, factories(name), profiles(full_name)').in('factory_id', factoryIds).order('created_at', { ascending: false }),
        supabase.from('factories').select('id, name').in('id', factoryIds),
      ])
      setEntries(e.data ?? [])
      setFactories(f.data ?? [])
      setLoading(false)
    }
    load()
  }, [authLoading, profile])

  const filtered = entries.filter(e => {
    const matchSearch  = !search  || e.invoice_number.toLowerCase().includes(search.toLowerCase()) || e.supplier_name.toLowerCase().includes(search.toLowerCase())
    const matchFactory = factory === 'all' || e.factory_id === factory
    return matchSearch && matchFactory
  })

  const totalValue = filtered.reduce((s,e) => s + Number(e.total_value), 0)

  const formatCsvValue = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }

  const handleExport = () => {
    if (loading) return
    if (filtered.length === 0) {
      alert('No records to export')
      return
    }
    const headers = [
      'Invoice',
      'Factory',
      'Supplier',
      'Material',
      'KGS_Loaded',
      'Rate_Per_Ton',
      'Total_Value',
      'Entry_Date',
      'Created_By',
    ]
    const rows = filtered.map(e => [
      e.invoice_number,
      (e as any).factories?.name ?? '',
      e.supplier_name,
      e.material_type,
      Number(e.tons_loaded ?? 0),
      Number(e.rate_per_ton ?? 0),
      Number(e.total_value ?? 0),
      new Date(e.entry_date).toISOString().slice(0, 10),
      (e as any).profiles?.full_name ?? '',
    ])
    const lines = [headers.join(','), ...rows.map(r => r.map(formatCsvValue).join(','))]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const factoryLabel = factory === 'all' ? 'all' : (factories.find(f => f.id === factory)?.name ?? factory)
    link.download = `stock-ledger_${factoryLabel}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Stock Ledger"
          subtitle="Owner · All Loading Records"
          accent="owner"
          actions={
            <button className="btn btn-owner gap-2" onClick={handleExport} disabled={loading || filtered.length === 0}>
              <Download size={15}/> Export CSV
            </button>
          }
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <input className="input-field owner-focus max-w-xs" placeholder="Search invoice or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field owner-focus max-w-xs" value={factory} onChange={e => setFactory(e.target.value)}>
            <option value="all">All Factories</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-xs text-muted">Total Value:</span>
            <span className="font-display text-lg font-bold text-owner">₹{(totalValue/100000).toFixed(2)}L</span>
          </div>
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
                      <th>Invoice No.</th>
                      <th>Factory</th>
                      <th>Supplier</th>
                      <th>Material</th>
                      <th>KGS</th>
                      <th>Rate / Ton</th>
                      <th>Total Value</th>
                      <th>Date</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={e.id}>
                        <td className="font-mono text-inputer text-xs">{e.invoice_number}</td>
                        <td className="text-primary text-xs">{(e as any).factories?.name}</td>
                        <td className="text-primary">{e.supplier_name}</td>
                        <td className="text-muted">{e.material_type}</td>
                        <td className="font-mono text-inputer">{e.tons_loaded} KGS</td>
                        <td className="font-mono text-owner">₹{e.rate_per_ton}</td>
                        <td className="font-mono font-bold text-owner">₹{Number(e.total_value).toLocaleString('en-IN')}</td>
                        <td className="text-muted text-xs">{new Date(e.entry_date).toLocaleDateString('en-IN')}</td>
                        <td className="text-muted text-xs">{(e as any).profiles?.full_name}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="text-center text-muted py-12">No records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden data-card-list p-4">
                {filtered.length === 0 && (
                  <div className="text-center text-muted py-6 border border-dashed border-[color-mix(in srgb, var(--color-border) 80%, transparent)] rounded-lg">
                    No records found
                  </div>
                )}
                {filtered.map(e => (
                  <div key={e.id} className="data-card">
                    <div className="data-card-header">
                      <span className="data-card-title text-inputer">{e.invoice_number}</span>
                      <span className="data-card-meta">{new Date(e.entry_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="data-card-grid">
                      <span className="data-card-label">Factory</span>
                      <span className="data-card-value">{(e as any).factories?.name ?? '—'}</span>

                      <span className="data-card-label">Supplier</span>
                      <span className="data-card-value">{e.supplier_name}</span>

                      <span className="data-card-label">Material</span>
                      <span className="text-muted text-right">{e.material_type}</span>

                      <span className="data-card-label">KGS</span>
                      <span className="font-mono text-inputer text-right">{e.tons_loaded} KGS</span>

                      <span className="data-card-label">Rate / Ton</span>
                      <span className="font-mono text-owner text-right">₹{e.rate_per_ton}</span>

                      <span className="data-card-label">Total Value</span>
                      <span className="font-mono text-owner font-bold text-right">₹{Number(e.total_value).toLocaleString('en-IN')}</span>

                      <span className="data-card-label">By</span>
                      <span className="text-muted text-right">{(e as any).profiles?.full_name ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

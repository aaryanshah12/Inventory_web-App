'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { StockEntry } from '@/types'
import { Download } from 'lucide-react'

export default function OwnerStockPage() {
  const [entries, setEntries]     = useState<StockEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [factory, setFactory]     = useState('all')
  const [factories, setFactories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [e, f] = await Promise.all([
        supabase.from('stock_entries').select('*, factories(name), profiles(full_name)').order('created_at', { ascending: false }),
        supabase.from('factories').select('id, name'),
      ])
      setEntries(e.data ?? [])
      setFactories(f.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = entries.filter(e => {
    const matchSearch  = !search  || e.invoice_number.toLowerCase().includes(search.toLowerCase()) || e.supplier_name.toLowerCase().includes(search.toLowerCase())
    const matchFactory = factory === 'all' || e.factory_id === factory
    return matchSearch && matchFactory
  })

  const totalValue = filtered.reduce((s,e) => s + Number(e.total_value), 0)

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Stock Ledger"
          subtitle="Owner · All Loading Records"
          accent="owner"
          actions={<button className="btn btn-owner gap-2"><Download size={15}/> Export</button>}
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
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-owner border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

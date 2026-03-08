'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'

export default function OwnerUsagePage() {
  const [entries, setEntries]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [factory, setFactory]     = useState('all')
  const [factories, setFactories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [e, f] = await Promise.all([
        supabase.from('usage_entries')
          .select('*, factories(name), profiles(full_name), stock_entries(supplier_name, material_type)')
          .order('created_at', { ascending: false }),
        supabase.from('factories').select('id, name'),
      ])
      const entryList = e.data ?? []
      // Fetch remaining balance for each invoice
      const invNums = [...new Set(entryList.map((x: any) => x.invoice_number).filter(Boolean))]
      let balMap: Record<string, number> = {}
      if (invNums.length > 0) {
        const { data: bals } = await supabase
          .from('stock_balance')
          .select('invoice_number, tons_remaining')
          .in('invoice_number', invNums)
        ;(bals ?? []).forEach((b: any) => { balMap[b.invoice_number] = b.tons_remaining })
      }
      setEntries(entryList.map((e: any) => ({ ...e, kgs_remaining: balMap[e.invoice_number] ?? null })))
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
                        <td className="font-mono text-chemist text-xs">{e.invoice_number}</td>
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
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

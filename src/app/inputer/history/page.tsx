'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function InputerHistoryPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('stock_entries')
      .select('*, factories(name)')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [profile])

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="My Stock Entries"
          subtitle="Inputer · Entry History"
          accent="inputer"
          actions={<Link href="/inputer/new" className="btn btn-inputer gap-2"><Plus size={15}/> New Entry</Link>}
        />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-inputer border-t-transparent rounded-full animate-spin" />
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
                    <th>Vehicle</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td className="font-mono text-inputer text-xs">{e.invoice_number}</td>
                      <td className="text-primary text-xs">{e.factories?.name}</td>
                      <td className="text-primary">{e.supplier_name}</td>
                      <td className="text-muted">{e.material_type}</td>
                      <td className="font-mono text-inputer">{e.tons_loaded} KGS</td>
                      <td className="text-muted text-xs">{e.vehicle_number ?? '—'}</td>
                      <td className="text-muted text-xs">{new Date(e.entry_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted py-12">
                      No entries yet. <Link href="/inputer/new" className="text-inputer">Create one →</Link>
                    </td></tr>
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

'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import clsx from 'clsx'

export default function ChemistHistoryPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('usage_entries')
      .select('*, factories(name)')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [profile])

  const shiftColors: Record<string, string> = {
    morning:   'badge-inputer',
    afternoon: 'badge-owner',
    night:     'badge-muted',
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="My Usage History"
          subtitle="Chemist · Consumption Log"
          accent="chemist"
          actions={<Link href="/chemist/use" className="btn btn-chemist gap-2"><Plus size={15}/> Log Usage</Link>}
        />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-chemist border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Factory</th>
                    <th>KGS Used</th>
                    <th>Process ID</th>
                    <th>Shift</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td className="font-mono text-chemist text-xs">{e.invoice_number}</td>
                      <td className="text-primary text-xs">{e.factories?.name}</td>
                      <td className="font-mono text-chemist font-bold">{e.tons_used} KGS</td>
                      <td className="text-muted text-xs">{e.process_id ?? '—'}</td>
                      <td>
                        {e.shift
                          ? <span className={`badge ${shiftColors[e.shift] ?? 'badge-muted'} capitalize`}>{e.shift}</span>
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td className="text-muted text-xs">{new Date(e.usage_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-12">
                      No usage logged yet. <Link href="/chemist/use" className="text-chemist">Log now →</Link>
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

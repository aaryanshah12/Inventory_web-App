'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { monthOptions, getCurrentFiscalYear, getFiscalYears, fetchMonthlyEntries, saveMonthlyEntry, deleteMonthlyEntry, totalsFor, computeDerived, toCsv, MonthlyEntry } from '@/lib/monthlyMaterial'
import { Download, Pencil, Save, Trash2 } from 'lucide-react'
import SimpleModal from '@/components/ui/SimpleModal'

const DEFAULT_USED_PNT = 5000

export default function OwnerMonthlyEntryPage() {
  const { profile } = useAuth()
  const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState<number>(monthOptions[0].value)
  const [entries, setEntries] = useState<MonthlyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<MonthlyEntry>({
    factory_id: '',
    batch_id: '',
    oleum_23: undefined,
    as_is_kg: undefined,
    purity_nv: undefined,
    free_acidity: undefined,
    month,
    fiscal_year: fiscalYear,
    used_pnt: DEFAULT_USED_PNT,
  })

  const factories = useMemo(() => profile?.factories ?? [], [profile])
  const fiscalYears = useMemo(() => getFiscalYears(6), [])

  const load = async () => {
    if (!profile) return
    setLoading(true)
    const factoryIds = factories.map((f: any) => f.id).filter(Boolean)
    const data = await fetchMonthlyEntries({ fiscal_year: fiscalYear, month, factoryIds })
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [profile, fiscalYear, month])

  useEffect(() => {
    setForm(f => ({ ...f, month, fiscal_year: fiscalYear }))
  }, [month, fiscalYear])

  const resetForm = () => {
    setForm({
      factory_id: factories[0]?.id ?? '',
      batch_id: '',
      oleum_23: undefined,
      as_is_kg: undefined,
      purity_nv: undefined,
      free_acidity: undefined,
      month,
      fiscal_year: fiscalYear,
      used_pnt: DEFAULT_USED_PNT,
    })
  }

  useEffect(() => {
    resetForm()
  }, [factories])

  const handleSave = async () => {
    if (!profile) return
    if (!form.factory_id || !form.batch_id) {
      alert('Factory and Batch ID are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, created_by: profile.id, used_pnt: DEFAULT_USED_PNT }
      await saveMonthlyEntry(payload)
      resetForm()
      await load()
      setModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id) return
    if (!confirm('Delete this entry?')) return
    await deleteMonthlyEntry(id)
    await load()
  }

  const handleEdit = (entry: MonthlyEntry) => {
    setForm({
      ...entry,
      month,
      fiscal_year: fiscalYear,
      used_pnt: entry.used_pnt ?? DEFAULT_USED_PNT,
    })
    setModalOpen(true)
  }

  const handleDownload = () => {
    const csv = toCsv(entries, true)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monthly-material-${fiscalYear}-m${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = totalsFor(entries)

  const openNew = () => {
    resetForm()
    setModalOpen(true)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Monthly Material Entry"
          subtitle="Owner · Manage and export monthly material data"
          accent="owner"
          actions={
            <div className="flex gap-2">
              <button className="btn btn-owner-secondary gap-2" onClick={openNew}>
                Add Entry
              </button>
              <button className="btn btn-owner gap-2" onClick={handleDownload}>
                <Download size={16}/> Download CSV
              </button>
            </div>
          }
        />

        <div className="card p-4 md:p-6 mb-4 grid gap-4 md:grid-cols-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted font-mono">Financial Year</label>
            <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="input">
              {fiscalYears.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted font-mono">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input">
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted font-mono">Factory</label>
            <select value={form.factory_id} onChange={e => setForm(f => ({ ...f, factory_id: e.target.value }))} className="input">
              {factories.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-owner w-full gap-2" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : form.id ? 'Update Entry' : 'Save Entry'}
              <Save size={16}/>
            </button>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="font-mono text-xs text-muted uppercase tracking-widest">Entries</div>
            {loading && <div className="text-xs text-muted">Loading…</div>}
          </div>
          <table className="data-table min-w-full">
            <thead>
              <tr>
                <th>BatchId</th>
                <th>Oleum 23%</th>
                <th>AS IS (Kg)</th>
                <th>Purity (NV)</th>
                <th>Free Acidity</th>
                <th>Actual Real (KG)</th>
                <th>Yield</th>
                <th>Used PNT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const derived = computeDerived(e)
                return (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">{e.batch_id}</td>
                    <td>{e.oleum_23 ?? '—'}</td>
                    <td>{e.as_is_kg ?? '—'}</td>
                    <td>{e.purity_nv ?? '—'}</td>
                    <td>{e.free_acidity ?? '—'}</td>
                    <td className="font-mono text-chemist">{(e.actual_real_kg ?? derived.actual_real_kg).toFixed(2)}</td>
                    <td className="font-mono text-owner">{(e.yield_pct ?? derived.yield_pct).toFixed(2)}</td>
                    <td className="font-mono text-muted">{(e.used_pnt ?? DEFAULT_USED_PNT).toFixed(2)}</td>
                    <td className="text-right flex gap-2 justify-end">
                      <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => handleEdit(e)}>
                        <Pencil size={14}/> Edit
                      </button>
                      <button className="text-xs text-red-400 hover:underline flex items-center gap-1" onClick={() => handleDelete(e.id)}>
                        <Trash2 size={14}/> Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted py-8">No entries yet</td></tr>
              )}
            </tbody>
            {entries.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5} className="text-right font-semibold">Totals</td>
                  <td className="font-mono text-chemist">{totals.totalActual.toFixed(2)}</td>
                  <td className="font-mono text-owner">{totals.avgYield.toFixed(2)} (avg)</td>
                  <td className="font-mono text-muted">{totals.totalUsed.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Entry' : 'Add Entry'}
        subtitle="Enter batch values; Actuals auto-calc"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Factory</label>
            <select className="input" value={form.factory_id} onChange={e => setForm(f => ({ ...f, factory_id: e.target.value }))}>
              {factories.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Batch ID</label>
            <input className="input" value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Oleum 23%</label>
            <input className="input" type="number" value={form.oleum_23 ?? ''} onChange={e => setForm(f => ({ ...f, oleum_23: Number(e.target.value) || undefined }))}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">AS IS (Kg)</label>
            <input className="input" type="number" value={form.as_is_kg ?? ''} onChange={e => setForm(f => ({ ...f, as_is_kg: Number(e.target.value) || undefined }))}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Purity (NV)</label>
            <input className="input" type="number" value={form.purity_nv ?? ''} onChange={e => setForm(f => ({ ...f, purity_nv: Number(e.target.value) || undefined }))}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Free Acidity</label>
            <input className="input" type="number" value={form.free_acidity ?? ''} onChange={e => setForm(f => ({ ...f, free_acidity: Number(e.target.value) || undefined }))}/>
          </div>
          <div className="text-xs text-muted flex items-center">Used PNT fixed at {DEFAULT_USED_PNT}</div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-owner gap-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : form.id ? 'Update Entry' : 'Save Entry'}
            <Save size={16}/>
          </button>
        </div>
      </SimpleModal>
    </AppLayout>
  )
}

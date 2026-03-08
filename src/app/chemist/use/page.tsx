'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { usageApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, Search, Lock, Hash, CalendarDays } from 'lucide-react'

type LookupMode = 'inv' | 'date'

export default function ChemistUsagePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    factory_id:     '',
    invoice_number: '',
    tons_used:      '',
    process_id:     '',
    batch_notes:    '',
    shift:          '',
    usage_date:     new Date().toISOString().split('T')[0],
  })
  const [factories, setFactories]         = useState<any[]>([])
  const [invoiceInfo, setInvoiceInfo]     = useState<any>(null)
  const [invoiceError, setInvoiceError]   = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState(false)

  // Lookup mode state
  const [lookupMode, setLookupMode]       = useState<LookupMode>('inv')
  const [lookupDate, setLookupDate]       = useState(new Date().toISOString().split('T')[0])
  const [dateInvoices, setDateInvoices]   = useState<any[]>([])
  const [dateLoading, setDateLoading]     = useState(false)

  useEffect(() => {
    if (profile?.factories) {
      setFactories(profile.factories)
      if (profile.factories.length === 1)
        setForm(f => ({ ...f, factory_id: (profile.factories as any)[0].id }))
    }
  }, [profile])

  // ── Lookup by INV number ─────────────────────────────
  async function lookupByInv() {
    if (!form.invoice_number) return
    setInvoiceError(''); setInvoiceInfo(null)
    const { data, error } = await supabase
      .from('stock_entries_safe')
      .select('*')
      .eq('invoice_number', form.invoice_number)
      .single()

    if (error || !data) {
      setInvoiceError('Invoice not found. Please check the number.')
      return
    }
    const { data: bal } = await supabase
      .from('stock_balance')
      .select('tons_remaining')
      .eq('invoice_number', form.invoice_number)
      .single()

    setInvoiceInfo({ ...data, tons_remaining: bal?.tons_remaining ?? data.tons_loaded })
  }

  // ── Lookup by date: fetch all invoices for that date ─
  async function lookupByDate() {
    if (!lookupDate) return
    setDateLoading(true); setInvoiceError(''); setDateInvoices([]); setInvoiceInfo(null)

    const { data: entries } = await supabase
      .from('stock_entries_safe')
      .select('*')
      .eq('entry_date', lookupDate)
      .order('invoice_number')

    if (!entries || entries.length === 0) {
      setInvoiceError(`No invoices found for ${new Date(lookupDate + 'T00:00:00').toLocaleDateString('en-IN')}.`)
      setDateLoading(false)
      return
    }

    // Fetch balances for all found invoices
    const { data: balances } = await supabase
      .from('stock_balance')
      .select('invoice_number, tons_remaining')
      .in('invoice_number', entries.map(e => e.invoice_number))

    const balMap: Record<string, number> = {}
    ;(balances ?? []).forEach((b: any) => { balMap[b.invoice_number] = b.tons_remaining })

    setDateInvoices(entries.map(e => ({
      ...e,
      tons_remaining: balMap[e.invoice_number] ?? e.tons_loaded,
    })))
    setDateLoading(false)
  }

  // ── Select an invoice from the date picklist ─────────
  function selectInvoice(inv: any) {
    setInvoiceInfo(inv)
    setForm(f => ({ ...f, invoice_number: inv.invoice_number }))
    setInvoiceError('')
  }

  // ── Submit ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoiceInfo) { setError('Please look up a valid invoice first.'); return }
    setLoading(true); setError('')

    const result = await usageApi.create({
      factory_id:     form.factory_id || invoiceInfo.factory_id,
      invoice_number: form.invoice_number,
      tons_used:      Number(form.tons_used),
      process_id:     form.process_id  || undefined,
      batch_notes:    form.batch_notes || undefined,
      shift:          form.shift       || undefined,
      usage_date:     form.usage_date,
      created_by:     profile!.id,
    })

    if (result.error) { setError(result.error); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/chemist'), 1500)
  }

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function switchMode(mode: LookupMode) {
    setLookupMode(mode)
    setInvoiceInfo(null)
    setInvoiceError('')
    setDateInvoices([])
    setForm(f => ({ ...f, invoice_number: '' }))
  }

  if (success) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-up">
          <CheckCircle size={56} className="text-chemist mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-primary mb-2">Usage Logged!</h2>
          <p className="text-muted">Stock has been updated automatically.</p>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        <PageHeader title="Log Material Usage" subtitle="Chemist · Consumption Entry" accent="chemist" />

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Step 1: Invoice lookup ── */}
          <div className="card p-6">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Search size={12}/> Step 1 — Find Invoice
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-layer-sm rounded-lg">
              <button
                type="button"
                onClick={() => switchMode('inv')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  lookupMode === 'inv'
                    ? 'bg-chemist/15 text-chemist border border-chemist/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Hash size={14}/> By Invoice No.
              </button>
              <button
                type="button"
                onClick={() => switchMode('date')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  lookupMode === 'date'
                    ? 'bg-chemist/15 text-chemist border border-chemist/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <CalendarDays size={14}/> By Invoice Date
              </button>
            </div>

            {/* By INV number */}
            {lookupMode === 'inv' && (
              <div className="flex gap-3">
                <input
                  className="input-field chemist-focus flex-1"
                  value={form.invoice_number}
                  onChange={e => { update('invoice_number', e.target.value); setInvoiceInfo(null) }}
                  placeholder="INV-2024-001"
                />
                <button type="button" onClick={lookupByInv} className="btn btn-chemist flex-shrink-0">
                  Look Up
                </button>
              </div>
            )}

            {/* By date */}
            {lookupMode === 'date' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="date"
                    className="input-field chemist-focus flex-1"
                    value={lookupDate}
                    onChange={e => { setLookupDate(e.target.value); setDateInvoices([]); setInvoiceInfo(null) }}
                  />
                  <button
                    type="button"
                    onClick={lookupByDate}
                    disabled={dateLoading}
                    className="btn btn-chemist flex-shrink-0"
                  >
                    {dateLoading ? 'Searching...' : 'Find Invoices'}
                  </button>
                </div>

                {/* Picklist of invoices for that date */}
                {dateInvoices.length > 0 && !invoiceInfo && (
                  <div className="space-y-2 animate-fade-down">
                    <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
                      {dateInvoices.length} invoice{dateInvoices.length > 1 ? 's' : ''} found — select one:
                    </p>
                    {dateInvoices.map(inv => (
                      <button
                        key={inv.invoice_number}
                        type="button"
                        onClick={() => selectInvoice(inv)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-chemist/40 hover:bg-chemist/5 transition-all text-left"
                      >
                        <div>
                          <div className="font-mono text-sm text-chemist">{inv.invoice_number}</div>
                          <div className="text-xs text-muted mt-0.5">{inv.supplier_name} · {inv.material_type}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-muted">Available</div>
                          <div className={`font-mono text-sm font-bold ${Number(inv.tons_remaining) <= 0 ? 'text-red-400' : 'text-chemist'}`}>
                            {Number(inv.tons_remaining).toFixed(3)} KGS
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {invoiceError && (
              <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{invoiceError}</div>
            )}

            {/* Invoice info card — shown after selection either way */}
            {invoiceInfo && (
              <div className="mt-4 bg-chemist/8 border border-chemist/25 rounded-lg p-4 animate-fade-up">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-chemist" />
                  <span className="font-mono text-xs text-chemist uppercase tracking-widest">Invoice Selected</span>
                  <Lock size={11} className="text-muted ml-auto" title="Rate hidden" />
                  <button
                    type="button"
                    onClick={() => { setInvoiceInfo(null); setForm(f => ({ ...f, invoice_number: '' })) }}
                    className="text-muted hover:text-primary text-lg leading-none ml-1"
                  >×</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Invoice',    invoiceInfo.invoice_number],
                    ['Supplier',   invoiceInfo.supplier_name],
                    ['Material',   invoiceInfo.material_type],
                    ['Total Load', `${invoiceInfo.tons_loaded} KGS`],
                    ['Date',       new Date(invoiceInfo.entry_date + 'T00:00:00').toLocaleDateString('en-IN')],
                    ['Available',  `${Number(invoiceInfo.tons_remaining).toFixed(3)} KGS`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="font-mono text-[10px] text-muted uppercase">{k}</div>
                      <div className={`text-sm font-semibold ${k === 'Available' ? 'text-chemist' : 'text-primary'}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-muted font-mono">Rate & cost information is hidden from this view</div>
              </div>
            )}
          </div>

          {/* ── Step 2: Usage details ── */}
          <div className="card p-6 space-y-5">
            <div className="font-mono text-xs text-muted uppercase tracking-widest flex items-center gap-2">
              <span>⚗</span> Step 2 — Enter Usage Details
            </div>

            <div>
              <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">KGS Used *</label>
              <input
                type="number" step="0.001" min="0.001"
                max={invoiceInfo?.tons_remaining ?? undefined}
                className="input-field chemist-focus"
                value={form.tons_used}
                onChange={e => update('tons_used', e.target.value)}
                required placeholder="e.g. 2.500"
              />
              {invoiceInfo && form.tons_used && Number(form.tons_used) > Number(invoiceInfo.tons_remaining) && (
                <div className="text-red-400 text-xs mt-1">Exceeds available stock!</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">Shift</label>
                <select className="input-field chemist-focus" value={form.shift} onChange={e => update('shift', e.target.value)}>
                  <option value="">Select shift</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">Usage Date *</label>
                <input type="date" className="input-field chemist-focus" value={form.usage_date} onChange={e => update('usage_date', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">Process ID (optional)</label>
              <input className="input-field chemist-focus" value={form.process_id} onChange={e => update('process_id', e.target.value)} placeholder="PROC-001" />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">Batch Notes (optional)</label>
              <textarea className="input-field chemist-focus resize-none" rows={2} value={form.batch_notes} onChange={e => update('batch_notes', e.target.value)} placeholder="Any notes about this usage..." />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !invoiceInfo} className="btn btn-chemist flex-1 justify-center py-3 text-base">
              {loading ? 'Saving...' : '✓ Submit Usage'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost px-6">Cancel</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

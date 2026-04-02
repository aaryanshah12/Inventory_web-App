'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import SimpleModal from '@/components/ui/SimpleModal'
import { useAuth } from '@/hooks/useAuth'
import { getCurrentFiscalYear, getFiscalYears, monthOptions, fetchSalesEntries, saveSalesEntry, deleteSalesEntry, SalesEntry, SalesEntryLine } from '@/lib/sales'
import { Download, Save, Trash2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v))

type UiLine = SalesEntryLine & { client_id: string }

const newClientId = () => {
  try {
    // Browser only (this is a client component)
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  } catch {
    return `${Date.now()}-${Math.random()}`
  }
}

function monthLabel(m: number) {
  return monthOptions.find(x => x.value === m)?.label ?? String(m)
}

function extremeMonth(entries: SalesEntry[], key: 'turnover' | 'pntosa' | 'hydrazone', kind: 'min' | 'max') {
  const list = entries
    .filter(e => e[key] !== null && e[key] !== undefined)
    .map(e => ({ month: e.month, value: Number(e[key] ?? 0) }))
    .filter(x => Number.isFinite(x.value))
  if (list.length === 0) return null
  const best = list.reduce((acc, cur) => {
    if (kind === 'min') return cur.value < acc.value ? cur : acc
    return cur.value > acc.value ? cur : acc
  })
  return best
}

function normalizeName(name: string) {
  return String(name ?? '').trim().toLowerCase()
}

function normalizeProductKey(name: string) {
  const n = normalizeName(name)
  if (n === 'pnt') return 'pntosa'
  if (n === 'pntosa') return 'pntosa'
  if (n === '4sh') return 'hydrazone'
  if (n === 'hydrazone') return 'hydrazone'
  if (n === 'turnover') return 'turnover'
  return n
}

function lineBy(entriesForMonth: SalesEntry | null, product: string) {
  const target = normalizeProductKey(product)
  const lines = entriesForMonth?.sales_entry_lines ?? []
  return lines.find(l => normalizeProductKey(l.product_name) === target) ?? null
}

export default function OwnerSalesPage() {
  const { profile } = useAuth()
  const factories = useMemo(() => profile?.factories ?? [], [profile])
  const [factoryId, setFactoryId] = useState<string>('')
  const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState<number>(monthOptions[0].value)
  const [entries, setEntries] = useState<SalesEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fiscalYears = useMemo(() => getFiscalYears(8), [])

  // Set default factory once profile loads
  useEffect(() => {
    if (factories.length > 0 && !factoryId) {
      setFactoryId((factories[0] as any).id)
    }
  }, [factories])

  const load = async () => {
    if (!factoryId) return
    setLoading(true)
    try {
      const data = await fetchSalesEntries({ fiscal_year: fiscalYear, factory_id: factoryId })
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [fiscalYear, factoryId])

  const entryForMonth = useMemo(() => {
    return entries.find(e => Number(e.month) === Number(month)) ?? null
  }, [entries, month])

  const [notes, setNotes] = useState<string>('')
  const [lines, setLines] = useState<UiLine[]>([])
  const [turnoverPrice, setTurnoverPrice] = useState<number | null>(null)

  useEffect(() => {
    const all = (entryForMonth?.sales_entry_lines ?? []).map(l => ({
      id: l.id,
      sales_entry_id: l.sales_entry_id,
      product_name: l.product_name,
      price_rupees: l.price_rupees ?? null,
      quantity_kg: l.quantity_kg ?? null,
      client_id: l.id ?? newClientId(),
    }))

    const turnover = all.find(l => normalizeName(l.product_name) === 'turnover') ?? null
    setTurnoverPrice(turnover?.price_rupees ?? entryForMonth?.turnover ?? null)

    // Product rows exclude the special Turnover row (Total is auto-calculated and not stored)
    const products = all
      .filter(l => normalizeName(l.product_name) !== 'turnover')
      .map(l => ({
        ...l,
        product_name: String(l.product_name ?? '').trim(),
      }))
      .filter(l => l.product_name.length > 0)

    setLines(products.length > 0 ? products : [
      { client_id: newClientId(), product_name: 'Product 1', price_rupees: null, quantity_kg: null },
      { client_id: newClientId(), product_name: 'Product 2', price_rupees: null, quantity_kg: null },
    ])
    setNotes(entryForMonth?.notes ?? '')
  }, [entryForMonth, month, fiscalYear])

  const fyData = useMemo(() => {
    const map = new Map<number, SalesEntry>()
    entries.forEach(e => map.set(Number(e.month), e))
    return monthOptions.map(m => {
      const e = map.get(Number(m.value))
      return {
        month: m.label.slice(0, 3).toUpperCase(),
        monthValue: m.value,
        turnover: lineBy(e ?? null, 'Turnover')?.price_rupees ?? e?.turnover ?? null,
        pntosa: lineBy(e ?? null, 'PNTOSA')?.price_rupees ?? e?.pntosa ?? null,
        hydrazone: lineBy(e ?? null, 'Hydrazone')?.price_rupees ?? e?.hydrazone ?? null,
      }
    })
  }, [entries])

  const totals = useMemo(() => {
    const sum = (k: 'turnover' | 'pntosa' | 'hydrazone') =>
      entries.reduce((s, e) => s + Number(e[k] ?? 0), 0)
    return {
      turnover: sum('turnover'),
      pntosa: sum('pntosa'),
      hydrazone: sum('hydrazone'),
    }
  }, [entries])

  const totalsKg = useMemo(() => {
    const pickKg = (product: string) => entries.reduce((s, e) => {
      const l = lineBy(e, product)
      return s + Number(l?.quantity_kg ?? 0)
    }, 0)
    return {
      turnover: pickKg('Turnover'),
      pntosa: pickKg('PNTOSA'),
      hydrazone: pickKg('Hydrazone'),
    }
  }, [entries])

  const uiTotals = useMemo(() => {
    const totalPrice = lines.reduce((s, l) => s + Number(l.price_rupees ?? 0), 0)
    const totalKg = lines.reduce((s, l) => s + Number(l.quantity_kg ?? 0), 0)
    return { totalPrice, totalKg }
  }, [lines])

  const extremes = useMemo(() => ({
    turnover: {
      min: extremeMonth(entries, 'turnover', 'min'),
      max: extremeMonth(entries, 'turnover', 'max'),
    },
    pntosa: {
      min: extremeMonth(entries, 'pntosa', 'min'),
      max: extremeMonth(entries, 'pntosa', 'max'),
    },
    hydrazone: {
      min: extremeMonth(entries, 'hydrazone', 'min'),
      max: extremeMonth(entries, 'hydrazone', 'max'),
    },
  }), [entries])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await saveSalesEntry({
        fiscal_year: fiscalYear,
        month,
        factory_id: factoryId,
        notes: notes.trim() || null,
        turnover: turnoverPrice ?? null,
        lines: [
          ...lines
            .map(l => ({
              product_name: String(l.product_name ?? '').trim(),
              price_rupees: l.price_rupees ?? null,
              quantity_kg: l.quantity_kg ?? null,
            }))
            .filter(l => l.product_name.length > 0),
          // Turnover is stored as a special line item (price-only)
          { product_name: 'Turnover', price_rupees: turnoverPrice ?? null, quantity_kg: null },
        ],
        created_by: profile.id,
      })
      await load()
      setModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entryForMonth?.id) return
    if (!confirm(`Delete ${fiscalYear} · ${monthLabel(month)} entry?`)) return
    await deleteSalesEntry(entryForMonth.id)
    await load()
  }

  const downloadPdf = (scope: 'fy' | 'month') => {
    const tableStyle = `
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
      h2 { margin-bottom: 4px; font-size: 16px; }
      p { margin-bottom: 12px; color: #555; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th { background: #111827; color: #e5e7eb; padding: 7px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
      tr.total-row td { background: #fef9c3; font-weight: bold; }
      tr.turnover-row td { background: #fde68a; font-weight: bold; }
      tr.month-header td { background: #f3f4f6; font-weight: bold; color: #374151; }
      tr.spacer td { height: 12px; border: none; background: transparent; }
      @media print { body { margin: 12px; } }
    `

    const monthEntryRows = (e: SalesEntry) => {
      const allLines = (e.sales_entry_lines ?? []).slice()
      const products = allLines.filter(l => normalizeName(l.product_name) !== 'turnover')
      const turnover = allLines.find(l => normalizeName(l.product_name) === 'turnover')
      const totalPrice = products.reduce((s, l) => s + Number(l.price_rupees ?? 0), 0)
      const totalKg = products.reduce((s, l) => s + Number(l.quantity_kg ?? 0), 0)
      return { products, turnover, totals: { price: totalPrice, kg: totalKg } }
    }

    const fmt = (v: number | null | undefined, prefix = '') =>
      v !== null && v !== undefined ? `${prefix}${Number(v).toFixed(2)}` : '—'

    let tableHtml = ''

    if (scope === 'month') {
      tableHtml = `
        <table>
          <thead><tr><th>Product</th><th>Price (₹)</th><th>Quantity (KG)</th></tr></thead>
          <tbody>
      `
      if (entryForMonth) {
        const { products, turnover, totals } = monthEntryRows(entryForMonth)
        products.forEach(p => {
          tableHtml += `<tr><td>${p.product_name}</td><td>${fmt(p.price_rupees, '₹')}</td><td>${fmt(p.quantity_kg)}</td></tr>`
        })
        tableHtml += `<tr class="total-row"><td>Total (Auto Calculated)</td><td>₹${totals.price.toFixed(2)}</td><td>${totals.kg.toFixed(2)}</td></tr>`
        tableHtml += `<tr class="turnover-row"><td>Turnover</td><td>${fmt(turnover?.price_rupees ?? entryForMonth.turnover, '₹')}</td><td>—</td></tr>`
      }
      tableHtml += `</tbody></table>`
    } else {
      tableHtml = `
        <table>
          <thead><tr><th>FY</th><th>Month</th><th>Product</th><th>Price (₹)</th><th>Quantity (KG)</th></tr></thead>
          <tbody>
      `
      const byMonth = new Map<number, SalesEntry>()
      entries.forEach(e => byMonth.set(Number(e.month), e))

      monthOptions.forEach((mo, idx) => {
        const e = byMonth.get(Number(mo.value))
        if (!e) return
        const { products, turnover, totals } = monthEntryRows(e)

        tableHtml += `<tr class="month-header"><td>${fiscalYear}</td><td>${mo.label}</td><td colspan="3"></td></tr>`
        products.forEach(p => {
          tableHtml += `<tr><td></td><td></td><td>${p.product_name}</td><td>${fmt(p.price_rupees, '₹')}</td><td>${fmt(p.quantity_kg)}</td></tr>`
        })
        tableHtml += `<tr class="total-row"><td></td><td></td><td>Total (Auto Calculated)</td><td>₹${totals.price.toFixed(2)}</td><td>${totals.kg.toFixed(2)}</td></tr>`
        tableHtml += `<tr class="turnover-row"><td></td><td></td><td>Turnover</td><td>${fmt(turnover?.price_rupees ?? e.turnover, '₹')}</td><td>—</td></tr>`
        if (idx < monthOptions.length - 1) tableHtml += `<tr class="spacer"><td colspan="5"></td></tr>`
      })
      tableHtml += `</tbody></table>`
    }

    const title = scope === 'fy'
      ? `${fiscalYear} — Sales Report`
      : `${fiscalYear} · ${monthLabel(month)} — Sales Report`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${tableStyle}</style></head>
      <body><h2>${title}</h2><p>Generated ${new Date().toLocaleDateString('en-IN')}</p>${tableHtml}</body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Sales"
          subtitle="Owner · FY & Month-wise Sales Entry + Charts"
          accent="owner"
          actions={
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-owner-secondary gap-2" onClick={() => downloadPdf('month')} disabled={!entryForMonth}>
                <Download size={16} /> Download Monthly
              </button>
              <button className="btn btn-owner gap-2" onClick={() => downloadPdf('fy')}>
                <Download size={16} /> Download FY
              </button>
            </div>
          }
        />

        {/* Filters + entry actions */}
        <div className="card p-4 md:p-6 mb-6 grid gap-4 md:grid-cols-5 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted font-mono">Factory</label>
            <select value={factoryId} onChange={e => setFactoryId(e.target.value)} className="input">
              {factories.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

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

          <div className="flex items-end gap-2">
            <button className="btn btn-owner-secondary w-full" onClick={() => setModalOpen(true)}>
              {entryForMonth ? 'Edit Entry' : 'Add Entry'}
            </button>
          </div>

          <div className="flex items-end gap-2">
            <button className="btn btn-ghost w-full text-red-400 border border-border" onClick={handleDelete} disabled={!entryForMonth?.id}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard
            label="TOTAL TURNOVER (FY)"
            value={totals.turnover ? `₹${(totals.turnover / 100000).toFixed(2)}L` : '—'}
            sub={extremes.turnover.min && extremes.turnover.max
              ? `${monthLabel(extremes.turnover.min.month)} lowest · ${monthLabel(extremes.turnover.max.month)} highest`
              : `Sales in KG: ${totalsKg.turnover ? totalsKg.turnover.toFixed(2) : '—'}`}
            color="owner"
          />
          <StatCard
            label="TOTAL PNTOSA (FY)"
            value={totals.pntosa ? `₹${(totals.pntosa / 100000).toFixed(2)}L` : '—'}
            sub={extremes.pntosa.min && extremes.pntosa.max
              ? `${monthLabel(extremes.pntosa.min.month)} lowest · ${monthLabel(extremes.pntosa.max.month)} highest`
              : `Sales in KG: ${totalsKg.pntosa ? totalsKg.pntosa.toFixed(2) : '—'}`}
            color="inputer"
          />
          <StatCard
            label="TOTAL HYDRAZONE (FY)"
            value={totals.hydrazone ? `₹${(totals.hydrazone / 100000).toFixed(2)}L` : '—'}
            sub={extremes.hydrazone.min && extremes.hydrazone.max
              ? `${monthLabel(extremes.hydrazone.min.month)} lowest · ${monthLabel(extremes.hydrazone.max.month)} highest`
              : `Sales in KG: ${totalsKg.hydrazone ? totalsKg.hydrazone.toFixed(2) : '—'}`}
            color="chemist"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <div className="card p-4 md:p-6">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Month Wise Turnover</div>
            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-owner border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={fyData}>
                  <defs>
                    <linearGradient id="gTurnover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c2ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00c2ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f1520', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="turnover" name="Turnover" stroke="#00c2ff" fill="url(#gTurnover)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-4 md:p-6">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Month vs PNTOSA</div>
            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-owner border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={fyData}>
                  <defs>
                    <linearGradient id="gPntosa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f1520', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="pntosa" name="PNTOSA" stroke="#00e5a0" fill="url(#gPntosa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-4 md:p-6 xl:col-span-2">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Month vs Hydrazone</div>
            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-owner border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={fyData}>
                  <defs>
                    <linearGradient id="gHydrazone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0a500" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f0a500" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a6080', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f1520', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="hydrazone" name="Hydrazone" stroke="#f0a500" fill="url(#gHydrazone)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${entryForMonth ? 'Edit' : 'Add'} Sales Entry`}
        subtitle={`${fiscalYear} · ${monthLabel(month)}`}
      >
        <div className="space-y-4">
          <div className="card p-3 border border-border bg-panel">
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-muted uppercase tracking-widest">
              <div>Price (₹)</div>
              <div>Sales in KG</div>
            </div>
          </div>

          <div className="space-y-3">
            {lines.map((l, idx) => (
              <div key={l.client_id} className="card p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <input
                    className="input font-mono text-sm uppercase tracking-wide"
                    value={l.product_name}
                    onChange={e => setLines(prev => prev.map((x, i) => i === idx ? ({ ...x, product_name: e.target.value }) : x))}
                    placeholder={`Product ${idx + 1}`}
                  />
                  <button
                    className="btn btn-ghost text-red-400 border border-border"
                    onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}
                    disabled={lines.length <= 1}
                    title={lines.length <= 1 ? 'At least 1 product row is required' : 'Remove row'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">₹</span>
                    <input
                      className="input pl-7"
                      type="number"
                      value={l.price_rupees ?? ''}
                      onChange={e => setLines(prev => prev.map((x, i) => i === idx ? ({ ...x, price_rupees: num(e.target.value) }) : x))}
                      placeholder="Price"
                    />
                  </div>
                  <input
                    className="input"
                    type="number"
                    value={l.quantity_kg ?? ''}
                    onChange={e => setLines(prev => prev.map((x, i) => i === idx ? ({ ...x, quantity_kg: num(e.target.value) }) : x))}
                    placeholder="Quantity (KG)"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total row (auto-calculated) */}
          <div className="card p-4 border border-owner/25 bg-owner/8">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Total (Auto Calculated)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">₹</span>
                <input className="input pl-7" value={uiTotals.totalPrice.toFixed(2)} readOnly />
              </div>
              <input className="input" value={uiTotals.totalKg.toFixed(2)} readOnly />
            </div>
          </div>

          {/* Turnover price-only */}
          <div className="card p-4">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Turnover (Price)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">₹</span>
                <input
                  className="input pl-7"
                  type="number"
                  value={turnoverPrice ?? ''}
                  onChange={e => setTurnoverPrice(num(e.target.value))}
                  placeholder="Turnover amount"
                />
              </div>
              <input className="input" value="—" readOnly />
            </div>
          </div>

          <div className="flex justify-between gap-2 flex-wrap">
            <button
              className="btn btn-owner-secondary"
              onClick={() => setLines(prev => ([...prev, { client_id: newClientId(), product_name: `Product ${prev.length + 1}`, price_rupees: null, quantity_kg: null }]))}
            >
              Add Product
            </button>
            <div className="flex-1" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-mono">Notes (optional)</label>
            <textarea
              className="input min-h-24"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes for this month..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-owner gap-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
            <Save size={16} />
          </button>
        </div>
      </SimpleModal>
    </AppLayout>
  )
}


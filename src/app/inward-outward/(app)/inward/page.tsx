'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchInwards, saveInward, deleteInward,
  fetchCompanies, fetchProducts,
  fmtDate, today,
} from '@/lib/io/api'
import type { IOInward, IOLineItem, IOCompany, IOProduct } from '@/lib/io/types'
import ProductModal from '@/components/io/ProductModal'
import CompanyModal from '@/components/io/CompanyModal'
import { Plus, Pencil, Trash2, X, Save, Download, Search, Upload } from 'lucide-react'

const EMPTY_ITEM = (): IOLineItem => ({ product_id: '', quantity: 1, price: 0, remarks: '' })

export default function InwardPage() {
  const { profile } = useAuth()
  const factories = profile?.factories ?? []
  const [factoryId, setFactoryId] = useState('')
  const [rows, setRows] = useState<IOInward[]>([])
  const [companies, setCompanies] = useState<IOCompany[]>([])
  const [products, setProducts] = useState<IOProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IOInward | null>(null)
  const [form, setForm] = useState({ inward_date: today(), supplier_id: '', supplier_ref_no: '', remarks: '', factory_id: '' })
  const [items, setItems] = useState<IOLineItem[]>([EMPTY_ITEM()])
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importGroups, setImportGroups] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => { if (profile && factories.length > 0 && !factoryId) setFactoryId(factories[0].id) }, [profile])
  useEffect(() => { loadData() }, [factoryId])

  async function loadData() {
    setLoading(true)
    try {
      const [r, c, p] = await Promise.all([fetchInwards(factoryId || undefined), fetchCompanies('supplier'), fetchProducts()])
      setRows(r); setCompanies(c); setProducts(p)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function openNew() {
    setEditing(null); setForm({ inward_date: today(), supplier_id: '', supplier_ref_no: '', remarks: '', factory_id: factoryId })
    setItems([EMPTY_ITEM()]); setShowForm(true)
  }
  function openEdit(row: IOInward) {
    setEditing(row); setForm({ inward_date: row.inward_date, supplier_id: row.supplier_id ?? '', supplier_ref_no: row.supplier_ref_no ?? '', remarks: row.remarks ?? '', factory_id: row.factory_id ?? factoryId })
    setItems(row.items?.length ? row.items.map(it => ({ ...it })) : [EMPTY_ITEM()]); setShowForm(true)
  }
  async function handleSave() {
    const validItems = items.filter(it => it.product_id)
    if (!validItems.length) { alert('Add at least one product.'); return }
    setSaving(true)
    try {
      await saveInward({ id: editing?.id, inward_date: form.inward_date, supplier_id: form.supplier_id || null, supplier_ref_no: form.supplier_ref_no || null, remarks: form.remarks || null, factory_id: form.factory_id || factoryId || null, items: validItems })
      setShowForm(false); loadData()
    } catch (e: any) { alert(e.message) } finally { setSaving(false) }
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this inward entry?')) return
    await deleteInward(id); loadData()
  }
  function setItem(i: number, field: keyof IOLineItem, value: any) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
  }

  function downloadTemplate() {
    const csv = 'Inward No,Date,Supplier,Ref No,Factory,Product,Qty,Price (₹),Remarks\n,2024-01-15,Supplier Name,INV-001,Factory Name,Product Name,10,500,Optional notes'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'inward_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    let headers: string[] = []
    let dataRows: string[][] = []
    if (file.name.endsWith('.xlsx')) {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(await file.arrayBuffer())
      const ws = wb.worksheets[0]
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const vals = (row.values as any[]).slice(1).map(v => String(v ?? '').trim())
        if (rowNumber === 1) { headers = vals.map(h => h.toLowerCase()); return }
        dataRows.push(vals)
      })
    } else {
      const text = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length) headers = lines[0].split(',').map(s => s.trim().toLowerCase())
      dataRows = lines.slice(1).map(line => line.split(',').map(s => s.trim()))
    }
    const col = (row: string[], name: string) => { const idx = headers.findIndex(h => h === name); return idx >= 0 ? (row[idx] ?? '') : '' }
    const map: Record<string, any> = {}
    for (const cols of dataRows) {
      const date = col(cols, 'date'); const supplierName = col(cols, 'supplier'); const refNo = col(cols, 'ref no'); const factoryName = col(cols, 'factory'); const productName = col(cols, 'product'); const qtyStr = col(cols, 'qty'); const priceStr = col(cols, 'price (₹)') || col(cols, 'price'); const remarks = col(cols, 'remarks')
      const company = companies.find(c => c.company_name.toLowerCase() === supplierName.toLowerCase())
      const factory = factories.find(f => f.name.toLowerCase() === factoryName.toLowerCase())
      const product = products.find(p => p.product_name.toLowerCase() === productName.toLowerCase())
      const key = `${date}|${company?.id ?? supplierName}|${refNo}|${factory?.id ?? ''}`
      if (!map[key]) {
        const errors: string[] = []
        if (!company) errors.push(`Supplier "${supplierName}" not found`)
        if (!factory && factories.length > 1) errors.push(`Factory "${factoryName}" not found`)
        map[key] = { inward_date: date, supplier_id: company?.id ?? '', supplier_name: company?.company_name ?? supplierName, supplier_ref_no: refNo ?? '', factory_id: factory?.id ?? factoryId, factory_name: factory?.name ?? factoryName ?? '', items: [], errors }
      }
      map[key].items.push({ product_id: product?.id ?? '', product_name: product?.product_name ?? productName, quantity: parseFloat(qtyStr) || 0, price: parseFloat(priceStr) || 0, remarks: remarks ?? '', error: !product ? `"${productName}" not found` : '' })
    }
    setImportGroups(Object.values(map)); setImportOpen(true)
  }
  async function handleImportConfirm() {
    const valid = importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.product_id))
    if (!valid.length) return
    setImporting(true)
    try {
      for (const g of valid) {
        await saveInward({ inward_date: g.inward_date, supplier_id: g.supplier_id || null, supplier_ref_no: g.supplier_ref_no || null, remarks: null, factory_id: g.factory_id || null, items: g.items.filter((it: any) => it.product_id).map((it: any) => ({ product_id: it.product_id, quantity: it.quantity, price: it.price, remarks: it.remarks })) })
      }
      setImportOpen(false); setImportGroups([]); loadData()
    } catch (e: any) { alert(e.message) } finally { setImporting(false) }
  }

  async function handleExport() {
    if (!filtered.length) return
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Inward')
    const headers = ['Inward No', 'Date', 'Supplier', 'Ref No', 'Factory', 'Product', 'Qty', 'Price (₹)', 'Remarks']
    const hRow = ws.addRow(headers)
    hRow.font = { bold: true, size: 11 }
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
    hRow.border = { bottom: { style: 'thin', color: { argb: 'FFCCA300' } } }
    hRow.alignment = { vertical: 'middle' }
    filtered.forEach(r => {
      const base = [r.inward_number, r.inward_date, r.supplier?.company_name ?? '', r.supplier_ref_no ?? '', r.factory?.name ?? '']
      if (!(r.items ?? []).length) { ws.addRow([...base, '', '', '', '']); return }
      ;(r.items ?? []).forEach((it: IOLineItem) => ws.addRow([...base, it.product?.product_name ?? products.find(p => p.id === it.product_id)?.product_name ?? '', it.quantity, it.price, it.remarks ?? '']))
    })
    ws.columns.forEach((col, i) => { col.width = Math.min(Math.max(headers[i].length + 4, 14), 40) })
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'inward.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = rows.filter(r => r.inward_number.toLowerCase().includes(search.toLowerCase()) || (r.supplier?.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const rowTotal = (its: IOLineItem[]) => its.reduce((s, it) => s + it.price * it.quantity, 0)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl font-bold text-primary">Inward</h1><p className="text-sm text-muted mt-0.5">{filtered.length} records</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          {factories.length > 1 && <select value={factoryId} onChange={e => setFactoryId(e.target.value)} className="input"><option value="">All</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}
          <input ref={importRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImportFile}/>
          <button onClick={() => importRef.current?.click()} className="btn btn-ghost"><Upload size={14}/> Import</button>
          <button onClick={handleExport} className="btn btn-ghost"><Download size={14}/> Export</button>
          <button onClick={openNew} className="btn btn-inputer"><Plus size={15}/> New Inward</button>
        </div>
      </div>
      <div className="input flex items-center gap-2 mb-4 w-full">
        <Search size={14} className="text-muted flex-shrink-0"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inward no, supplier…" className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted"/>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Inward No</th><th>Date</th><th>Supplier</th><th>Ref No</th><th>Factory</th><th className="text-right">Amount</th><th className="text-right">Items</th><th/></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="py-12 text-center"><div className="inline-block w-6 h-6 border-2 border-inputer border-t-transparent rounded-full animate-spin"/></td></tr>
            : filtered.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-muted text-sm">No inward records</td></tr>
            : filtered.map(row => (
              <tr key={row.id}>
                <td className="font-mono font-semibold text-xs">{row.inward_number}</td>
                <td className="text-xs">{fmtDate(row.inward_date)}</td>
                <td>{row.supplier?.company_name ?? '—'}</td>
                <td className="text-xs text-muted">{row.supplier_ref_no ?? '—'}</td>
                <td className="text-xs text-muted">{row.factory?.name ?? '—'}</td>
                <td className="text-right font-semibold text-xs">₹{rowTotal(row.items ?? []).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="text-right text-xs text-muted">{row.items?.length ?? 0}</td>
                <td className="text-right"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-layer text-muted hover:text-inputer transition-colors"><Pencil size={13}/></button>
                  <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-layer text-muted hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-border" style={{ background: 'var(--color-panel)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-primary">{editing ? 'Edit Inward' : 'New Inward'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-primary"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Date</label><input type="date" value={form.inward_date} onChange={e => setForm(f => ({ ...f, inward_date: e.target.value }))} className="input w-full"/></div>
                {factories.length > 1 && <div><label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Factory</label><select value={form.factory_id} onChange={e => setForm(f => ({ ...f, factory_id: e.target.value }))} className="input w-full"><option value="">— Select —</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>}
                <div>
                  <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-medium text-muted uppercase tracking-wider">Supplier</label><button onClick={() => setShowCompanyModal(true)} className="text-[11px] text-inputer hover:underline">+ Add New</button></div>
                  <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} className="input w-full"><option value="">— Select Supplier —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select>
                </div>
                <div><label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Supplier Ref No</label><input value={form.supplier_ref_no} onChange={e => setForm(f => ({ ...f, supplier_ref_no: e.target.value }))} placeholder="e.g. INV-001" className="input w-full"/></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Remarks</label><input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" className="input w-full"/></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-primary">Line Items</h3><button onClick={() => setItems(p => [...p, EMPTY_ITEM()])} className="text-xs text-inputer hover:underline flex items-center gap-1"><Plus size={12}/> Add Row</button></div>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead style={{ background: 'var(--color-surface)' }}><tr className="border-b border-border"><th className="text-left px-3 py-2 font-semibold text-muted">Product</th><th className="text-right px-3 py-2 font-semibold text-muted">Qty</th><th className="text-right px-3 py-2 font-semibold text-muted">Price</th><th className="text-right px-3 py-2 font-semibold text-muted">Total</th><th className="text-left px-3 py-2 font-semibold text-muted">Remarks</th><th className="px-2"/></tr></thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-2 py-2 min-w-[180px]"><div className="flex gap-1"><select value={it.product_id} onChange={e => setItem(i, 'product_id', e.target.value)} className="input flex-1 text-xs py-1.5"><option value="">— Product —</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}</select><button onClick={() => setShowProductModal(true)} className="btn btn-inputer px-2 py-1.5 text-xs">+</button></div></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={it.quantity || ''} placeholder="0" onChange={e => setItem(i, 'quantity', parseFloat(e.target.value) || 0)} className="input w-20 text-right py-1.5 text-xs"/></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={it.price || ''} placeholder="0" onChange={e => setItem(i, 'price', parseFloat(e.target.value) || 0)} className="input w-24 text-right py-1.5 text-xs"/></td>
                          <td className="px-2 py-2 text-right font-semibold text-primary whitespace-nowrap">₹{(it.price * it.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td className="px-2 py-2"><input value={it.remarks ?? ''} onChange={e => setItem(i, 'remarks', e.target.value)} placeholder="optional" className="input w-28 py-1.5 text-xs"/></td>
                          <td className="px-2 py-2">{items.length > 1 && <button onClick={() => setItems(p => p.filter((_, j) => j !== i))} className="text-muted hover:text-red-400"><X size={13}/></button>}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: 'var(--color-surface)' }}><tr className="border-t border-border"><td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-muted">Total</td><td className="px-3 py-2 text-right text-sm font-bold text-primary">₹{items.reduce((s, it) => s + it.price * it.quantity, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td colSpan={2}/></tr></tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-inputer">{saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Save size={14}/>}{editing ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="rounded-2xl shadow-2xl w-full max-w-4xl my-6 border border-border" style={{ background: 'var(--color-panel)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-primary">Import Inward Records</h2>
                <p className="text-xs text-muted mt-0.5">{importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.product_id)).length} valid / {importGroups.length} total records</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadTemplate} className="btn btn-ghost text-xs"><Download size={12}/> Template</button>
                <button onClick={() => { setImportOpen(false); setImportGroups([]) }} className="text-muted hover:text-primary"><X size={18}/></button>
              </div>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="w-full text-xs">
                <thead style={{ background: 'var(--color-surface)', position: 'sticky', top: 0 }}>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted font-semibold w-8"></th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Date</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Supplier</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Ref No</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Factory</th>
                    <th className="text-right px-3 py-2 text-muted font-semibold">Items</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {importGroups.map((g, i) => {
                    const itemErrors = g.items.filter((it: any) => it.error).map((it: any) => it.error)
                    const allErrors = [...g.errors, ...itemErrors]
                    const valid = allErrors.length === 0 && g.items.some((it: any) => it.product_id)
                    return (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-center">{valid ? <span className="text-green-500 font-bold text-sm">✓</span> : <span className="text-red-400 font-bold text-sm">✗</span>}</td>
                        <td className="px-3 py-2 font-mono">{g.inward_date}</td>
                        <td className="px-3 py-2">{g.supplier_name || '—'}</td>
                        <td className="px-3 py-2 text-muted">{g.supplier_ref_no || '—'}</td>
                        <td className="px-3 py-2 text-muted">{g.factory_name || '—'}</td>
                        <td className="px-3 py-2 text-right">{g.items.length}</td>
                        <td className="px-3 py-2 text-red-400">{allErrors.length ? allErrors.join('; ') : <span className="text-green-500">OK</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-xs text-muted">Rows with ✗ will be skipped. Ensure company and product names match exactly.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => { setImportOpen(false); setImportGroups([]) }} className="btn btn-ghost">Cancel</button>
                <button onClick={handleImportConfirm} disabled={importing || !importGroups.some(g => !g.errors.length && g.items.some((it: any) => it.product_id))} className="btn btn-inputer">
                  {importing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Upload size={14}/>}
                  Import {importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.product_id)).length} Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductModal && <ProductModal onClose={() => setShowProductModal(false)} onSaved={async (p) => { const updated = await fetchProducts(); setProducts(updated); setItems(prev => { const last = prev[prev.length-1]; return last && !last.product_id ? [...prev.slice(0,-1), {...last, product_id: p.id}] : prev }); setShowProductModal(false) }}/>}
      {showCompanyModal && <CompanyModal defaultType="supplier" onClose={() => setShowCompanyModal(false)} onSaved={async (c) => { const updated = await fetchCompanies('supplier'); setCompanies(updated); setForm(f => ({ ...f, supplier_id: c.id })); setShowCompanyModal(false) }}/>}
    </div>
  )
}

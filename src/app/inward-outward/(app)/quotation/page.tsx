'use client'
import { useState, useEffect, useRef } from 'react'
import { useIOFactory } from '@/contexts/IOFactoryContext'
import { fetchQuotations, saveQuotation, deleteQuotation, fetchCompanies, fetchProducts, fmtDate, today } from '@/lib/io/api'
import type { IOQuotation, IOQuotationItem, IOCompany, IOProduct } from '@/lib/io/types'
import ProductModal from '@/components/io/ProductModal'
import CompanyModal from '@/components/io/CompanyModal'
import RichTextEditor from '@/components/io/RichTextEditor'
import { Plus, Pencil, Trash2, X, Save, Download, Search, Upload } from 'lucide-react'

const EMPTY_ITEM = (): IOQuotationItem => ({ reference_no: '', product_id: '', product_name_override: '', price: 0 })

const DEFAULT_HEADER = `Respected Mr,

Greetings of the Day !!!

As per your request, we are offering our current price offer for the below mentioned products.`

const DEFAULT_FOOTER = `The above price is for
* 25 KG HDPE bags or 500Kg Jumbo Bag packing
* Any other type of packing will cost extra`

export default function QuotationPage() {
  const { factoryId, factories } = useIOFactory()
  const [rows, setRows] = useState<IOQuotation[]>([])
  const [companies, setCompanies] = useState<IOCompany[]>([])
  const [products, setProducts] = useState<IOProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IOQuotation | null>(null)
  const [form, setForm] = useState({
    quotation_date: today(), customer_id: '', factory_id: '',
    header_content: DEFAULT_HEADER, footer_content: DEFAULT_FOOTER,
  })
  const [items, setItems] = useState<IOQuotationItem[]>([EMPTY_ITEM()])
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importGroups, setImportGroups] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => { loadData() }, [factoryId])

  async function loadData() {
    setLoading(true)
    try {
      const [r, c, p] = await Promise.all([fetchQuotations(factoryId || undefined), fetchCompanies('customer', factoryId || undefined), fetchProducts(factoryId || undefined)])
      setRows(r); setCompanies(c); setProducts(p)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function openNew() {
    setEditing(null)
    setForm({ quotation_date: today(), customer_id: '', factory_id: factoryId, header_content: DEFAULT_HEADER, footer_content: DEFAULT_FOOTER })
    setItems([EMPTY_ITEM()]); setShowForm(true)
  }
  function openEdit(row: IOQuotation) {
    setEditing(row)
    setForm({
      quotation_date: row.quotation_date, customer_id: row.customer_id ?? '',
      factory_id: row.factory_id ?? factoryId,
      header_content: row.header_content ?? DEFAULT_HEADER,
      footer_content: row.footer_content ?? DEFAULT_FOOTER,
    })
    setItems(row.items?.length ? row.items.map(it => ({ ...it })) : [EMPTY_ITEM()]); setShowForm(true)
  }
  async function handleSave() {
    const validItems = items.filter(it => it.price > 0)
    if (!validItems.length) { alert('Add at least one item with a price.'); return }
    setSaving(true)
    try {
      await saveQuotation({ id: editing?.id, quotation_date: form.quotation_date, customer_id: form.customer_id || null, factory_id: form.factory_id || factoryId || null, header_content: form.header_content || null, footer_content: form.footer_content || null, items: validItems })
      setShowForm(false); loadData()
    } catch (e: any) { alert(e.message) } finally { setSaving(false) }
  }
  async function handleDelete(id: string) { if (!confirm('Delete?')) return; await deleteQuotation(id); loadData() }
  function setItem(i: number, field: keyof IOQuotationItem, value: any) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it)) }

  function downloadTemplate() {
    const csv = 'Quotation No,Date,Customer,Factory,Ref No,Product,Price (₹)\n,2024-01-15,Customer Name,Factory Name,Q001,Product Name,1500'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'quotation_template.csv'; a.click()
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
      const date = col(cols, 'date'); const customerName = col(cols, 'customer'); const factoryName = col(cols, 'factory'); const refNo = col(cols, 'ref no'); const productName = col(cols, 'product'); const priceStr = col(cols, 'price (₹)') || col(cols, 'price')
      const company = companies.find(c => c.company_name.toLowerCase() === customerName.toLowerCase())
      const factory = factories.find(f => f.name.toLowerCase() === factoryName.toLowerCase())
      const product = products.find(p => p.product_name.toLowerCase() === productName.toLowerCase())
      const key = `${date}|${company?.id ?? customerName}|${factory?.id ?? ''}`
      if (!map[key]) {
        const errors: string[] = []
        if (!company) errors.push(`Customer "${customerName}" not found`)
        if (!factory && factories.length > 1) errors.push(`Factory "${factoryName}" not found`)
        map[key] = { quotation_date: date, customer_id: company?.id ?? '', customer_name: company?.company_name ?? customerName, factory_id: factory?.id ?? factoryId, factory_name: factory?.name ?? factoryName ?? '', items: [], errors }
      }
      map[key].items.push({ reference_no: refNo ?? '', product_id: product?.id ?? '', product_name: product?.product_name ?? productName, product_name_override: product ? '' : (productName ?? ''), price: parseFloat(priceStr) || 0, error: (!product && !productName) ? 'Missing product' : '' })
    }
    setImportGroups(Object.values(map)); setImportOpen(true)
  }
  async function handleImportConfirm() {
    const valid = importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.price > 0))
    if (!valid.length) return
    setImporting(true)
    try {
      for (const g of valid) {
        await saveQuotation({ quotation_date: g.quotation_date, customer_id: g.customer_id || null, factory_id: g.factory_id || null, header_content: null, footer_content: null, items: g.items.filter((it: any) => it.price > 0).map((it: any) => ({ reference_no: it.reference_no, product_id: it.product_id || null, product_name_override: it.product_name_override || '', price: it.price })) })
      }
      setImportOpen(false); setImportGroups([]); loadData()
    } catch (e: any) { alert(e.message) } finally { setImporting(false) }
  }

  async function handleExport() {
    if (!filtered.length) return
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Quotations')
    const headers = ['Quotation No', 'Date', 'Customer', 'Factory', 'Ref No', 'Product', 'Price (₹)']
    const hRow = ws.addRow(headers)
    hRow.font = { bold: true, size: 11 }
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
    hRow.border = { bottom: { style: 'thin', color: { argb: 'FFCCA300' } } }
    hRow.alignment = { vertical: 'middle' }
    filtered.forEach(r => {
      const base = [r.quotation_number, r.quotation_date, r.customer?.company_name ?? '', r.factory?.name ?? '']
      if (!(r.items ?? []).length) { ws.addRow([...base, '', '', '']); return }
      ;(r.items ?? []).forEach((it: IOQuotationItem) => ws.addRow([...base, it.reference_no ?? '', it.product_name_override || (products.find(p => p.id === it.product_id)?.product_name ?? ''), it.price]))
    })
    ws.columns.forEach((col, i) => { col.width = Math.min(Math.max(headers[i].length + 4, 14), 40) })
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'quotations.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = rows.filter(r => r.quotation_number.toLowerCase().includes(search.toLowerCase()) || (r.customer?.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const rowTotal = (its: IOQuotationItem[]) => its.reduce((s, it) => s + it.price, 0)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl font-bold text-primary">Quotations</h1><p className="text-sm text-muted mt-0.5">{filtered.length} records</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={importRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImportFile}/>
          <button onClick={() => importRef.current?.click()} className="btn btn-ghost"><Upload size={14}/> Import</button>
          <button onClick={handleExport} className="btn btn-ghost"><Download size={14}/> Export</button>
          <button onClick={openNew} className="btn btn-inputer"><Plus size={15}/> New Quotation</button>
        </div>
      </div>

      <div className="input flex items-center gap-2 mb-4 w-full">
        <Search size={14} className="text-muted flex-shrink-0"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotation no, customer…" className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted"/>
      </div>

      <div className="card overflow-hidden">
        <div className="sm:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {loading ? <div className="py-12 text-center"><div className="inline-block w-6 h-6 border-2 border-inputer border-t-transparent rounded-full animate-spin"/></div>
          : filtered.length === 0 ? <div className="py-12 text-center text-muted text-sm">No quotations</div>
          : filtered.map(row => (
            <div key={row.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono font-semibold text-xs text-inputer">{row.quotation_number}</div>
                  <div className="text-xs text-muted mt-0.5">{fmtDate(row.quotation_date)}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(row)} className="p-2 rounded hover:bg-layer text-muted hover:text-inputer transition-colors"><Pencil size={14}/></button>
                  <button onClick={() => handleDelete(row.id)} className="p-2 rounded hover:bg-layer text-muted hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="text-sm font-medium text-primary">{row.customer?.company_name ?? '—'}</div>
              {row.factory && <div className="text-xs text-inputer">{row.factory.name}</div>}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs text-muted">{row.items?.length ?? 0} items</span>
                <span className="font-bold text-sm text-primary">₹{rowTotal(row.items ?? []).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Quotation No</th><th>Date</th><th>Customer</th><th>Factory</th><th className="text-right">Total</th><th className="text-right">Items</th><th/></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-12 text-center"><div className="inline-block w-6 h-6 border-2 border-inputer border-t-transparent rounded-full animate-spin"/></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-muted text-sm">No quotations</td></tr>
              : filtered.map(row => (
                <tr key={row.id}>
                  <td className="font-mono font-semibold text-xs">{row.quotation_number}</td>
                  <td className="text-xs">{fmtDate(row.quotation_date)}</td>
                  <td>{row.customer?.company_name ?? '—'}</td>
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="rounded-2xl shadow-2xl w-full max-w-3xl my-6 border border-border" style={{ background: 'var(--color-panel)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-primary">{editing ? 'Edit Quotation' : 'New Quotation'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-primary"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Date</label>
                  <input type="date" value={form.quotation_date} onChange={e => setForm(f => ({ ...f, quotation_date: e.target.value }))} className="input w-full"/>
                </div>
                {factories.length > 1 && (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Factory</label>
                    <select value={form.factory_id} onChange={e => setForm(f => ({ ...f, factory_id: e.target.value }))} className="input w-full">
                      <option value="">— Select —</option>
                      {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">Customer</label>
                    <button onClick={() => setShowCompanyModal(true)} className="text-[11px] text-inputer hover:underline">+ Add New</button>
                  </div>
                  <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className="input w-full">
                    <option value="">— Select Customer —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Header Content</label>
                  <button onClick={() => setForm(f => ({ ...f, header_content: DEFAULT_HEADER }))} className="text-[11px] text-inputer hover:underline">Reset to default</button>
                </div>
                <RichTextEditor
                  value={form.header_content}
                  onChange={val => setForm(f => ({ ...f, header_content: val }))}
                  placeholder="Header shown at top of quotation…"
                  minHeight={110}
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-primary">Items</h3>
                  <button onClick={() => setItems(p => [...p, EMPTY_ITEM()])} className="text-xs text-inputer hover:underline flex items-center gap-1"><Plus size={12}/> Add Row</button>
                </div>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead style={{ background: 'var(--color-surface)' }}>
                      <tr className="border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-muted">Ref No</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted">Product / Name</th>
                        <th className="text-right px-3 py-2 font-semibold text-muted">Price</th>
                        <th className="px-2"/>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-2 py-2">
                            <input value={it.reference_no ?? ''} onChange={e => setItem(i, 'reference_no', e.target.value)} placeholder="Ref" className="input w-24 py-1.5 text-xs"/>
                          </td>
                          <td className="px-2 py-2 min-w-[200px]">
                            <div className="flex gap-1 mb-1">
                              <select value={it.product_id ?? ''} onChange={e => setItem(i, 'product_id', e.target.value)} className="input flex-1 text-xs py-1.5">
                                <option value="">— Product —</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                              </select>
                              <button onClick={() => setShowProductModal(true)} className="btn btn-inputer px-2 py-1.5 text-xs">+</button>
                            </div>
                            <input value={it.product_name_override ?? ''} onChange={e => setItem(i, 'product_name_override', e.target.value)} placeholder="Or type a custom name" className="input w-full py-1.5 text-xs"/>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min={0} value={it.price || ''} placeholder="0" onChange={e => setItem(i, 'price', parseFloat(e.target.value) || 0)} className="input w-28 text-right py-1.5 text-xs"/>
                          </td>
                          <td className="px-2 py-2">
                            {items.length > 1 && <button onClick={() => setItems(p => p.filter((_, j) => j !== i))} className="text-muted hover:text-red-400"><X size={13}/></button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: 'var(--color-surface)' }}>
                      <tr className="border-t border-border">
                        <td colSpan={2} className="px-3 py-2 text-right text-xs font-semibold text-muted">Total</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-primary">
                          ₹{items.reduce((s, it) => s + it.price, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td/>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Footer Content</label>
                  <button onClick={() => setForm(f => ({ ...f, footer_content: DEFAULT_FOOTER }))} className="text-[11px] text-inputer hover:underline">Reset to default</button>
                </div>
                <RichTextEditor
                  value={form.footer_content}
                  onChange={val => setForm(f => ({ ...f, footer_content: val }))}
                  placeholder="Footer text, terms and conditions…"
                  minHeight={90}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-inputer">
                {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Save size={14}/>}
                {editing ? 'Update' : 'Save'}
              </button>
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
                <h2 className="text-base font-bold text-primary">Import Quotations</h2>
                <p className="text-xs text-muted mt-0.5">{importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.price > 0)).length} valid / {importGroups.length} total records</p>
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
                    <th className="text-left px-3 py-2 text-muted font-semibold">Customer</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Factory</th>
                    <th className="text-right px-3 py-2 text-muted font-semibold">Items</th>
                    <th className="text-left px-3 py-2 text-muted font-semibold">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {importGroups.map((g, i) => {
                    const allErrors = [...g.errors]
                    const valid = allErrors.length === 0 && g.items.some((it: any) => it.price > 0)
                    return (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-center">{valid ? <span className="text-green-500 font-bold text-sm">✓</span> : <span className="text-red-400 font-bold text-sm">✗</span>}</td>
                        <td className="px-3 py-2 font-mono">{g.quotation_date}</td>
                        <td className="px-3 py-2">{g.customer_name || '—'}</td>
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
              <p className="text-xs text-muted">Rows with ✗ will be skipped. Customer names must match exactly.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => { setImportOpen(false); setImportGroups([]) }} className="btn btn-ghost">Cancel</button>
                <button onClick={handleImportConfirm} disabled={importing || !importGroups.some(g => !g.errors.length && g.items.some((it: any) => it.price > 0))} className="btn btn-inputer">
                  {importing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Upload size={14}/>}
                  Import {importGroups.filter(g => !g.errors.length && g.items.some((it: any) => it.price > 0)).length} Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductModal && <ProductModal onClose={() => setShowProductModal(false)} onSaved={async (p) => { const upd = await fetchProducts(); setProducts(upd); setItems(prev => { const last = prev[prev.length-1]; return last && !last.product_id ? [...prev.slice(0,-1), {...last, product_id: p.id}] : prev }); setShowProductModal(false) }}/>}
      {showCompanyModal && <CompanyModal defaultType="customer" onClose={() => setShowCompanyModal(false)} onSaved={async (c) => { const upd = await fetchCompanies('customer'); setCompanies(upd); setForm(f => ({ ...f, customer_id: c.id })); setShowCompanyModal(false) }}/>}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchQuotations, saveQuotation, deleteQuotation, fetchCompanies, fetchProducts, fmtDate, today, exportCSV } from '@/lib/io/api'
import type { IOQuotation, IOQuotationItem, IOCompany, IOProduct } from '@/lib/io/types'
import ProductModal from '@/components/io/ProductModal'
import CompanyModal from '@/components/io/CompanyModal'
import RichTextEditor from '@/components/io/RichTextEditor'
import { Plus, Pencil, Trash2, X, Save, Download, Search } from 'lucide-react'

const EMPTY_ITEM = (): IOQuotationItem => ({ reference_no: '', product_id: '', product_name_override: '', price: 0 })

const DEFAULT_HEADER = `Respected Mr,

Greetings of the Day !!!

As per your request, we are offering our current price offer for the below mentioned products.`

const DEFAULT_FOOTER = `The above price is for
* 25 KG HDPE bags or 500Kg Jumbo Bag packing
* Any other type of packing will cost extra`

export default function QuotationPage() {
  const { profile } = useAuth()
  const factories = profile?.factories ?? []
  const [factoryId, setFactoryId] = useState('')
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

  useEffect(() => { if (profile && factories.length > 0 && !factoryId) setFactoryId(factories[0].id) }, [profile])
  useEffect(() => { loadData() }, [factoryId])

  async function loadData() {
    setLoading(true)
    try {
      const [r, c, p] = await Promise.all([fetchQuotations(factoryId || undefined), fetchCompanies('customer'), fetchProducts()])
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
  const filtered = rows.filter(r => r.quotation_number.toLowerCase().includes(search.toLowerCase()) || (r.customer?.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const rowTotal = (its: IOQuotationItem[]) => its.reduce((s, it) => s + it.price, 0)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl font-bold text-primary">Quotations</h1><p className="text-sm text-muted mt-0.5">{filtered.length} records</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          {factories.length > 1 && <select value={factoryId} onChange={e => setFactoryId(e.target.value)} className="input"><option value="">All</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}
          <button onClick={() => exportCSV(filtered.map(r => ({ 'Quotation No': r.quotation_number, Date: r.quotation_date, Customer: r.customer?.company_name ?? '' })), 'quotations.csv')} className="btn btn-ghost"><Download size={14}/> Export</button>
          <button onClick={openNew} className="btn btn-inputer"><Plus size={15}/> New Quotation</button>
        </div>
      </div>

      <div className="input flex items-center gap-2 mb-4 w-full">
        <Search size={14} className="text-muted flex-shrink-0"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotation no, customer…" className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted"/>
      </div>

      <div className="card overflow-hidden">
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

      {showProductModal && <ProductModal onClose={() => setShowProductModal(false)} onSaved={async (p) => { const upd = await fetchProducts(); setProducts(upd); setItems(prev => { const last = prev[prev.length-1]; return last && !last.product_id ? [...prev.slice(0,-1), {...last, product_id: p.id}] : prev }); setShowProductModal(false) }}/>}
      {showCompanyModal && <CompanyModal defaultType="customer" onClose={() => setShowCompanyModal(false)} onSaved={async (c) => { const upd = await fetchCompanies('customer'); setCompanies(upd); setForm(f => ({ ...f, customer_id: c.id })); setShowCompanyModal(false) }}/>}
    </div>
  )
}

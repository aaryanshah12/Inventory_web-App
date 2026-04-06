'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchInwards, saveInward, deleteInward,
  fetchCompanies, fetchProducts,
  fmtDate, today, exportCSV,
} from '@/lib/io/api'
import type { IOInward, IOLineItem, IOCompany, IOProduct } from '@/lib/io/types'
import ProductModal from '@/components/io/ProductModal'
import CompanyModal from '@/components/io/CompanyModal'
import { Plus, Pencil, Trash2, X, Save, Download, Search } from 'lucide-react'

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
  const filtered = rows.filter(r => r.inward_number.toLowerCase().includes(search.toLowerCase()) || (r.supplier?.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const rowTotal = (its: IOLineItem[]) => its.reduce((s, it) => s + it.price * it.quantity, 0)

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl font-bold text-primary">Inward</h1><p className="text-sm text-muted mt-0.5">{filtered.length} records</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          {factories.length > 1 && <select value={factoryId} onChange={e => setFactoryId(e.target.value)} className="input"><option value="">All</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}
          <button onClick={() => exportCSV(filtered.map(r => ({ 'Inward No': r.inward_number, Date: r.inward_date, Supplier: r.supplier?.company_name ?? '', 'Ref No': r.supplier_ref_no ?? '' })), 'inward.csv')} className="btn btn-ghost"><Download size={14}/> Export</button>
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
      {showProductModal && <ProductModal onClose={() => setShowProductModal(false)} onSaved={async (p) => { const updated = await fetchProducts(); setProducts(updated); setItems(prev => { const last = prev[prev.length-1]; return last && !last.product_id ? [...prev.slice(0,-1), {...last, product_id: p.id}] : prev }); setShowProductModal(false) }}/>}
      {showCompanyModal && <CompanyModal defaultType="supplier" onClose={() => setShowCompanyModal(false)} onSaved={async (c) => { const updated = await fetchCompanies('supplier'); setCompanies(updated); setForm(f => ({ ...f, supplier_id: c.id })); setShowCompanyModal(false) }}/>}
    </div>
  )
}

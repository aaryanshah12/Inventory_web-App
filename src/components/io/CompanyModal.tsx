'use client'
import { useState, useEffect } from 'react'
import { saveCompany, fetchCountries, fetchStates, fetchCities } from '@/lib/io/api'
import type { IOCompany, IOCountry, IOState, IOCity, CompanyType } from '@/lib/io/types'
import { X, Save } from 'lucide-react'

interface Props {
  editing?: IOCompany | null
  defaultType?: CompanyType
  factoryId?: string | null
  onClose: () => void
  onSaved: (company: IOCompany) => void
}

const TYPES: { value: CompanyType; label: string }[] = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer', label: 'Customer' },
  { value: 'both',     label: 'Both'     },
]

export default function CompanyModal({ editing, defaultType = 'supplier', factoryId, onClose, onSaved }: Props) {
  const [countries, setCountries] = useState<IOCountry[]>([])
  const [states, setStates]       = useState<IOState[]>([])
  const [cities, setCities]       = useState<IOCity[]>([])
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState({
    company_name: editing?.company_name  ?? '',
    company_type: (editing?.company_type ?? defaultType) as CompanyType,
    person_name:  editing?.person_name   ?? '',
    mobile:       editing?.mobile        ?? '',
    email:        editing?.email         ?? '',
    address:      editing?.address       ?? '',
    pincode:      editing?.pincode       ?? '',
    country_id:   editing?.country_id?.toString() ?? '',
    state_id:     editing?.state_id?.toString()   ?? '',
    city_id:      editing?.city_id?.toString()     ?? '',
  })

  useEffect(() => {
    fetchCountries().then(setCountries).catch(console.error)
    if (editing?.country_id) fetchStates(editing.country_id).then(setStates)
    if (editing?.state_id)   fetchCities(editing.state_id).then(setCities)
  }, [])

  async function onCountryChange(cid: string) {
    setForm(f => ({ ...f, country_id: cid, state_id: '', city_id: '' }))
    setStates([]); setCities([])
    if (cid) fetchStates(parseInt(cid)).then(setStates)
  }

  async function onStateChange(sid: string) {
    setForm(f => ({ ...f, state_id: sid, city_id: '' }))
    setCities([])
    if (sid) fetchCities(parseInt(sid)).then(setCities)
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSave() {
    if (!form.company_name.trim()) { alert('Company name is required'); return }
    setSaving(true)
    try {
      const saved = await saveCompany({
        id:           editing?.id,
        factory_id:   editing ? editing.factory_id : (factoryId ?? null),
        company_name: form.company_name.trim(),
        company_type: form.company_type,
        person_name:  form.person_name  || null,
        mobile:       form.mobile       || null,
        email:        form.email        || null,
        address:      form.address      || null,
        pincode:      form.pincode      || null,
        country_id:   form.country_id ? parseInt(form.country_id) : null,
        state_id:     form.state_id   ? parseInt(form.state_id)   : null,
        city_id:      form.city_id    ? parseInt(form.city_id)     : null,
        is_active:    true,
      })
      onSaved(saved)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg my-6 border border-border"
        style={{ background: 'var(--color-panel)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-primary">{editing ? 'Edit Company' : 'Add Company'}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Company Name *</label>
            <input value={form.company_name} onChange={f('company_name')} placeholder="Enter company name" className="input w-full" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Type</label>
              <select value={form.company_type} onChange={f('company_type')} className="input w-full">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Contact Person</label>
              <input value={form.person_name} onChange={f('person_name')} placeholder="Name" className="input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Mobile</label>
              <input value={form.mobile} onChange={f('mobile')} placeholder="+91 99999 99999" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={f('email')} placeholder="email@company.com" className="input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Country</label>
              <select value={form.country_id} onChange={e => onCountryChange(e.target.value)} className="input w-full">
                <option value="">— Select —</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">State</label>
              <select value={form.state_id} onChange={e => onStateChange(e.target.value)} disabled={!form.country_id} className="input w-full disabled:opacity-40">
                <option value="">— Select —</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">City</label>
              <select value={form.city_id} onChange={f('city_id')} disabled={!form.state_id} className="input w-full disabled:opacity-40">
                <option value="">— Select —</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Address</label>
              <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                rows={2} placeholder="Full address" className="input w-full resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Pincode</label>
              <input value={form.pincode} onChange={f('pincode')} placeholder="Pincode" className="input w-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-inputer">
            {saving
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
              : <Save size={14}/>}
            {editing ? 'Update' : 'Add Company'}
          </button>
        </div>
      </div>
    </div>
  )
}

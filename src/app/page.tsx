'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Mail, Phone, MapPin, Linkedin } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Product = { sr: number; name: string; fullname: string; mw: string; cas: string; purity: string }

// ─── CHEMICAL STRUCTURE SVGs ─────────────────────────────────────────────────
const structures: Record<number, () => JSX.Element> = {
  1: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <g transform="translate(60,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <line x1="0" y1="-28" x2="0" y2="-42" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="-48" textAnchor="middle" fontSize="9" fill="#333">OH</text>
        <line x1="24" y1="-14" x2="36" y2="-21" stroke="#333" strokeWidth="1.2"/>
        <text x="44" y="-18" textAnchor="middle" fontSize="9" fill="#1a6">NH&#8322;</text>
        <line x1="24" y1="14" x2="36" y2="21" stroke="#333" strokeWidth="1.2"/>
        <text x="44" y="24" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
      </g>
    </svg>
  ),
  2: () => (
    <svg viewBox="0 0 140 130" width="100" height="90">
      <g transform="translate(65,65)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-38" textAnchor="middle" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="28" y="-18" textAnchor="start" fontSize="8" fill="#333">OH</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="-46" y="0" textAnchor="end" fontSize="8" fill="#333">HO&#8323;S</text>
        <line x1="-24" y1="0" x2="-32" y2="0" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="24" textAnchor="start" fontSize="8" fill="#333">NHAc</text>
        <line x1="24" y1="14" x2="30" y2="20" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  3: () => (
    <svg viewBox="0 0 130 130" width="95" height="90">
      <g transform="translate(65,65)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="-36" y="-18" textAnchor="end" fontSize="8" fill="#333">HO&#8323;S</text>
        <line x1="-24" y1="-14" x2="-32" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="-4" y="-36" textAnchor="middle" fontSize="8" fill="#333">OH</text>
        <line x1="0" y1="-28" x2="0" y2="-32" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#c00">NO&#8322;</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  4: () => (
    <svg viewBox="0 0 130 130" width="95" height="90">
      <g transform="translate(65,65)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="-36" y="-18" textAnchor="end" fontSize="8" fill="#c00">O&#8322;N</text>
        <line x1="-24" y1="-14" x2="-32" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="-4" y="-36" textAnchor="middle" fontSize="8" fill="#333">OH</text>
        <line x1="0" y1="-28" x2="0" y2="-32" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  5: () => (
    <svg viewBox="0 0 130 130" width="95" height="90">
      <g transform="translate(65,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-38" textAnchor="middle" fontSize="9" fill="#090">Cl</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="36" y="-18" textAnchor="start" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="24" y1="-14" x2="32" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#c00">NO&#8322;</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  6: () => (
    <svg viewBox="0 0 200 100" width="140" height="80">
      <g transform="translate(10,50)">
        <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(25,0)"/>
        <circle cx="25" cy="0" r="11" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="25" y="-30" textAnchor="middle" fontSize="8" fill="#1a6">H&#8322;N</text>
        <line x1="25" y1="-22" x2="25" y2="-27" stroke="#333" strokeWidth="1.2"/>
        <line x1="44" y1="0" x2="58" y2="0" stroke="#333" strokeWidth="1.2"/>
        <text x="51" y="-6" textAnchor="middle" fontSize="8" fill="#333">NH</text>
        <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(90,0)"/>
        <circle cx="90" cy="0" r="11" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="90" y="-30" textAnchor="middle" fontSize="8" fill="#333">HO&#8323;S</text>
        <line x1="90" y1="-22" x2="90" y2="-27" stroke="#333" strokeWidth="1.2"/>
        <text x="115" y="4" textAnchor="start" fontSize="8" fill="#c00">NO&#8322;</text>
        <line x1="109" y1="0" x2="115" y2="0" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  7: () => (
    <svg viewBox="0 0 200 100" width="140" height="80">
      <g transform="translate(10,50)">
        <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(22,0)"/>
        <circle cx="22" cy="0" r="10" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="22" y="-28" textAnchor="middle" fontSize="8" fill="#1a6">H&#8322;N</text>
        <line x1="22" y1="-20" x2="22" y2="-25" stroke="#333" strokeWidth="1.2"/>
        <line x1="39" y1="0" x2="52" y2="0" stroke="#333" strokeWidth="1.5"/>
        <text x="46" y="-6" textAnchor="middle" fontSize="8" fill="#333">N=N</text>
        <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(85,0)"/>
        <circle cx="85" cy="0" r="10" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="107" y="4" textAnchor="start" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="102" y1="0" x2="108" y2="0" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  8: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <g transform="translate(60,55)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-38" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  9: () => (
    <svg viewBox="0 0 200 130" width="140" height="90">
      <g transform="translate(10,20)">
        <rect x="40" y="20" width="50" height="40" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
        <rect x="90" y="20" width="50" height="40" rx="4" fill="none" stroke="#333" strokeWidth="1.5"/>
        <text x="60" y="45" textAnchor="middle" fontSize="7" fill="#333">N</text>
        <text x="100" y="45" textAnchor="middle" fontSize="7" fill="#333">N</text>
        <text x="130" y="45" textAnchor="middle" fontSize="7" fill="#c00">Cl</text>
        <text x="40" y="12" textAnchor="middle" fontSize="7" fill="#333">SO&#8323;H</text>
        <text x="140" y="12" textAnchor="middle" fontSize="7" fill="#333">SO&#8323;H</text>
        <text x="10" y="70" textAnchor="start" fontSize="7" fill="#1a6">NH-CH&#8322;CH&#8322;NH&#8322;</text>
        <text x="130" y="80" textAnchor="start" fontSize="7" fill="#1a6">NHCH&#8322;CH&#8322;NH&#8322;</text>
        <line x1="40" y1="60" x2="20" y2="72" stroke="#333" strokeWidth="1.2"/>
        <line x1="140" y1="60" x2="150" y2="72" stroke="#333" strokeWidth="1.2"/>
        <text x="75" y="95" textAnchor="middle" fontSize="7" fill="#c00">Cl</text>
        <line x1="65" y1="60" x2="65" y2="88" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  10: () => (
    <svg viewBox="0 0 200 130" width="140" height="90">
      <g transform="translate(15,20)">
        <rect x="55" y="25" width="55" height="45" fill="none" stroke="#333" strokeWidth="1.5"/>
        <polygon points="55,25 35,25 20,48 35,70 55,70" fill="none" stroke="#333" strokeWidth="1.5"/>
        <polygon points="110,25 130,25 145,48 130,70 110,70" fill="none" stroke="#333" strokeWidth="1.5"/>
        <text x="83" y="35" textAnchor="middle" fontSize="7" fill="#333">O</text>
        <text x="83" y="65" textAnchor="middle" fontSize="7" fill="#333">O</text>
        <text x="38" y="45" textAnchor="middle" fontSize="7" fill="#1a6">NH&#8322;</text>
        <text x="128" y="45" textAnchor="middle" fontSize="7" fill="#1a6">NH&#8322;</text>
        <text x="60" y="18" fontSize="7" fill="#333">SO&#8323;Na</text>
        <text x="100" y="18" fontSize="7" fill="#333">SO&#8323;Na</text>
        <text x="30" y="90" fontSize="7" fill="#333">CH&#8323; CH&#8323;</text>
        <text x="110" y="90" fontSize="7" fill="#333">CH&#8323;</text>
      </g>
    </svg>
  ),
  11: () => (
    <svg viewBox="0 0 130 130" width="95" height="90">
      <g transform="translate(65,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="-36" y="-18" textAnchor="end" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="-24" y1="-14" x2="-32" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#090">Cl</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="-4" y="-36" textAnchor="middle" fontSize="8" fill="#090">Cl</text>
        <line x1="0" y1="-28" x2="0" y2="-32" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  12: () => (
    <svg viewBox="0 0 200 120" width="140" height="90">
      <g transform="translate(20,55)">
        <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(25,0)"/>
        <circle cx="25" cy="0" r="11" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="25" y="-30" textAnchor="middle" fontSize="8" fill="#1a6">H&#8322;N</text>
        <line x1="25" y1="-22" x2="25" y2="-27" stroke="#333" strokeWidth="1.2"/>
        <polygon points="44,0 58,-14 78,-14 88,0 78,14 58,14" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(10,0)"/>
        <text x="75" y="4" textAnchor="middle" fontSize="8" fill="#333">N</text>
        <text x="65" y="-12" textAnchor="middle" fontSize="7" fill="#b60">S</text>
        <text x="120" y="-6" textAnchor="start" fontSize="8" fill="#333">O=S=O</text>
        <text x="127" y="10" textAnchor="start" fontSize="8" fill="#333">OH</text>
        <line x1="100" y1="0" x2="118" y2="-4" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  13: () => (
    <svg viewBox="0 0 200 130" width="140" height="90">
      <g transform="translate(15,20)">
        <polygon points="0,-18 15,-9 15,9 0,18 -15,9 -15,-9" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(25,55)"/>
        <text x="60" y="35" textAnchor="middle" fontSize="8" fill="#333">N</text>
        <text x="90" y="35" textAnchor="middle" fontSize="8" fill="#333">N</text>
        <line x1="40" y1="38" x2="55" y2="38" stroke="#333" strokeWidth="1.2"/>
        <line x1="65" y1="38" x2="85" y2="38" stroke="#333" strokeWidth="1.2"/>
        <line x1="95" y1="38" x2="110" y2="38" stroke="#333" strokeWidth="1.2"/>
        <circle cx="75" cy="55" r="12" fill="none" stroke="#b87333" strokeWidth="2"/>
        <text x="75" y="59" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b87333">Cu</text>
        <polygon points="0,-18 15,-9 15,9 0,18 -15,9 -15,-9" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(125,55)"/>
        <text x="15" y="70" fontSize="7" fill="#333">NaO&#8323;S</text>
        <text x="100" y="35" textAnchor="start" fontSize="7" fill="#333">SO&#8323;Na</text>
      </g>
    </svg>
  ),
  14: () => (
    <svg viewBox="0 0 120 130" width="90" height="95">
      <g transform="translate(60,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-36" textAnchor="middle" fontSize="8" fill="#333">COOH</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  15: () => (
    <svg viewBox="0 0 130 130" width="95" height="95">
      <g transform="translate(65,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-36" textAnchor="middle" fontSize="8" fill="#333">COOH</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#1a6">NH&#8322;</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="-36" y="18" textAnchor="end" fontSize="8" fill="#333">HO&#8323;S</text>
        <line x1="-24" y1="14" x2="-32" y2="18" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  16: () => (
    <svg viewBox="0 0 200 120" width="140" height="85">
      <g transform="translate(10,55)">
        <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(25,0)"/>
        <circle cx="25" cy="0" r="10" fill="none" stroke="#333" strokeWidth="0.8"/>
        <text x="10" y="-28" fontSize="7" fill="#333">HOOC</text>
        <line x1="15" y1="-20" x2="10" y2="-25" stroke="#333" strokeWidth="1.2"/>
        <text x="10" y="30" fontSize="7" fill="#333">SO&#8323;H</text>
        <line x1="15" y1="20" x2="10" y2="26" stroke="#333" strokeWidth="1.2"/>
        <text x="50" y="-5" textAnchor="middle" fontSize="8" fill="#333">NH&#8212;N=CH&#8212;</text>
        <line x1="42" y1="0" x2="55" y2="0" stroke="#333" strokeWidth="1.2"/>
        <polygon points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10" fill="none" stroke="#333" strokeWidth="1.5" transform="translate(140,0)"/>
        <circle cx="140" cy="0" r="10" fill="none" stroke="#333" strokeWidth="0.8"/>
        <line x1="90" y1="0" x2="123" y2="0" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
  17: () => (
    <svg viewBox="0 0 120 130" width="90" height="95">
      <g transform="translate(60,60)">
        <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="none" stroke="#333" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#333" strokeWidth="1"/>
        <text x="0" y="-36" textAnchor="middle" fontSize="8" fill="#333">SO&#8323;H</text>
        <line x1="0" y1="-28" x2="0" y2="-33" stroke="#333" strokeWidth="1.2"/>
        <text x="30" y="-18" textAnchor="start" fontSize="8" fill="#555">Me</text>
        <line x1="24" y1="-14" x2="30" y2="-18" stroke="#333" strokeWidth="1.2"/>
        <text x="0" y="40" textAnchor="middle" fontSize="8" fill="#c00">O&#8322;N</text>
        <line x1="0" y1="28" x2="0" y2="33" stroke="#333" strokeWidth="1.2"/>
      </g>
    </svg>
  ),
}

// ─── INQUIRY MODAL ────────────────────────────────────────────────────────────
const InquiryModal = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
  const [form, setForm] = useState({ name: '', email: '', company: '', quantity: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  if (!product) return null

  const handleSubmit = async () => {
    setSending(true)
    try {
      await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inquiry', product: `${product.name} — ${product.fullname}`, ...form }),
      })
    } catch (e) { console.error(e) }
    setSending(false)
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-5 flex justify-between items-start">
          <div>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">Product Inquiry</p>
            <h2 className="text-white font-black text-xl leading-tight">{product.name}</h2>
            <p className="text-gray-300 text-xs mt-1">{product.fullname}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white mt-1"><X size={22} /></button>
        </div>
        {sent ? (
          <div className="px-8 py-12 text-center">
            <div className="text-5xl mb-4">&#10003;</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Inquiry Sent!</h3>
            <p className="text-gray-600 mb-6">Thank you. Our team will contact you shortly.</p>
            <button onClick={onClose} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-lg">Close</button>
          </div>
        ) : (
          <div className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="you@company.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Company name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Required</label>
                <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. 500 kg" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Any specific requirements..." />
            </div>
            <button onClick={handleSubmit} disabled={sending} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-300 text-sm disabled:opacity-60">
              {sending ? 'Sending…' : 'Submit Inquiry'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LOGO (base64) ────────────────────────────────────────────────────────────
const logoSrc = "data:image/jpeg;base64,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"

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function VidhiHexachemWebsite() {
  const [currentPage, setCurrentPage] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [zoomStructure, setZoomStructure] = useState<{ src: string; name: string } | null>(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [currentPage])

  const products: Product[] = [
    { sr: 1,  name: 'OPASA',                     fullname: 'Ortho Amino Phenol-4-Sulfonic Acid',                 mw: '189',    cas: '98-37-3',     purity: '92%' },
    { sr: 2,  name: '6 ACETYL OAPSA',            fullname: '6 Acetyl 2 (Ortho) Amino Phenol 4 Sulphonic Acid', mw: '246.2',  cas: '40306-75-0',  purity: '83%' },
    { sr: 3,  name: '4 NAPSA',                   fullname: '4-Nitro-2-Amino Phenol-6-Sulfonic Acid',            mw: '234',    cas: '96-67-3',     purity: '83%' },
    { sr: 4,  name: '6 NAPSA',                   fullname: '6-Nitro-2-Amino Phenol-4-Sulfonic Acid',            mw: '234',    cas: '96-93-5',     purity: '75%' },
    { sr: 5,  name: 'PNCBOSA',                   fullname: 'Para Nitro Chloro Benzene Ortho Sulfonic Acid',     mw: '237.5',  cas: '946-30-5',    purity: '74%' },
    { sr: 6,  name: '4 NADPSA',                  fullname: "4'-Amino-4-Nitro Diphenylamine-2-Sulfonic Acid",   mw: '309',    cas: '91-29-2',     purity: '89%' },
    { sr: 7,  name: 'PAABSA',                    fullname: 'Para Amino Azo Benzene-4-Sulfonic Acid',            mw: '277',    cas: '102-23-8',    purity: '94%' },
    { sr: 8,  name: 'METANILIC ACID',            fullname: '1 Amino Benzene 3, Sulphonic Acid',                 mw: '173.19', cas: '121-47-1',    purity: '98%' },
    { sr: 9,  name: 'HEGN BASE STAGE -1,2,3',   fullname: 'HEGN Intermediate Base Stage',                      mw: '703',    cas: '60316-87-2',  purity: '-'   },
    { sr: 10, name: 'BLUE 49 BASE',              fullname: 'Blue Reactive Dye Base',                            mw: '575',    cas: '24124-40-1',  purity: '75%' },
    { sr: 11, name: 'PPDDSA',                    fullname: 'Para Phenylene Diamine-2,5-Disulfonic Acid',        mw: '268',    cas: '7139-89-1',   purity: '98%' },
    { sr: 12, name: 'DTPTSA',                    fullname: 'Dehydrothio-p-toluidine Sulfonic Acid',             mw: '320.39', cas: '130-17-6',    purity: '86%' },
    { sr: 13, name: 'COPPER FORMAZONE',          fullname: 'BASE OF RE. BLUE 221',                              mw: '641',    cas: '77840-01-8',  purity: '57%' },
    { sr: 14, name: '4 SULPHO ANTHRANILIC ACID', fullname: '2-Amino-4-Sulfo Benzoic Acid',                     mw: '217',    cas: '98-43-1',     purity: '63%' },
    { sr: 15, name: '5 SULPHO ANTHRANILIC ACID', fullname: '2-Amino-5-Sulfo Benzoic Acid',                     mw: '217',    cas: '3577-63-7',   purity: '85%' },
    { sr: 16, name: '4 SULPHO HYDRAZONE',        fullname: 'Hydrazone of 4-Sulpho Anthranilic Acid',           mw: '320',    cas: '118969-29-2', purity: '70%' },
    { sr: 17, name: 'PNTOSA',                    fullname: 'Para Nitro Toluene Ortho Sulphonic Acid',           mw: '217.21', cas: '121-03-9',    purity: '82%' },
  ]

  const navItems = [
    { id: 'home',           label: 'Home' },
    { id: 'about',          label: 'About Us' },
    { id: 'products',       label: 'Products' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'group',          label: 'Our Group' },
    { id: 'contact',        label: 'Contact' },
  ]

  const Navigation = () => (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false) }} className="flex items-center gap-3 cursor-pointer">
            <img src={logoSrc} alt="Vidhi Hexachem LLP" style={{ height: '52px', width: 'auto' }} />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false) }}
                className={`text-sm font-semibold transition-all duration-300 pb-1 ${currentPage === item.id ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500 hover:text-gray-800'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false) }}
                className={`block w-full text-left px-4 py-3 text-sm font-semibold transition-colors ${currentPage === item.id ? 'text-teal-600 border-l-2 border-teal-500 bg-teal-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )

  const owners = [
    {
      name: 'Nisarg Trivedi',
      role: 'Director',
      contact: '+91 63546 65395',
      image: '/nisarg.jpeg',
      cardImage: '/nisarg-profile.png',
      photoPosition: 'center 42%',
      imageTransform: 'none',
      cardPhotoPosition: 'center center',
      cardMessage: '"Quality is not an act — it is a habit. At Vidhi Hexachem, we commit to delivering nothing less than excellence to every client, every time."',
      message: '"Vidhi Hexachem was born from a simple belief: that scientific excellence and modern manufacturing practices can transform the chemical intermediates market. As a young leader, I\'m determined to set new standards and deliver on every promise — because our reputation depends on it."',
      tag: 'Vision & Growth',
    },
    {
      name: 'Vishnu Patel',
      role: 'Director',
      contact: '+91 97268 64012',
      image: '/vishnu.jpg',
      cardImage: '/vishnu.jpg',
      photoPosition: 'center top',
      imageTransform: 'none',
      cardPhotoPosition: 'center top',
      cardMessage: '"Our strength lies in trust. We build lasting partnerships by putting our clients\' success at the heart of everything we manufacture."',
      message: '"Decades have taught me one lesson: lasting success is built on reliability and relationships. Vidhi Hexachem fuses experienced wisdom with forward-thinking innovation — delivering products clients can proudly stand behind."',
      tag: 'Experience & Trust',
    },
  ]

  const CoreTeamSection = () => (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-sm uppercase tracking-widest text-gray-500 text-center mb-2">OUR LEADERSHIP</h2>
        <h3 className="text-4xl font-black text-center text-slate-900 mb-3">FOUNDING MEMBERS & PARTNERS</h3>
        <div className="w-16 h-1 bg-cyan-400 mx-auto mb-12 rounded-full"></div>
        <div className="grid md:grid-cols-2 gap-12 max-w-2xl mx-auto">
          {owners.map((member, idx) => (
            <div key={idx} className="flip-card h-72">
              <div className="flip-card-inner">
                {/* Front */}
                <div className="flip-card-front bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl text-center border border-gray-200 shadow-lg flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full mx-auto mb-5 shadow-lg overflow-hidden border-4 border-cyan-400">
                    <img src={member.cardImage} alt={member.name} className="w-full h-full object-cover" style={{ objectPosition: member.cardPhotoPosition }} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                  <a href={`tel:${member.contact.replace(/\s/g, '')}`} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">{member.contact}</a>
                </div>
                {/* Back */}
                <div className="flip-card-back bg-gradient-to-br from-slate-900 to-blue-900 p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                  <svg className="w-8 h-8 text-cyan-400 mb-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                  <p className="text-white text-lg font-bold leading-relaxed italic mb-6">{member.cardMessage}</p>
                  <p className="text-cyan-400 font-black text-sm tracking-widest uppercase">— {member.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  const OwnerSpotlight = () => {
    const [active, setActive] = useState(0)
    const [fading, setFading] = useState(false)
    useEffect(() => {
      const timer = setInterval(() => {
        setFading(true)
        setTimeout(() => {
          setActive(a => (a + 1) % owners.length)
          setFading(false)
        }, 400)
      }, 10000)
      return () => clearInterval(timer)
    }, [])
    const owner = owners[active]
    return (
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-cyan-400 text-center mb-2">Leadership</h2>
          <h3 className="text-4xl font-black text-center mb-3">A Word From Our Directors</h3>
          <div className="w-16 h-1 bg-cyan-400 mx-auto mb-14 rounded-full"></div>
          <div
            className="grid md:grid-cols-2 gap-12 items-center transition-opacity duration-400"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {/* Full image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[520px]">
              <img src={owner.image} alt={owner.name} className="w-full h-full object-cover" style={{ objectPosition: owner.photoPosition }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{owner.tag}</span>
              </div>
            </div>
            {/* Message */}
            <div className="flex flex-col justify-center">
              <svg className="w-12 h-12 text-cyan-400 mb-6 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-white/90 italic mb-8">{owner.message}</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 flex-shrink-0">
                  <img src={owner.cardImage} alt={owner.name} className="w-full h-full object-cover" style={{ objectPosition: owner.cardPhotoPosition }} />
                </div>
                <div>
                  <p className="font-black text-lg text-white">{owner.name}</p>
                  <p className="text-cyan-400 text-sm font-semibold">{owner.role}, Vidhi Hexachem LLP</p>
                  <a href={`tel:${owner.contact.replace(/\s/g, '')}`} className="text-gray-400 text-sm hover:text-cyan-400 transition-colors">{owner.contact}</a>
                </div>
              </div>
              {/* Dots */}
              <div className="flex gap-2 mt-10">
                {owners.map((_, i) => (
                  <button key={i} onClick={() => { setFading(true); setTimeout(() => { setActive(i); setFading(false) }, 400) }}
                    className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-cyan-400 w-8' : 'bg-white/30 w-2'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const SalesNetworkSection = () => (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-500 text-center mb-2">WE ARE GLOBAL</p>
        <h3 className="text-4xl font-black text-center text-slate-900 mb-10">SALES NETWORK</h3>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <img src="/map.jpg" alt="Sales Network Map" className="w-full rounded-xl" />
        </div>
      </div>
    </section>
  )

  const factoryImages = [
    '/factory-08.jpeg',  // factory image
    '/factory-01.jpeg',  // dramatic boiler room — dark industrial
    '/factory-40.jpeg',  // blue reactor vessel — matches website blue
    '/factory-13.jpeg',  // blue cylindrical storage tank — clean
    '/factory-47.jpeg',  // exterior building / facility overview
  ]

  const HomeBanner = () => {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
      const timer = setInterval(() => setCurrent(c => (c + 1) % factoryImages.length), 5000)
      return () => clearInterval(timer)
    }, [])
    return (
      <div className="relative h-[600px] md:h-screen overflow-hidden">
        {factoryImages.map((src, idx) => (
          <div
            key={idx}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url("${src}")`, opacity: idx === current ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white z-10 px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              THE CHEMISTRY OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">EXCELLENCE</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Vidhi Hexa Chem delivers premium chemical intermediates for dye, pigment, and pharmaceutical industries worldwide.
            </p>
            <button onClick={() => setCurrentPage('products')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
              View Products
            </button>
          </div>
        </div>
        {/* Dots indicator */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
          {factoryImages.map((_, idx) => (
            <button key={idx} onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? 'bg-cyan-400 w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    )
  }

  const HomePage = () => (
    <div>
      <HomeBanner />
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">WELCOME TO VIDHI HEXACHEM</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                Vidhi Hexachem LLP is a globally renowned manufacturer and exporter of premium chemical intermediates for the dye, pigment, and pharmaceutical industries.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Our team is united by a vision of "Delivering Excellence Daily". We fulfill our duty of delivering products that meet the economic needs of the industry while maintaining the highest environmental standards.
              </p>
              <button onClick={() => setCurrentPage('about')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Learn More About Us
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden h-80">
              <img src="/chemical-intermediate.jpeg" alt="Chemical Intermediates" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '30+',  label: 'Years of Experience' },
              { number: '17',   label: 'Intermediate Products' },
              { number: '500+', label: 'Happy Clients' },
              { number: '50K+', label: 'MT Annual Capacity' },
            ].map((stat, idx) => (
              <div key={idx} className="transform hover:scale-110 transition-transform duration-300">
                <p className="text-5xl font-black text-cyan-400 mb-2">{stat.number}</p>
                <p className="text-gray-300 font-semibold text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CoreTeamSection />
      <SalesNetworkSection />
      <section className="bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[560px]">
          <div className="md:w-1/2 h-80 md:h-auto">
            <img src="/business-approach.jpg" alt="Business Approach" className="w-full h-full object-cover" />
          </div>
          <div className="md:w-1/2 bg-gray-50 flex items-center px-10 md:px-14 py-14">
            <div className="w-full">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">VIDHI HEXACHEM</p>
              <h2 className="text-3xl font-black text-slate-900 mb-8">BUSINESS APPROACH</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-blue-700 flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="text-blue-700 font-bold mb-1">Boundaryless Organisational Development</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Multi-dimensional growth of the company from raw material to consumer.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-blue-700 flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="text-blue-700 font-bold mb-1">Empower People</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Give opportunities to grow & empower resources at each level to help them identify their Key Performance Indicators & Authorise actions.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-blue-700 flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="text-blue-700 font-bold mb-1">Make Key Choices to Reposition</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Polish our strengths, overcome our weaknesses, capture all opportunities and defend against the threats.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-blue-700 flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="text-blue-700 font-bold mb-1">Customer-Centric Innovation</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Continuously evolve our product portfolio and processes to meet and exceed evolving customer expectations across global markets.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-blue-700 flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="text-blue-700 font-bold mb-1">Sustainable & Responsible Growth</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Operate with strict environmental standards — minimising waste, reducing emissions, and delivering chemistry that is safe for people and the planet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl">
            {/* Left — info panel */}
            <div className="md:w-5/12 bg-[#1a3a6b] text-white p-10 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase mb-6 leading-snug">Request a Free Quote</h2>
                <p className="text-sm text-blue-100 leading-relaxed mb-4">
                  We strongly encourage everyone to request a free sample — regardless of whether you intend to buy. We want you to test our products and verify we are the right fit for your business.
                </p>
                <p className="text-sm text-blue-100 leading-relaxed mb-4">
                  Let us know the product you are interested in and we will dispatch it to you. <span className="font-semibold text-white">Delivery costs are on us!</span>
                </p>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Simply fill out the form and our team will get back to you within 24 hours.
                </p>
              </div>
              <div className="mt-10 text-4xl opacity-20 select-none">✉</div>
            </div>
            {/* Right — form */}
            <form className="md:w-7/12 bg-gray-50 p-10 flex flex-col justify-center gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const d = new FormData(e.currentTarget)
                const btn = (e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement)
                btn.disabled = true; btn.textContent = 'Sending…'
                await fetch('/api/send-inquiry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'quote', name: d.get('name'), email: d.get('email'), phone: d.get('phone'), product: d.get('product'), message: d.get('message') }),
                })
                btn.textContent = 'Sent ✓'; btn.className = btn.className.replace('border-[#1a3a6b] text-[#1a3a6b]', 'border-teal-600 text-teal-600')
              }}>
              <input name="name" type="text" required placeholder="Your Name" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors" />
              <input name="email" type="email" required placeholder="Your Email" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors" />
              <input name="phone" type="tel" placeholder="Mobile" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors" />
              <select name="product" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 focus:outline-none focus:border-teal-500 transition-colors">
                <option value="">Select Products</option>
                {['Chemical Intermediates', 'Aminophenols', 'Sulphonic Acids', 'Aromatic Amines', 'Other'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <textarea name="message" rows={4} placeholder="Message" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors resize-none" />
              <p className="text-xs text-gray-400">We respect your privacy.</p>
              <button type="submit" className="self-start border-2 border-[#1a3a6b] text-[#1a3a6b] hover:bg-[#1a3a6b] hover:text-white font-bold py-2 px-8 rounded-lg transition-all duration-300 disabled:opacity-60">
                Submit Now
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )

  const AboutPage = () => (
    <div>
      <div className="relative text-white py-28 bg-cover bg-center" style={{ backgroundImage: 'url("/our-team.webp")' }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-black mb-4">About Vidhi Hexachem</h1>
          <p className="text-xl text-cyan-400">Building Excellence Since 2020</p>
        </div>
      </div>
      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                Vidhi Hexachem LLP was founded with a singular vision — to become a world-class manufacturer of chemical intermediates that power the dye, pigment, pharmaceutical, and specialty chemical industries. With over 30 years of combined industry experience, our founding team built the company from the ground up, driven by a deep commitment to quality and scientific precision.
              </p>
              <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                From our state-of-the-art facility in Anand, Gujarat, we serve clients across India and international markets, supplying 17 carefully developed intermediates that meet strict purity and performance standards. Our journey from a regional supplier to a trusted global partner reflects our relentless pursuit of excellence.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Every product we manufacture undergoes rigorous quality checks, and every client relationship we build is grounded in transparency, reliability, and long-term value.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 h-96">
              {[
                { number: '30+',  label: 'Years of Experience',   bg: 'from-slate-800 to-slate-900' },
                { number: '17',   label: 'Product Intermediates', bg: 'from-cyan-500 to-blue-600'   },
                { number: '500+', label: 'Happy Clients',         bg: 'from-blue-600 to-indigo-700' },
                { number: '50K+', label: 'MT Annual Capacity',    bg: 'from-teal-500 to-cyan-600'   },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.bg} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg`}>
                  <p className="text-4xl font-black mb-1">{s.number}</p>
                  <p className="text-xs font-semibold text-white/80 text-center px-3">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed text-lg">To be the most trusted and innovative chemical intermediate supplier in South Asia, enabling our clients across the dye, pigment, and pharmaceutical sectors to manufacture world-class products with confidence and consistency.</p>
            </div>
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-lg">To manufacture high-purity chemical intermediates with uncompromising quality standards, fostering long-term partnerships built on reliability, scientific excellence, and customer-first values.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-gray-500 text-center mb-2">What Drives Us</h2>
          <h3 className="text-4xl font-black text-center text-slate-900 mb-3">Our Core Values</h3>
          <div className="w-16 h-1 bg-cyan-400 mx-auto mb-14 rounded-full"></div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Quality First', desc: 'Every batch undergoes rigorous purity and performance testing before it leaves our facility.', color: 'from-blue-500 to-blue-700' },
              { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'Innovation', desc: 'We continuously refine our processes and explore new formulations to stay ahead of industry demands.', color: 'from-cyan-500 to-teal-600' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Partnership', desc: 'We view every client relationship as a long-term partnership, not just a transaction.', color: 'from-indigo-500 to-blue-600' },
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', title: 'Sustainability', desc: 'Responsible manufacturing practices that protect people, communities, and the environment.', color: 'from-green-500 to-teal-500' },
            ].map((v, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 bg-gradient-to-br ${v.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={v.icon}/></svg>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-3">{v.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturing Capability */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-cyan-400 text-center mb-2">Built for Scale</h2>
          <h3 className="text-4xl font-black text-center mb-3">Manufacturing Capabilities</h3>
          <div className="w-16 h-1 bg-cyan-400 mx-auto mb-14 rounded-full"></div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'ISO-Grade Production', desc: 'Our plant operates under stringent quality management protocols, ensuring every intermediate meets international purity standards.' },
              { title: 'In-House R&D', desc: 'A dedicated research team continually optimizes synthesis routes, improving yield and reducing process variability.' },
              { title: 'Scalable Capacity', desc: 'With 50,000+ MT annual capacity and room to scale, we support clients from trial orders to full-volume production runs.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="w-10 h-1 bg-cyan-400 rounded-full mb-5"></div>
                <h4 className="text-xl font-black mb-3">{c.title}</h4>
                <p className="text-white/75 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-gray-500 text-center mb-2">Who We Serve</h2>
          <h3 className="text-4xl font-black text-center text-slate-900 mb-3">Industries We Supply To</h3>
          <div className="w-16 h-1 bg-cyan-400 mx-auto mb-14 rounded-full"></div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', title: 'Dye Industry', desc: 'Core supplier of azo dye intermediates including OPASA, PAABSA, METANILIC ACID, and other sulphonic acid compounds used in reactive, acid, and direct dyes.', color: 'from-blue-600 to-blue-800' },
              { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Pigment Industry', desc: 'Supplying aminophenols, nitro compounds, and coupling components critical in the production of organic pigments for coatings, plastics, and printing inks.', color: 'from-cyan-500 to-teal-600' },
              { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', title: 'Pharmaceutical', desc: 'Key sulphonic acid and amine intermediates used as building blocks in API synthesis, fine chemical manufacturing, and pharmaceutical formulation processes.', color: 'from-indigo-500 to-purple-600' },
              { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Specialty Chemicals', desc: 'Serving textile auxiliaries, optical brightener producers, and agrochemical manufacturers who rely on our high-purity aromatic intermediates for complex synthesis.', color: 'from-teal-500 to-green-600' },
            ].map((ind, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className={`bg-gradient-to-br ${ind.color} p-6 flex items-center justify-center`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ind.icon}/></svg>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-black text-slate-900 mb-3">{ind.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OwnerSpotlight />

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-2">Our Differentiators</h2>
              <h3 className="text-4xl font-black text-slate-900 mb-8">Why Clients Choose Vidhi Hexachem</h3>
              <div className="space-y-6">
                {[
                  { title: 'Consistent Purity Guarantee', desc: 'Every batch is tested in our in-house lab before dispatch. We back our purity claims with full CoA documentation.' },
                  { title: 'Flexible Order Quantities', desc: 'We accommodate both small trial orders and large bulk requirements, scaling seamlessly as your business grows.' },
                  { title: 'Technical Support', desc: 'Our chemistry team provides application guidance and troubleshooting, ensuring our intermediates perform precisely in your process.' },
                  { title: 'Reliable Lead Times', desc: 'With strong raw material procurement relationships and planned production cycles, we maintain on-time delivery rates above 95%.' },
                  { title: 'Competitive Pricing', desc: 'Direct manufacturing with efficient processes allows us to offer best-in-class pricing without compromising on quality.' },
                ].map((pt, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 mb-1">{pt.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{pt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-10 text-white">
              <h4 className="text-2xl font-black mb-8 text-center">At a Glance</h4>
              <div className="space-y-5">
                {[
                  { label: 'Founded', value: '2020' },
                  { label: 'Headquarters', value: 'Anand, Gujarat, India' },
                  { label: 'Products', value: '17 Chemical Intermediates' },
                  { label: 'Annual Capacity', value: '50,000+ MT' },
                  { label: 'Export Reach', value: '14+ Countries' },
                  { label: 'Key Industries', value: 'Dye · Pigment · Pharma' },
                  { label: 'Certifications', value: 'ISO 9001 · ISO 14001 · ZLD' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-white/60 text-sm">{item.label}</span>
                    <span className="text-white font-bold text-sm text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  const ProductsPage = () => (
    <div>
      <div className="relative text-white py-20 bg-cover bg-center" style={{ backgroundImage: 'url("/product-banner.jpg")' }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-black mb-4">Our Intermediate Products</h1>
          <p className="text-xl text-cyan-400">Premium chemical intermediates for dye, pigment & pharmaceutical manufacturing</p>
        </div>
      </div>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-4 text-center">Chemical Intermediates</h2>
          <p className="text-center text-gray-700 max-w-2xl mx-auto mb-6">17 premium intermediates for dyes, pigments, pharmaceuticals & specialty chemicals.</p>
          <div className="max-w-md mx-auto mb-8 relative">
            <input type="text" placeholder="Search by name or CAS No…" value={productSearch} onChange={e => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors shadow-sm" />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {productSearch && <button onClick={() => setProductSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>}
          </div>
          <div className="overflow-x-auto rounded-xl shadow-lg">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
                  <th className="border border-gray-700 px-3 py-3 text-left font-bold">Sr.</th>
                  <th className="border border-gray-700 px-3 py-3 text-left font-bold">Product Name</th>
                  <th className="border border-gray-700 px-3 py-3 text-left font-bold">M.W.</th>
                  <th className="border border-gray-700 px-3 py-3 text-left font-bold">CAS No.</th>
                  <th className="border border-gray-700 px-3 py-3 text-left font-bold">Purity (Min)</th>
                  <th className="border border-gray-700 px-3 py-3 text-center font-bold">Structure</th>
                  <th className="border border-gray-700 px-3 py-3 text-center font-bold">Inquiry</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const q = productSearch.toLowerCase()
                  const filtered = q ? products.filter(p => p.name.toLowerCase().includes(q) || p.fullname.toLowerCase().includes(q) || p.cas.includes(q)) : products
                  if (filtered.length === 0) return <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">No products match your search.</td></tr>
                  return filtered.map((p, idx) => {
                    const structSrc = `/structures/product-${p.sr}.png`
                    return (
                      <tr key={p.sr} className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50`}>
                        <td className="border border-gray-200 px-3 py-3 font-semibold text-slate-900 text-center">{p.sr}</td>
                        <td className="border border-gray-200 px-3 py-3">
                          <div className="font-bold text-slate-900 text-xs md:text-sm">{p.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{p.fullname}</div>
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-slate-900 text-xs font-mono">{p.mw}</td>
                        <td className="border border-gray-200 px-3 py-3 text-slate-900 text-xs font-mono">{p.cas}</td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${parseInt(p.purity) >= 90 ? 'bg-green-100 text-green-700' : parseInt(p.purity) >= 75 ? 'bg-blue-100 text-blue-700' : p.purity === '-' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>{p.purity}</span>
                        </td>
                        <td className="border border-gray-200 px-2 py-2 text-center">
                          <button onClick={() => setZoomStructure({ src: structSrc, name: p.name })} className="group relative inline-block hover:scale-110 transition-transform duration-200 cursor-zoom-in">
                            <img src={structSrc} alt={`${p.name} structure`} className="w-20 h-16 object-contain mx-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-blue-600 bg-blue-50/80 rounded">&#128269; Zoom</span>
                          </button>
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <button onClick={() => setInquiryProduct(p)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md active:scale-95">
                            Inquire
                          </button>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {zoomStructure && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4" onClick={() => setZoomStructure(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-4">{zoomStructure.name}</h3>
            <img src={zoomStructure.src} alt={zoomStructure.name} className="w-full object-contain max-h-64 mx-auto" />
            <button onClick={() => setZoomStructure(null)} className="mt-6 bg-slate-900 text-white font-bold py-2 px-8 rounded-lg hover:bg-slate-700 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  )

  const infraImages = [
    '/factory-01.jpeg',  // boiler room with blue fans — wide landscape
    '/factory-03.jpeg',  // row of grinding mills — wide horizontal
    '/factory-08.jpeg',  // multiple reactor vessels — wide horizontal
    '/factory-14.jpeg',  // round mixing vessel with scraper arm
    '/factory-34.jpeg',  // blue cooling trough — strong horizontal
  ]

  const InfraBanner = () => {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
      const timer = setInterval(() => setCurrent(c => (c + 1) % infraImages.length), 5000)
      return () => clearInterval(timer)
    }, [])
    return (
      <div className="relative text-white overflow-hidden" style={{ minHeight: 420 }}>
        {infraImages.map((src, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundSize: '120%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              opacity: idx === current ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="relative h-full flex items-center max-w-6xl mx-auto px-4" style={{ minHeight: 420 }}>
          <div>
            <h1 className="text-5xl font-black mb-4">Our Infrastructure</h1>
            <p className="text-xl text-cyan-400">State-of-the-art facilities and capabilities</p>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {infraImages.map((_, idx) => (
            <button key={idx} onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === current ? 'bg-cyan-400 w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    )
  }

  const InfrastructurePage = () => (
    <div>
      <InfraBanner />
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-4 text-center">Manufacturing Facilities</h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12">Our state-of-the-art plant in Anand, Gujarat is built for scale, precision, and environmental responsibility.</p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { title: 'Production Units',     desc: 'Multi-reactor batch processing plant with automated temperature and pressure controls for consistent product quality at scale.', icon: '🏭' },
              { title: 'R&D Laboratory',       desc: 'In-house analytical lab equipped with HPLC, GC, and spectroscopy instruments for continuous product development and batch testing.', icon: '🔬' },
              { title: 'Quality Assurance',    desc: 'ISO 9001:2015 certified QA protocols with full traceability — from raw material intake to finished goods dispatch.', icon: '✓' },
              { title: 'Storage & Warehousing',desc: 'Temperature-controlled storage with 5,000+ MT capacity, segregated by product class and compliant with hazardous material standards.', icon: '📦' },
              { title: 'Effluent Treatment',   desc: 'Zero liquid discharge (ZLD) effluent treatment plant ensuring full environmental compliance with GPCB norms.', icon: '♻️' },
              { title: 'Logistics & Export',   desc: 'Dedicated loading bays with containerised export packing, supporting shipments to 14+ countries across 5 continents.', icon: '🚢' },
            ].map((f, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-12 mb-12">
            <h3 className="text-3xl font-black mb-10 text-center">Capacity & Capabilities</h3>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { label: 'Annual Production',      value: '50,000+', unit: 'MT' },
                { label: 'Storage Capacity',       value: '5,000+',  unit: 'MT' },
                { label: 'Export Countries',       value: '14+',     unit: 'Nations' },
                { label: 'Years of Operation',     value: '30+',     unit: 'Years' },
              ].map((item, idx) => (
                <div key={idx} className="text-center border-t-4 border-cyan-400 pt-6">
                  <p className="text-4xl font-black text-cyan-400">{item.value}</p>
                  <p className="text-sm font-semibold text-cyan-300 mb-1">{item.unit}</p>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
              <h3 className="text-xl font-black text-slate-900 mb-4">Certifications & Compliance</h3>
              <ul className="space-y-3">
                {['ISO 9001:2015 — Quality Management System', 'ISO 14001:2015 — Environmental Management', 'GPCB Compliant — Gujarat Pollution Control Board', 'REACH Compliant — European Chemical Standards', 'Zero Liquid Discharge (ZLD) Certified'].map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-teal-500 font-black mt-0.5">✓</span>{c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-black text-slate-900 mb-4">Packaging Options</h3>
              <ul className="space-y-3">
                {['25 kg & 50 kg HDPE bags', '200 kg MS / HDPE drums', 'Flexi bags (500 kg – 1 MT)', 'ISO tank containers (bulk)', 'Custom packaging on request'].map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-blue-500 font-black mt-0.5">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Process */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-gray-500 text-center mb-2">How We Work</h2>
          <h3 className="text-4xl font-black text-center text-slate-900 mb-3">Our Manufacturing Process</h3>
          <div className="w-16 h-1 bg-cyan-400 mx-auto mb-14 rounded-full"></div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-cyan-300 to-teal-200 mx-24"></div>
            <div className="grid md:grid-cols-5 gap-6">
              {[
                { step: '01', title: 'Raw Material Procurement', desc: 'Sourced from verified, high-grade suppliers with incoming quality inspection.' },
                { step: '02', title: 'Synthesis & Reaction', desc: 'Controlled batch reactions in multi-reactor units with precise temp & pressure monitoring.' },
                { step: '03', title: 'Purification', desc: 'Filtration, washing, and drying stages to achieve target purity specifications.' },
                { step: '04', title: 'QA Testing', desc: 'Full analytical testing — HPLC, TLC, moisture, and purity — with CoA generation.' },
                { step: '05', title: 'Packing & Dispatch', desc: 'Packed per order specs and dispatched with full documentation and traceability.' },
              ].map((s, i) => (
                <div key={i} className="text-center relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg z-10 relative">{s.step}</div>
                  <h4 className="font-black text-slate-900 text-sm mb-2">{s.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quality Control */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-2">Zero Compromise</h2>
              <h3 className="text-4xl font-black text-slate-900 mb-6">Quality Control at Every Stage</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">Our QA philosophy is built on the principle that quality cannot be tested in — it must be built in. From raw material intake to final dispatch, every stage is governed by strict protocols and documented for full traceability.</p>
              <div className="space-y-4">
                {[
                  { label: 'Raw Material Testing', detail: 'Identity, purity, and moisture checks on every incoming lot' },
                  { label: 'In-Process Monitoring', detail: 'Real-time pH, temperature, and reaction progress tracking' },
                  { label: 'Finished Goods Analysis', detail: 'HPLC purity, loss on drying, heavy metals, and appearance tests' },
                  { label: 'Batch Documentation', detail: 'Full CoA, MSDSs, and batch records issued with every shipment' },
                  { label: 'Customer Feedback Loop', detail: 'Structured complaint and feedback process with root-cause analysis' },
                ].map((q, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{q.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{q.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="/factory-03.jpeg" alt="Vidhi Hexa Chem Lab" className="rounded-2xl object-cover h-48 w-full shadow-md" />
              <img src="/factory-07.jpeg" alt="Vidhi Hexa Chem Facility" className="rounded-2xl object-cover h-48 w-full shadow-md" />
              <div className="col-span-2 bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white text-center">
                <p className="text-4xl font-black text-cyan-400 mb-1">99.2%</p>
                <p className="text-sm text-white/70">Average on-spec batch release rate across all product lines</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Environment */}
      <section className="py-20 bg-gradient-to-br from-teal-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm uppercase tracking-widest text-teal-400 text-center mb-2">Responsible Manufacturing</h2>
          <h3 className="text-4xl font-black text-center mb-3">Safety & Environmental Commitment</h3>
          <div className="w-16 h-1 bg-teal-400 mx-auto mb-14 rounded-full"></div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Worker Safety', desc: 'Strict PPE protocols, regular safety drills, emergency response systems, and a zero-tolerance policy on unsafe practices.' },
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Zero Liquid Discharge', desc: 'Our ZLD effluent treatment plant ensures no liquid waste enters the environment, in full compliance with GPCB norms and ISO 14001.' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Energy Efficiency', desc: 'Heat recovery systems, energy-efficient reactor design, and solar supplementation at our facility reduce our overall carbon footprint.' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
                <div className="w-14 h-14 bg-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon}/></svg>
                </div>
                <h4 className="text-xl font-black mb-3">{s.title}</h4>
                <p className="text-white/70 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
          {/* Zero Discharge Evidence */}
          <div className="mt-14 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src="/zero-discharge-1.jpeg" alt="Vidhi Hexa Chem Zero Liquid Discharge Plant" className="w-full h-72 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src="/zero-discharge-2.jpeg" alt="Vidhi Hexa Chem ZLD Effluent Treatment Facility" className="w-full h-72 object-cover" />
            </div>
          </div>
          <p className="text-center text-teal-300 text-sm mt-4 font-semibold">Our Zero Liquid Discharge (ZLD) effluent treatment plant — fully compliant with GPCB norms</p>
        </div>
      </section>
    </div>
  )

  const GroupPage = () => (
    <div>
      {/* Banner */}
      <div className="relative text-white py-28 bg-cover bg-center overflow-hidden" style={{ backgroundImage: 'url("/group-banner.webp")' }}>
        <div className="absolute inset-0 bg-slate-900/70"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-widest text-cyan-400 mb-3">The Family Behind Us</p>
          <h1 className="text-5xl font-black mb-4">Our Group Companies</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Vidhi Hexachem LLP is proud to be part of a larger legacy — backed by two of Gujarat's most respected names in dye and colorant manufacturing.</p>
          {/* Parent logos in banner */}
          <div className="flex items-center justify-center gap-10 mt-12">
            <a href="https://www.bipinindustries.com/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl px-6 py-4 hover:scale-105 transition-transform duration-200 shadow-lg">
              <img src="/bipin-logo.jpg" alt="Bipin Industries" className="h-12 object-contain" />
            </a>
            <div className="text-white/30 text-3xl font-light">×</div>
            <a href="https://vidhiindustries.com/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl px-6 py-4 hover:scale-105 transition-transform duration-200 shadow-lg">
              <img src="/vidhi-logo.png" alt="Vidhi Industries" className="h-12 object-contain" />
            </a>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-10 text-center max-w-3xl mx-auto">
            <p className="text-gray-700 text-lg leading-relaxed">
              Our parent companies — <strong className="text-slate-900">Bipin Industries</strong> and <strong className="text-slate-900">Vidhi Industries</strong> — bring over 55 years of combined expertise in dye manufacturing. Their deep industry knowledge, established client relationships, and operational excellence form the foundation on which Vidhi Hexachem was built and continues to grow.
            </p>
          </div>
        </div>
      </section>

      {/* Bipin Industries */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* Logo header */}
          <div className="flex items-center gap-5 mb-10">
            <img src="/bipin-logo.jpg" alt="Bipin Industries" className="h-14 object-contain bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100" />
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-xs uppercase tracking-widest text-blue-600 font-bold whitespace-nowrap">Parent Company</span>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2">Bipin Industries</h2>
              <p className="text-blue-700 font-semibold italic text-lg mb-6">"Enrich Growth With Colours"</p>
              <p className="text-gray-600 leading-relaxed mb-4 text-lg">
                Founded in <strong>1988</strong> in Vatva, Ahmedabad, Bipin Industries has grown into a leading manufacturer and exporter of dyestuff and colorants serving the textile, leather, and food industries across global markets.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Operating from a <strong>36,500 sq. ft. ISO 9001-certified facility</strong>, Bipin Industries produces over <strong>500 tonnes per month</strong> of reactive dyes, acid dyes, food colors, and dye intermediates — serving 200+ satisfied clients worldwide with a commitment to colour consistency and technical excellence.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { value: '1988', label: 'Year Founded' },
                  { value: '500T+', label: 'Monthly Capacity' },
                  { value: '200+', label: 'Global Clients' },
                  { value: 'ISO 9001', label: 'Certified' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-blue-100 p-5 text-center shadow-sm">
                    <p className="text-2xl font-black text-blue-700">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-700 mb-3">Product Portfolio</p>
                <div className="flex flex-wrap gap-2">
                  {['Reactive Dyes', 'Acid Dyes', 'Food Colors', 'Dye Intermediates', 'Bifunctional Dyes', 'Vinyl Sulphone', 'Chlorotriazin'].map(t => (
                    <span key={t} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">{t}</span>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-700 mb-3">Industries Served</p>
                <div className="flex flex-wrap gap-2">
                  {['Textile', 'Leather', 'Food & Beverage'].map(t => (
                    <span key={t} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <a href="https://www.bipinindustries.com/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md">
                Visit Bipin Industries
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            </div>
            <div className="space-y-5">
              {/* Factory / product images */}
              <div className="grid grid-cols-2 gap-3">
                <img src="/bipin-product.jpg" alt="Bipin Industries — dyed textiles" className="rounded-2xl object-cover h-44 w-full shadow-md" />
                <img src="/bipin-facility.jpg" alt="Bipin Industries — global reach" className="rounded-2xl object-cover h-44 w-full shadow-md" />
              </div>
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-8 text-white">
                <h4 className="text-xl font-black mb-5">Leadership</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Ketan Shah', role: 'Technical Head' },
                    { name: 'Kush Kalaria', role: 'Finance' },
                    { name: 'Chandrashekar Trivedi', role: 'Plant Operations & R&D' },
                    { name: 'Chetan Chokshi', role: 'International Marketing & R&D' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-sm flex-shrink-0">
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{m.name}</p>
                        <p className="text-blue-200 text-xs">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-sm text-gray-600">
                <span className="font-bold text-slate-900">Location: </span>GIDC Estate, Vatva, Ahmedabad, Gujarat, India
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-500"></div>

      {/* Vidhi Industries */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* Logo header */}
          <div className="flex items-center gap-5 mb-10">
            <span className="text-xs uppercase tracking-widest text-teal-600 font-bold whitespace-nowrap">Parent Company</span>
            <div className="h-px flex-1 bg-gray-200"></div>
            <img src="/vidhi-logo.png" alt="Vidhi Industries" className="h-14 object-contain bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100" />
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1 space-y-5">
              {/* Factory images */}
              <img src="/vidhi-about.jpg" alt="Vidhi Industries factory" className="rounded-2xl object-cover w-full h-64 shadow-md" />
              <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-8 text-white">
                <h4 className="text-xl font-black mb-5">At a Glance</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Founded', value: '2006 (Legacy since 1965)' },
                    { label: 'Location', value: 'GIDC Estate, Ahmedabad, Gujarat' },
                    { label: 'Annual Capacity', value: '12,000+ MTA' },
                    { label: 'Product Portfolio', value: '100+ Products' },
                    { label: 'Global Clients', value: '200+ Satisfied Clients' },
                    { label: 'Experience', value: '55+ Years in Industry' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <span className="text-teal-100 text-sm">{item.label}</span>
                      <span className="text-white font-bold text-sm text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Vidhi Industries</h2>
              <p className="text-teal-700 font-semibold italic text-lg mb-6">"The Color Touch Feeling"</p>
              <p className="text-gray-600 leading-relaxed mb-4 text-lg">
                With roots dating back to <strong>1965</strong> and formally established in 2006, Vidhi Industries carries over <strong>55 years of industry heritage</strong> in dye manufacturing. Based in the GIDC Estate, Ahmedabad, they are a trusted exporter to clients across the paper, pulp, and leather industries globally.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Their portfolio of <strong>100+ products</strong> — including direct dyes, basic dyes, acid dyes, and metal-complex non-benzidine formulations — supports an annual production capacity of <strong>12,000+ MTA</strong>, serving 200+ satisfied clients worldwide.
              </p>
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-700 mb-3">Product Portfolio</p>
                <div className="flex flex-wrap gap-2">
                  {['Direct Dyes', 'Basic Dyes', 'Acid Dyes', 'Direct Dyes Mix', 'Metal Complex', 'Non-Benzidine'].map(t => (
                    <span key={t} className="bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-100">{t}</span>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-700 mb-3">Industries Served</p>
                <div className="flex flex-wrap gap-2">
                  {['Paper & Pulp', 'Leather', 'Packaging'].map(t => (
                    <span key={t} className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <a href="https://vidhiindustries.com/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-3 px-8 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-md">
                Visit Vidhi Industries
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Group Strength Banner */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-black mb-4">Combined Group Strength</h3>
          <p className="text-gray-300 max-w-2xl mx-auto mb-12">Together, Bipin Industries, Vidhi Industries, and Vidhi Hexachem LLP form a vertically integrated group covering the full spectrum — from dye intermediates to finished dyes — for industries worldwide.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '55+', label: 'Years of Group Heritage' },
              { value: '400+', label: 'Combined Global Clients' },
              { value: '12.5K+', label: 'MTA Group Capacity' },
              { value: '3', label: 'Specialised Companies' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <p className="text-3xl font-black text-cyan-400 mb-1">{s.value}</p>
                <p className="text-gray-300 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const ContactPage = () => (
    <div>
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src="/contact-banner.webp" alt="Contact Us" className="w-full h-full object-cover" style={{ objectPosition: 'center 20%', transform: 'scale(1.15)', transformOrigin: 'center top' }} />
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-5xl font-black text-white mb-2">Get In Touch</h1>
            <p className="text-xl text-cyan-300">{"We'd love to hear from you"}</p>
          </div>
        </div>
      </div>
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Information</h2>
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Headquarters</h3>
                  <p className="text-gray-700">Survey no : 480 & 361, Vaduchi Mata Khambhat Road, Neja, Anand 388620, Gujarat, India</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-6">
                <Mail className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Email</h3>
                  <p className="text-gray-700">info@vidhihexachem.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Phone</h3>
                  <a href="tel:+916354665395" className="block text-gray-700 hover:text-blue-600 transition-colors">+91 63546 65395</a>
                  <a href="tel:+919726864012" className="block text-gray-700 hover:text-blue-600 transition-colors">+91 97268 64012</a>
                </div>
              </div>
              <div className="mt-10 pt-10 border-t-2 border-gray-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {[Linkedin].map((Icon, idx) => (
                    <button key={idx} className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors">
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault()
                const d = new FormData(e.currentTarget)
                const btn = (e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement)
                btn.disabled = true; btn.textContent = 'Sending…'
                await fetch('/api/send-inquiry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'contact', name: d.get('name'), email: d.get('email'), product: d.get('product'), message: d.get('message') }),
                })
                btn.textContent = 'Message Sent ✓'
              }}>
                <div>
                  <label className="block text-slate-900 font-semibold mb-2">Full Name</label>
                  <input name="name" type="text" required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-slate-900 font-semibold mb-2">Email</label>
                  <input name="email" type="email" required className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-slate-900 font-semibold mb-2">Product Interest</label>
                  <select name="product" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600">
                    <option value="">Select a product</option>
                    {products.map(p => <option key={p.sr}>{p.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-900 font-semibold mb-2">Message</label>
                  <textarea name="message" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" rows={4} placeholder="Your message"></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-60">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  const Footer = () => (
    <footer className="bg-slate-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navItems.map(link => (
                <li key={link.id}><button onClick={() => setCurrentPage(link.id)} className="hover:text-cyan-400 transition-colors">{link.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Products</h3>
            <ul className="space-y-2">
              {['Chemical Intermediates', 'Aminophenols', 'Sulphonic Acids', 'Aromatic Amines'].map(p => (
                <li key={p}><button onClick={() => setCurrentPage('products')} className="hover:text-cyan-400 transition-colors text-left">{p}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage('about')} className="hover:text-cyan-400 transition-colors">About Us</button></li>
              <li><button onClick={() => setCurrentPage('infrastructure')} className="hover:text-cyan-400 transition-colors">Infrastructure</button></li>
              <li><button onClick={() => setCurrentPage('group')} className="hover:text-cyan-400 transition-colors">Our Group</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="hover:text-cyan-400 transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li><a href="mailto:info@vidhihexachem.com" className="hover:text-cyan-400 transition-colors">info@vidhihexachem.com</a></li>
              <li><a href="tel:+916354665395" className="hover:text-cyan-400 transition-colors">+91 63546 65395</a></li>
              <li><a href="tel:+919726864012" className="hover:text-cyan-400 transition-colors">+91 97268 64012</a></li>
              <li>Anand, Gujarat, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center">
          <p>&copy; 2026 Vidhi Hexachem LLP. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {currentPage === 'home'           && <HomePage />}
      {currentPage === 'about'          && <AboutPage />}
      {currentPage === 'products'       && <ProductsPage />}
      {currentPage === 'infrastructure' && <InfrastructurePage />}
      {currentPage === 'group'          && <GroupPage />}
      {currentPage === 'contact'        && <ContactPage />}
      <Footer />
      {inquiryProduct && <InquiryModal product={inquiryProduct} onClose={() => setInquiryProduct(null)} />}
    </div>
  )
}

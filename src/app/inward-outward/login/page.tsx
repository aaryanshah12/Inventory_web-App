'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogIn } from 'lucide-react'

const SESSION_KEY    = 'io-last-activity'
const REMEMBER_KEY   = 'io-remember-me'

export default function IOLoginPage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  // Apply saved theme so login page matches the rest of the app
  useEffect(() => {
    const saved = (localStorage.getItem('io-theme') as 'dark' | 'light' | null) ?? 'light'
    document.documentElement.dataset.theme = saved
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      localStorage.removeItem('io-factory-id')
      localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false')
      localStorage.setItem(SESSION_KEY, Date.now().toString())
      router.replace('/inward-outward/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-5xl mb-4">📦</div>
          <div className="font-display text-2xl font-bold text-primary tracking-wider uppercase">
            I/<span className="text-inputer">O</span> Portal
          </div>
          <div className="font-mono text-[11px] text-muted tracking-widest mt-1 uppercase">
            Inward · Outward · Invoicing
          </div>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-muted mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input w-full"
              />
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                onClick={() => setRememberMe(v => !v)}
                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: rememberMe ? 'var(--color-inputer)' : 'var(--color-surface)',
                  borderColor: rememberMe ? 'var(--color-inputer)' : 'var(--color-border)',
                }}
              >
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-muted group-hover:text-primary transition-colors">
                Remember me <span className="opacity-60">(stay signed in)</span>
              </span>
            </label>
            <p className="text-[11px] text-muted -mt-2" style={{ paddingLeft: '1.625rem' }}>
              Without this, you&apos;ll be signed out after <strong>24 hours</strong> of inactivity.
            </p>

            {error && (
              <div className="text-xs text-red-400 rounded-lg px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-inputer w-full justify-center mt-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                : <><LogIn size={15}/> Sign In</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

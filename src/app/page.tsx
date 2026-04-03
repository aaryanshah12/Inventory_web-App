'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { profile, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return                          // still loading — wait
    if (!user)   { router.replace('/inventory/login'); return } // not logged in
    if (!profile) return                         // logged in but profile not ready yet — wait
    // Profile ready — redirect to role dashboard
    if (profile.role === 'owner')   router.replace('/inventory/owner')
    if (profile.role === 'inputer') router.replace('/inventory/inputer')
    if (profile.role === 'chemist') router.replace('/inventory/chemist')
  }, [profile, loading, user, router])

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-inputer border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">LOADING...</p>
      </div>
    </div>
  )
}

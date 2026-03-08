import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'ChemFactory Portal',
  description: 'Chemical Factory Stock Management System',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
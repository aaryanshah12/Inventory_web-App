import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'Vidhi Hexachem LLP | Chemical Intermediates Manufacturer',
  description: 'Vidhi Hexachem LLP — manufacturer and exporter of 17 premium chemical intermediates for dye, pigment & pharmaceutical industries. Based in Anand, Gujarat, India. Custom Manufacturing · CDMO · Dye Intermediates.',
  keywords: 'Vidhi Hexachem, chemical intermediates, dye intermediates, pigment intermediates, pharmaceutical intermediates, OPASA, NAPSA, PAABSA, Gujarat chemical manufacturer, dye manufacturer India',
  openGraph: {
    title: 'Vidhi Hexachem LLP | Chemical Intermediates Manufacturer',
    description: 'Manufacturer and exporter of 17 premium chemical intermediates for dye, pigment & pharmaceutical industries. Anand, Gujarat, India.',
    url: 'https://vidhihexachem.in',
    siteName: 'Vidhi Hexachem LLP',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
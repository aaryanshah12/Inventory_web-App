import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'Vidhi Hexa Chem | Vidhi Hexachem LLP | Chemical Intermediates Manufacturer Gujarat',
  description: 'Vidhi Hexa Chem (Vidhi Hexachem LLP) — leading manufacturer and exporter of 17 premium chemical intermediates for dye, pigment & pharmaceutical industries. Based in Anand, Gujarat, India. Custom Manufacturing · CDMO · Dye Intermediates · Zero Liquid Discharge plant.',
  keywords: 'Vidhi Hexa Chem, Vidhi Hexachem, Vidhi Hexachem LLP, chemical intermediates, dye intermediates, pigment intermediates, pharmaceutical intermediates, OPASA, NAPSA, PAABSA, Gujarat chemical manufacturer, dye manufacturer India, chemical manufacturer Anand Gujarat, sulphonic acid manufacturer, aromatic amine manufacturer, H-acid, J-acid, Gamma acid, zero liquid discharge chemical plant',
  alternates: {
    canonical: 'https://vidhihexachem.in',
  },
  openGraph: {
    title: 'Vidhi Hexa Chem | Vidhi Hexachem LLP | Chemical Intermediates Manufacturer',
    description: 'Vidhi Hexa Chem — manufacturer and exporter of 17 premium chemical intermediates for dye, pigment & pharmaceutical industries. Anand, Gujarat, India.',
    url: 'https://vidhihexachem.in',
    siteName: 'Vidhi Hexa Chem',
    type: 'website',
    images: [
      {
        url: 'https://vidhihexachem.in/image.png',
        width: 1200,
        height: 630,
        alt: 'Vidhi Hexa Chem Manufacturing Facility',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vidhi Hexa Chem | Chemical Intermediates Manufacturer',
    description: 'Manufacturer and exporter of 17 premium chemical intermediates. Anand, Gujarat, India.',
  },
  icons: {
    icon: '/image.png',
    apple: '/image.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vidhi Hexa Chem',
  alternateName: ['Vidhi Hexachem LLP', 'Vidhi Hexachem'],
  url: 'https://vidhihexachem.in',
  logo: 'https://vidhihexachem.in/vidhi-logo.png',
  description: 'Vidhi Hexa Chem is a manufacturer and exporter of chemical intermediates for dye, pigment and pharmaceutical industries based in Anand, Gujarat, India.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Anand',
    addressRegion: 'Gujarat',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    areaServed: 'Worldwide',
  },
  sameAs: [
    'https://vidhihexachem.in',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
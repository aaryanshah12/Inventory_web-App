import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const SITE_URL = "https://vidhihexachem.in";
const SITE_NAME = "Vidhi HexaChem LLP";

export const metadata: Metadata = {
  // ── Basic ────────────────────────────────────────────────────────────────
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Vidhi HexaChem LLP is a globally renowned manufacturer and exporter of premium chemical intermediates for the dye, pigment, and pharmaceutical industries.",
  keywords:
    "Vidhi Hexa Chem, Vidhi Hexachem, Vidhi HexaChem LLP, chemical intermediates, dye intermediates, pigment intermediates, pharmaceutical intermediates, OPASA, NAPSA, PAABSA, Gujarat chemical manufacturer, dye manufacturer India, chemical manufacturer Anand Gujarat, sulphonic acid manufacturer, aromatic amine manufacturer, H-acid, J-acid, Gamma acid, zero liquid discharge chemical plant",

  // ── Canonical ────────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Icons ────────────────────────────────────────────────────────────────
  // favicon.ico  → shown in browser tabs & classic search result snippets
  // favicon.png  → hi-res fallback (must be ≥48×48 px for Google to accept)
  // apple-touch-icon → iOS home-screen bookmark icon
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ── Open Graph (Facebook / WhatsApp / LinkedIn previews) ─────────────────
  // Use a 1200×630 banner image for best social-card rendering.
  // /og-banner.png should be a wide branded image (not just the logo).
  openGraph: {
    title: SITE_NAME,
    description:
      "Globally renowned manufacturer and exporter of premium chemical intermediates for dye, pigment & pharmaceutical industries.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-banner.png`, // 1200×630 branded banner
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – Chemical Intermediates Manufacturer`,
      },
    ],
  },

  // ── Twitter / X card ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Globally renowned manufacturer and exporter of premium chemical intermediates.",
    images: [`${SITE_URL}/og-banner.png`],
  },

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ── JSON-LD Structured Data ──────────────────────────────────────────────────
// Google uses the Organization "logo" ImageObject to display your brand logo
// next to your site name in Search.  Requirements:
//   • ContentUrl must be crawlable and indexable
//   • Image must be at least 112×112 px (square preferred)
//   • Google must be able to see the page that embeds this markup
const jsonLd = [
  // WebSite schema – enables Sitelinks Search Box if you add potentialAction
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
  },

  // Organization schema – this is what Google uses for the logo in search
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: "Vidhi HexaChem LLP",
    url: SITE_URL,
    // logo MUST be an ImageObject (not a plain string) for Google to use it
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: `${SITE_URL}/logo.png`,      // must be publicly accessible
      contentUrl: `${SITE_URL}/logo.png`,
      width: 512,                        // update to actual pixel width
      height: 512,                       // update to actual pixel height (square = best)
      caption: SITE_NAME,
    },
    image: {
      "@id": `${SITE_URL}/#logo`,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Anand",
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi", "Gujarati"],
    },
    // Add your actual social profile URLs below
    sameAs: [
      // "https://www.linkedin.com/company/vidhi-hexachem",
      // "https://www.facebook.com/vidhihexachem",
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Explicit favicon links (belt-and-suspenders alongside Next.js icons metadata) */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />

        {/* Structured data – injected as a single array so Google parses both nodes */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

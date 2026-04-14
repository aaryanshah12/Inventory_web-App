import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "Vidhi HexaChem LLP",
  description:
    "Vidhi HexaChem LLP delivers premium chemical intermediates for dye manufacturing industries worldwide.",
  keywords:
    "Vidhi Hexa Chem, Vidhi Hexachem, Vidhi HexaChem LLP, chemical intermediates, dye intermediates, pigment intermediates, pharmaceutical intermediates, OPASA, NAPSA, PAABSA, Gujarat chemical manufacturer, dye manufacturer India, chemical manufacturer Anand Gujarat, sulphonic acid manufacturer, aromatic amine manufacturer, H-acid, J-acid, Gamma acid, zero liquid discharge chemical plant",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://vidhihexachem.in",
  },
  openGraph: {
    title: "Vidhi HexaChem LLP",
    description:
      "Vidhi HexaChem LLP is a manufacturer and exporter of premium chemical intermediates.",
    url: "https://vidhihexachem.in",
    siteName: "Vidhi HexaChem LLP",
    type: "website",
    images: [
      {
        url: "https://vidhihexachem.in/logo.png",
        width: 159,
        height: 127,
        alt: "Vidhi HexaChem LLP Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vidhi HexaChem LLP",
    description:
      "Vidhi HexaChem LLP is a manufacturer and exporter of premium chemical intermediates.",
  },
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

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vidhi HexaChem LLP",
    url: "https://vidhihexachem.in",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vidhi HexaChem LLP",
    url: "https://vidhihexachem.in",
    logo: "https://vidhihexachem.in/logo.png",
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
        <meta name="title" content="Vidhi HexaChem LLP" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
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

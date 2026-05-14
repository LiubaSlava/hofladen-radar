import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

type SeoLocale = 'de' | 'en' | 'fr' | 'it' | 'uk'

const SEO_COPY: Record<
  SeoLocale,
  {
    htmlLang: string
    openGraphLocale: string
    title: string
    description: string
    keywords: string[]
  }
> = {
  de: {
    htmlLang: 'de',
    openGraphLocale: 'de_CH',
    title: 'Hofladen Radar — Hofläden und Bauernhöfe in deiner Nähe finden',
    description:
      'Interaktive Karte mit Hofläden, Bauernhöfen und Bauernmärkten in der Schweiz. Frische Produkte direkt vom Hof: Milch, Käse, Eier, Fleisch, Obst, Gemüse, Honig und Kräuter.',
    keywords: [
      'Hofladen Schweiz',
      'Hofläden in der Nähe',
      'Bauernhof Schweiz',
      'Direktvermarktung Schweiz',
      'Regionale Produkte',
      'Milch Käse Eier Hofladen',
    ],
  },
  en: {
    htmlLang: 'en',
    openGraphLocale: 'en_GB',
    title: 'Hofladen Radar — Find farm shops and farms near you',
    description:
      'Interactive map of farm shops, farms and farmers markets in Switzerland. Fresh products straight from the farm: milk, cheese, eggs, meat, fruit, vegetables, honey and herbs.',
    keywords: [
      'farm shop Switzerland',
      'farms near me',
      'Swiss farm shop',
      'regional products Switzerland',
      'milk cheese eggs farm shop',
    ],
  },
  fr: {
    htmlLang: 'fr',
    openGraphLocale: 'fr_CH',
    title: 'Hofladen Radar — Trouver des magasins à la ferme et des fermes près de chez vous',
    description:
      'Carte interactive des magasins à la ferme, fermes et marchés paysans en Suisse. Produits frais directement de la ferme: lait, fromage, oeufs, viande, fruits, légumes, miel et herbes.',
    keywords: [
      'magasin à la ferme Suisse',
      'fermes près de chez vous',
      'produits régionaux Suisse',
      'lait fromage oeufs ferme',
    ],
  },
  it: {
    htmlLang: 'it',
    openGraphLocale: 'it_CH',
    title: 'Hofladen Radar — Trova fattorie e negozi agricoli vicino a te',
    description:
      'Mappa interattiva di negozi agricoli, fattorie e mercati contadini in Svizzera. Prodotti freschi direttamente dalla fattoria: latte, formaggio, uova, carne, frutta, verdura, miele ed erbe.',
    keywords: [
      'negozio agricolo Svizzera',
      'fattorie vicino a me',
      'prodotti regionali Svizzera',
      'latte formaggio uova fattoria',
    ],
  },
  uk: {
    htmlLang: 'uk',
    openGraphLocale: 'uk_UA',
    title: 'Hofladen Radar — Знайдіть ферми та фермерські магазини поруч',
    description:
      "Інтерактивна карта фермерських магазинів, ферм і фермерських ринків у Швейцарії. Свіжі продукти прямо з ферми: молоко, сир, яйця, м'ясо, фрукти, овочі, мед і трави.",
    keywords: [
      'фермерський магазин Швейцарія',
      'ферми поруч',
      'регіональні продукти Швейцарія',
      'молоко сир яйця ферма',
    ],
  },
}

function detectSeoLocale(acceptLanguage: string | null): SeoLocale {
  if (!acceptLanguage) return 'de'
  const normalized = acceptLanguage.toLowerCase()
  if (normalized.includes('fr')) return 'fr'
  if (normalized.includes('it')) return 'it'
  if (normalized.includes('en')) return 'en'
  if (normalized.includes('uk')) return 'uk'
  return 'de'
}

async function getSeoLocale(): Promise<SeoLocale> {
  const requestHeaders = await headers()
  return detectSeoLocale(requestHeaders.get('accept-language'))
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getSeoLocale()
  const copy = SEO_COPY[locale]
  return {
    metadataBase: new URL('https://hofladenradar.ch'),
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    openGraph: {
      type: 'website',
      locale: copy.openGraphLocale,
      url: 'https://hofladenradar.ch',
      siteName: 'Hofladen Radar',
      title: copy.title,
      description: copy.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
    },
    generator: 'v0.app',
    icons: {
      icon: [
        {
          url: '/icon-light-32x32.png?v=2',
        },
        {
          url: '/icon-light-32x32.png?v=2',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: '/icon-dark-32x32.png?v=2',
          media: '(prefers-color-scheme: dark)',
        },
      ],
      shortcut: '/icon-light-32x32.png?v=2',
      apple: '/apple-icon.png?v=2',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getSeoLocale()
  return (
    <html
      lang={SEO_COPY[locale].htmlLang}
      className={`${inter.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

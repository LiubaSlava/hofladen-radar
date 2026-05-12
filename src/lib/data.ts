export type CategoryKey =
  | "milch"
  | "kaese"
  | "eier"
  | "fleisch"
  | "obst"
  | "honig"
  | "gemuese"
  | "kraeuter"

export interface Category {
  key: CategoryKey
  label: string
}

// Filterable categories shown in search / sidebar
export const CATEGORIES: Category[] = [
  { key: "milch", label: "Milch" },
  { key: "kaese", label: "Käse" },
  { key: "eier", label: "Eier" },
  { key: "fleisch", label: "Fleisch" },
  { key: "obst", label: "Obst" },
]

// Wider product list used inside the detail card tags
export const PRODUCT_LABELS: Record<CategoryKey, string> = {
  milch: "Milch",
  kaese: "Käse",
  eier: "Eier",
  fleisch: "Fleisch",
  obst: "Obst",
  honig: "Honig",
  gemuese: "Gemüse",
  kraeuter: "Kräuter",
}

export interface FarmFeatures {
  shop: boolean
  parking: boolean
  restaurant: boolean
  playground: boolean
}

export interface Review {
  author: string
  rating: number
  text: string
  date: string
}

/** Werte der Supabase-Spalte `category`: Standort-Typ. */
export type VenueKind = "farm" | "shop" | "attraction"

/** Lokaler Radar-Filter: alle Standorte, nur Höfe, nur Läden. */
export type VenueFilter = "all" | "farm" | "shop"

export interface Farm {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  /** Aus DB-Spalte `category`: `farm` | `shop` | `attraction`. */
  category: VenueKind
  distanceKm: number
  rating: number
  reviewCount: number
  openNow: boolean
  status: "active" | "inactive"
  categories: CategoryKey[] // primary filter categories
  products: CategoryKey[] // broader list shown as tags inside the detail card
  hours: string
  image: string
  bio: boolean
  features: FarmFeatures
  seasonal: string[]
  description: string
  reviews: Review[]
  attractionIds: string[]
  // Backend mirror fields to keep admin form stable after save/reopen.
  image_url?: string
  website_url?: string
  ai_message_de?: string
  ai_message_en?: string
  ai_message_fr?: string
  ai_message_it?: string
  ai_message_sr?: string
  ai_message_ua?: string
  ai_summary_content?: string
  ai_summary_de?: string
  ai_summary_en?: string
  ai_summary_fr?: string
  ai_summary_it?: string
  ai_summary_sr?: string
  ai_summary_ua?: string
  has_shop?: boolean
  has_parking?: boolean
  has_restaurant?: boolean
  has_accommodation?: boolean
  has_playground?: boolean
  has_quiz?: boolean
  has_delivery?: boolean
  is_open?: boolean
  contact_info?: Record<string, unknown> | null
  opening_hours?: Record<string, unknown> | string | null
}

export interface Attraction {
  id: string
  name: string
  image: string
  walkMinutes: number
  unesco?: boolean
  description: string
  lat: number
  lng: number
  city: string
}

export const ATTRACTIONS: Attraction[] = [
  {
    id: "a1",
    name: "Stiftsbibliothek St. Gallen",
    image: "/placeholder.svg?height=400&width=600",
    walkMinutes: 2,
    unesco: true,
    description:
      "Die barocke Stiftsbibliothek gehört zu den ältesten und schönsten Klosterbibliotheken der Welt.",
    lat: 47.4239,
    lng: 9.3767,
    city: "St. Gallen",
  },
  {
    id: "a2",
    name: "Schloss Charlottenburg",
    image: "/placeholder.svg?height=400&width=600",
    walkMinutes: 6,
    description:
      "Größtes erhaltenes Schloss Berlins mit weitläufigem Barockgarten — ideal für einen Spaziergang.",
    lat: 52.5208,
    lng: 13.2956,
    city: "Berlin",
  },
  {
    id: "a3",
    name: "Naturpark Schönfeld",
    image: "/placeholder.svg?height=400&width=600",
    walkMinutes: 8,
    description: "Idyllischer Naturpark mit Wanderwegen und Aussichtspunkten — direkt am Hofladen.",
    lat: 52.54,
    lng: 13.41,
    city: "Berlin",
  },
]

export const FARMS: Farm[] = [
  {
    id: "f1",
    name: "Alpen-Paradies Hof",
    address: "Hauptstraße 12, 13407 Berlin",
    lat: 52.52,
    lng: 13.405,
    category: "farm",
    distanceKm: 3.7,
    rating: 5.0,
    reviewCount: 128,
    openNow: true,
    status: "active",
    categories: ["milch", "kaese", "eier"],
    products: ["kaese", "honig", "fleisch", "gemuese", "milch"],
    hours: "Mo–Fr 8–18, Sa 8–14",
    image: "/placeholder.svg?height=400&width=600",
    bio: true,
    features: { shop: true, parking: true, restaurant: true, playground: true },
    seasonal: ["Spargel", "Erdbeeren", "Rhabarber", "Salat"],
    description:
      "Dieser Hofladen bietet regionale Produkte direkt vom Erzeuger. Seit drei Generationen pflegen wir traditionelle Landwirtschaft mit Liebe zum Detail. Frische Milch, hausgemachter Käse und saisonales Gemüse — alles aus eigener Herstellung.",
    reviews: [
      {
        author: "Anna M.",
        rating: 5,
        text: "Wunderschöner Hof, freundliches Personal und absolut frische Produkte. Der Käse ist ein Traum!",
        date: "vor 3 Tagen",
      },
      {
        author: "Markus K.",
        rating: 5,
        text: "Toller Spielplatz für die Kinder, dazu ein gemütliches Café. Wir kommen wieder!",
        date: "vor 1 Woche",
      },
    ],
    attractionIds: ["a1", "a2"],
  },
  {
    id: "f2",
    name: "Grünfeld Hofladen",
    address: "Feldweg 8, 13409 Berlin",
    lat: 52.515,
    lng: 13.42,
    category: "farm",
    distanceKm: 2.4,
    rating: 4.9,
    reviewCount: 87,
    openNow: true,
    status: "active",
    categories: ["obst", "eier", "gemuese"],
    products: ["obst", "gemuese", "eier", "honig", "kraeuter"],
    hours: "Mo–Sa 9–19",
    image: "/placeholder.svg?height=400&width=600",
    bio: true,
    features: { shop: true, parking: true, restaurant: false, playground: false },
    seasonal: ["Erdbeeren", "Kirschen", "Salat"],
    description:
      "Bio-zertifizierter Hofladen mit Schwerpunkt auf saisonalem Obst und Gemüse. Direkt vom Feld in den Korb.",
    reviews: [
      {
        author: "Lisa R.",
        rating: 5,
        text: "Beste Erdbeeren der Region. Klare Empfehlung!",
        date: "vor 2 Tagen",
      },
    ],
    attractionIds: ["a3"],
  },
  {
    id: "f3",
    name: "Schmidt Bauernhof",
    address: "Bauernhof 5, 13503 Berlin",
    lat: 52.53,
    lng: 13.39,
    category: "farm",
    distanceKm: 3.1,
    rating: 4.7,
    reviewCount: 54,
    openNow: false,
    status: "active",
    categories: ["fleisch", "eier"],
    products: ["fleisch", "eier", "milch", "kaese"],
    hours: "Di–Sa 10–17",
    image: "/placeholder.svg?height=400&width=600",
    bio: false,
    features: { shop: true, parking: true, restaurant: false, playground: false },
    seasonal: ["Wild", "Pilze"],
    description:
      "Traditioneller Bauernhof mit eigener Schlachterei. Hochwertige Wurstwaren und Fleisch aus artgerechter Haltung.",
    reviews: [
      {
        author: "Thomas B.",
        rating: 5,
        text: "Top Qualität, faire Preise. Die Bratwurst ist legendär.",
        date: "vor 5 Tagen",
      },
    ],
    attractionIds: ["a2"],
  },
  {
    id: "f4",
    name: "Bio Sonnenschein",
    address: "Sonnenweg 22, 13125 Berlin",
    lat: 52.505,
    lng: 13.38,
    category: "shop",
    distanceKm: 3.8,
    rating: 4.6,
    reviewCount: 42,
    openNow: true,
    status: "active",
    categories: ["milch", "obst", "eier", "kaese"],
    products: ["milch", "obst", "eier", "kaese", "gemuese", "honig"],
    hours: "Mo–Fr 7–19, Sa 8–16",
    image: "/placeholder.svg?height=400&width=600",
    bio: true,
    features: { shop: true, parking: true, restaurant: true, playground: false },
    seasonal: ["Spargel", "Rhabarber", "Salat"],
    description:
      "Vielfältiger Bio-Hofladen mit eigenem Café. Über 200 hauseigene und regionale Produkte.",
    reviews: [
      {
        author: "Sabine W.",
        rating: 4,
        text: "Schöne Auswahl, gemütliches Café. Etwas teurer, aber gerechtfertigt.",
        date: "vor 1 Woche",
      },
    ],
    attractionIds: ["a3"],
  },
  {
    id: "f5",
    name: "Alpenhof",
    address: "Bergstraße 15, 13088 Berlin",
    lat: 52.54,
    lng: 13.43,
    category: "farm",
    distanceKm: 4.2,
    rating: 4.5,
    reviewCount: 31,
    openNow: true,
    status: "inactive",
    categories: ["milch", "fleisch", "kaese"],
    products: ["milch", "kaese", "fleisch", "honig"],
    hours: "Mo–Sa 9–18",
    image: "/placeholder.svg?height=400&width=600",
    bio: false,
    features: { shop: true, parking: true, restaurant: false, playground: false },
    seasonal: ["Wild"],
    description: "Alpiner Hof mit Spezialitäten aus der Region. Bekannt für seinen Bergkäse.",
    reviews: [],
    attractionIds: [],
  },
  {
    id: "f6",
    name: "Obstgarten Krause",
    address: "Obstgarten 3, 13189 Berlin",
    lat: 52.495,
    lng: 13.415,
    category: "shop",
    distanceKm: 4.8,
    rating: 4.9,
    reviewCount: 95,
    openNow: false,
    status: "active",
    categories: ["obst"],
    products: ["obst", "honig", "kraeuter"],
    hours: "Mo–Fr 9–18",
    image: "/placeholder.svg?height=400&width=600",
    bio: true,
    features: { shop: true, parking: true, restaurant: false, playground: true },
    seasonal: ["Kirschen", "Pflaumen", "Äpfel"],
    description:
      "Traditioneller Obstgarten mit über 40 Apfelsorten. Im Herbst öffnen wir zum Selbstpflücken.",
    reviews: [
      {
        author: "Karin H.",
        rating: 5,
        text: "Selbstpflücken war ein Riesen-Spaß für die ganze Familie!",
        date: "vor 2 Wochen",
      },
    ],
    attractionIds: ["a1"],
  },
]

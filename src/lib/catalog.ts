// Catalogue et grille tarifaire, repris du site vitrine (src/content/defaults.ts et src/content/pricing.ts).
// - Compte individuel : forfait mensuel par logiciel Pro, sans places.
// - Organisation : places × prix de la place, avec remise de volume selon le nombre de places.

export type Product = {
  slug: string
  name: string
  icon: string
  color: string
  tagline: string
  description: string
  /** Fonctions des versions Standard (gratuite) et Pro. */
  free: string[]
  pro: string[]
  /** Prix Pro pour un compte individuel, par mois. */
  price: number
  /** Prix d'une place pour une organisation, par mois, avant remise. */
  seatPrice: number
}

export const PRODUCTS: Product[] = [
  {
    slug: 'cerise', name: 'Cerise', icon: 'cerise', color: '#e63950',
    tagline: 'La modélisation Merise, enfin simple.',
    description: 'Du MCD au script SQL en quelques clics, directement dans le navigateur.',
    free: ['3 projets', 'MCD, MLD, MPD et SQL', 'Export PNG'],
    pro: ['Projets illimités', 'Dictionnaire de données et DF', 'Exports PDF et SQL', 'Collaboration en direct'],
    price: 3.98, seatPrice: 1.99,
  },
  {
    slug: 'myrtille', name: 'Myrtille', icon: 'myrtille', color: '#4f5bd5',
    tagline: 'Le SQL pas à pas.',
    description: 'Des requêtes corrigées en direct sur de vraies bases d’exemple.',
    free: ['Bases d’exemple', '50 requêtes corrigées par mois'],
    pro: ['Requêtes illimitées', 'Vos propres bases', 'Sujets à distribuer'],
    price: 2.98, seatPrice: 1.49,
  },
  {
    slug: 'citron', name: 'Citron', icon: 'citron', color: '#d4a20b',
    tagline: 'L’algorithmique sans installation.',
    description: 'Écrire un algorithme en pseudo-code, l’exécuter et suivre ses variables.',
    free: ['Éditeur de pseudo-code', 'Exécution pas à pas'],
    pro: ['Traduction en Python', 'Exercices corrigés', 'Historique des exécutions'],
    price: 1.98, seatPrice: 0.99,
  },
  {
    slug: 'kiwi', name: 'Kiwi', icon: 'kiwi', color: '#5f9e1f',
    tagline: 'Les schémas réseau, au propre.',
    description: 'Dessiner une topologie et vérifier son plan d’adressage.',
    free: ['5 schémas', 'Équipements de base'],
    pro: ['Schémas illimités', 'Vérification du plan d’adressage', 'Export Packet Tracer'],
    price: 2.98, seatPrice: 1.49,
  },
  {
    slug: 'figue', name: 'Figue', icon: 'figue', color: '#7c4dcc',
    tagline: 'Le suivi de la classe.',
    description: 'Rendus, corrections et notes de chaque étudiant, au même endroit.',
    free: ['1 classe', 'Dépôt des rendus'],
    pro: ['Classes illimitées', 'Grilles de correction', 'Export des notes'],
    price: 4.98, seatPrice: 2.49,
  },
  {
    slug: 'mangue', name: 'Mangue', icon: 'mangue', color: '#f2711c',
    tagline: 'Réviser avant l’examen.',
    description: 'Des quiz et des exercices corrigés pour s’entraîner toute l’année.',
    free: ['Quiz publics', '10 révisions par semaine'],
    pro: ['Révisions illimitées', 'Quiz sur vos cours', 'Suivi des progrès'],
    price: 1.98, seatPrice: 0.99,
  },
]

export const productBySlug = (slug: string) => PRODUCTS.find((product) => product.slug === slug)

/** Remise selon le nombre de places prises sur un logiciel. */
export const SEAT_TIERS = [
  { from: 1, discount: 0, label: '1 à 9 places' },
  { from: 10, discount: 0.15, label: '10 à 49' },
  { from: 50, discount: 0.3, label: '50 à 199' },
  { from: 200, discount: 0.4, label: '200 et plus' },
] as const

/** Payer à l'année : deux mois offerts. */
export const ANNUAL_MONTHS = 10
export const MIN_ORG_SEATS = 2
export const MAX_SEATS = 1000

/** Pack Multifruit : tous les logiciels. Prix rond pour un compte individuel, −30 % pour une organisation. */
export const BUNDLE_PRICE = 12.99
export const BUNDLE_DISCOUNT = 0.3

export function tierFor(seats: number) {
  return [...SEAT_TIERS].reverse().find((tier) => seats >= tier.from) ?? SEAT_TIERS[0]
}

export function seatPriceFor(slug: string, seats: number) {
  const product = productBySlug(slug)
  return product ? product.seatPrice * (1 - tierFor(seats).discount) : 0
}

/** Prix mensuel d'un logiciel Pro : forfait (individuel) ou places × prix de la place (organisation). */
export function appMonthly(slug: string, team: boolean, seats: number) {
  const product = productBySlug(slug)
  if (!product) return 0
  return team ? seatPriceFor(slug, seats) * seats : product.price
}

export type Billing = 'monthly' | 'annual'

/** Montant facturé à chaque échéance. */
export const periodAmount = (monthly: number, billing: Billing) => (billing === 'annual' ? monthly * ANNUAL_MONTHS : monthly)

export const clampSeats = (value: number) =>
  Math.min(MAX_SEATS, Math.max(MIN_ORG_SEATS, Math.round(Number.isFinite(value) ? value : MIN_ORG_SEATS)))

export const ORG_TYPES = ['Lycée', 'Université', 'École d’ingénieurs', 'IUT', 'Centre de formation', 'Entreprise', 'Association'] as const

export const ROLES = {
  admin: { label: 'Administrateur', short: 'Admin', text: 'Gère l’abonnement, les places et les membres.' },
  teacher: { label: 'Enseignant', short: 'Enseignant', text: 'Crée des classes et distribue des sujets.' },
  student: { label: 'Élève', short: 'Élève', text: 'Utilise les logiciels qui lui sont attribués.' },
} as const

export type Role = keyof typeof ROLES

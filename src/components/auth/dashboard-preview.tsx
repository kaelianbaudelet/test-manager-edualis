import { ArrowRight, Bell, Building2, ChevronDown, ChevronsUpDown, CircleHelp, CreditCard, Home, LayoutGrid, Search, Settings, ShoppingBag, Users } from 'lucide-react'

import { AppIcon } from '@/components/app-icon'
import { Avatar, WorkspaceBadge } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SeatBar } from '@/components/ui/progress'
import { appMonthly, PRODUCTS } from '@/lib/catalog'
import { cn, formatEuro } from '@/lib/utils'

// Capture « vivante » du manager, dessinée en HTML à la taille réelle d'un écran d'iPad (1180 × 887).
// Mêmes composants et mêmes jetons que l'app (page « Logiciels et places » d'un établissement), toujours en clair.
// Seul le coin haut gauche est visible dans le panneau des pages de connexion : barre latérale et première rangée.
const SUBSCRIPTIONS = [
  { slug: 'cerise', used: 43, seats: 60 },
  { slug: 'myrtille', used: 29, seats: 30 },
  { slug: 'figue', used: 5, seats: 10 },
]

const NAV = [
  { label: 'Accueil', icon: Home },
  { label: 'Logiciels et places', icon: LayoutGrid, active: true },
  { label: 'Membres', icon: Users },
  { label: 'Souscrire', icon: ShoppingBag },
  { label: 'Facturation', icon: CreditCard },
  { label: 'Organisation', icon: Building2 },
]

const row = 'flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[0.9rem] text-fg/65'
const activeRow = 'bg-card font-medium text-fg shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)]'

export function DashboardPreview() {
  return (
    <div className="theme-light flex h-full w-full bg-bg font-sans text-fg" style={{ fontSize: 15, lineHeight: 1.6 }}>
      {/* Barre latérale */}
      <div className="flex w-64 shrink-0 flex-col px-3 pt-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-xl p-1.5">
          <WorkspaceBadge name="Lycée Jean-Moulin" color="#0e7490" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.88rem] leading-tight font-semibold">Lycée Jean-Moulin</span>
            <span className="block truncate text-[0.75rem] leading-tight text-muted">Propriétaire</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" />
        </div>
        <div className="mt-5 space-y-0.5">
          {NAV.map((item) => (
            <div key={item.label} className={cn(row, item.active && activeRow)}>
              <item.icon className={cn('size-[1.05rem] shrink-0 text-muted/90', item.active && 'text-accent')} strokeWidth={1.9} />
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="px-2.5 pb-1.5 text-[0.72rem] font-medium text-muted/80">Logiciels</p>
          <div className="space-y-0.5">
            {SUBSCRIPTIONS.map((sub) => {
              const product = PRODUCTS.find((item) => item.slug === sub.slug)!
              return (
                <div key={sub.slug} className={row}>
                  <span className="size-[1.15rem] shrink-0">
                    <AppIcon product={product} />
                  </span>
                  {product.name}
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-auto space-y-0.5">
          <div className={row}>
            <CircleHelp className="size-[1.05rem] text-muted/90" strokeWidth={1.9} /> Aide
          </div>
          <div className={row}>
            <Settings className="size-[1.05rem] text-muted/90" strokeWidth={1.9} /> Paramètres
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1 px-8">
        <div className="flex h-16 items-center gap-1">
          <div className="ml-auto flex h-10 w-72 items-center gap-2.5 rounded-full bg-card px-4 text-[0.88rem] text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-line ring-inset">
            <Search className="size-4" /> Rechercher…
            <kbd className="ml-auto rounded-md bg-fg/[0.06] px-1.5 py-0.5 font-sans text-[0.7rem] text-muted">⌘K</kbd>
          </div>
          <span className="relative ml-2 grid size-10 place-items-center text-fg/70">
            <Bell className="size-[1.15rem]" />
            <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#e63950] ring-2 ring-bg" />
          </span>
          <span className="mx-1.5 h-6 w-px bg-line" />
          <span className="flex items-center gap-2 p-1 pr-2.5">
            <Avatar name="Camille Martin" className="size-8 ring-2 ring-bg" />
            <span className="text-[0.85rem] font-medium">Camille</span>
            <ChevronDown className="size-3.5 text-muted" />
          </span>
        </div>

        <div className="pt-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="title-lg">Logiciels et places</h1>
              <p className="mt-1.5 text-[0.95rem] text-muted">Chaque logiciel a son propre nombre de places.</p>
            </div>
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[0.9rem] font-medium text-accent-fg">+ Ajouter un logiciel</span>
          </div>

          <p className="mb-3 font-semibold">Abonnements de l’organisation</p>
          <div className="grid grid-cols-3 gap-4">
            {SUBSCRIPTIONS.map((sub) => {
              const product = PRODUCTS.find((item) => item.slug === sub.slug)!
              const free = sub.seats - sub.used
              return (
                <div key={sub.slug} className="bento flex flex-col">
                  <div className="flex items-start gap-3.5 p-5">
                    <span className="size-12 shrink-0">
                      <AppIcon product={product} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{product.name}</p>
                        <Badge tone="accent">Pro</Badge>
                      </div>
                      <p className="text-[0.82rem] text-muted">Annuel</p>
                    </div>
                    <p className="shrink-0 text-right text-[1.05rem] leading-tight font-semibold whitespace-nowrap tabular-nums">
                      {formatEuro(appMonthly(sub.slug, true, sub.seats))}
                      <span className="block text-[0.75rem] font-normal text-muted">par mois</span>
                    </p>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[0.88rem] tabular-nums">
                        <span className="text-[1.35rem] font-semibold tracking-[-0.02em]">{sub.used}</span>
                        <span className="text-muted"> / {sub.seats} places</span>
                      </p>
                      <p className={cn('text-[0.8rem] font-medium', free / sub.seats <= 0.1 ? 'text-warning' : 'text-muted')}>
                        {free} libre{free > 1 ? 's' : ''}
                      </p>
                    </div>
                    <SeatBar used={sub.used} total={sub.seats} className="mt-2" />
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-[0.82rem]">
                    <span className="truncate text-muted">Renouvelé le 1 sept. 2027</span>
                    <span className="flex shrink-0 items-center gap-1 font-medium">
                      Gérer <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

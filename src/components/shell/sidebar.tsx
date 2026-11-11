'use client'

import { ArrowUpRight, CircleHelp, Settings, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { AppIcon } from '@/components/app-icon'
import { useToast } from '@/components/ui/toast'
import { productBySlug } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

import { navFor } from './nav'
import { WorkspaceSwitcher } from './workspace-switcher'

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

// Ligne de navigation : discrète au repos, « carte » blanche à ombre douce quand elle est active (style Linear / Notion).
const row = 'group flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-[0.9rem] text-fg/65 transition-colors hover:bg-fg/[0.04] hover:text-fg'
const activeRow = 'bg-card font-medium text-fg shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)] hover:bg-card'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const toast = useToast()
  const { isOrg, canManage, myApps } = useStore()
  const items = navFor({ isOrg, canManage })
  const settingsActive = isActive(pathname, '/profil')

  return (
    <div className="flex h-full flex-col px-3 pt-3 pb-4">
      <WorkspaceSwitcher onNavigate={onNavigate} />

      <nav aria-label="Navigation principale" className="-mx-3 mt-5 flex-1 overflow-y-auto px-3 py-1">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn(row, active && activeRow)}>
                  <item.icon className={cn('size-[1.05rem] shrink-0 text-muted/90 transition-colors group-hover:text-fg', active && 'text-accent group-hover:text-accent')} strokeWidth={1.9} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {myApps.length > 0 && (
          <div className="mt-8">
            <p className="px-2.5 pb-1.5 text-[0.72rem] font-medium text-muted/80">Logiciels</p>
            <ul className="space-y-0.5">
              {myApps.map((slug) => {
                const product = productBySlug(slug)
                if (!product) return null
                return (
                  <li key={slug}>
                    <button type="button" onClick={() => toast(`Ouverture de ${product.name}…`, { tone: 'info', text: 'Le logiciel s’ouvre dans un nouvel onglet.' })} className={row}>
                      <span className="size-[1.15rem] shrink-0">
                        <AppIcon product={product} />
                      </span>
                      {product.name}
                      <ArrowUpRight className="ml-auto size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      <ul className="space-y-0.5 pt-4">
        <li>
          <button type="button" onClick={() => toast('Centre d’aide', { tone: 'info', text: 'Lien vers edualis.fr/help.' })} className={row}>
            <CircleHelp className="size-[1.05rem] shrink-0 text-muted/90 group-hover:text-fg" strokeWidth={1.9} />
            Aide
          </button>
        </li>
        <li>
          <Link href="/profil" onClick={onNavigate} aria-current={settingsActive ? 'page' : undefined} className={cn(row, settingsActive && activeRow)}>
            <Settings className={cn('size-[1.05rem] shrink-0 text-muted/90 group-hover:text-fg', settingsActive && 'text-accent group-hover:text-accent')} strokeWidth={1.9} />
            Paramètres
          </Link>
        </li>
      </ul>
    </div>
  )
}

/** Barre latérale épurée : fondue dans le fond de page, sans carte ni logo. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
      <SidebarContent />
    </aside>
  )
}

/** Tiroir de navigation sur mobile (même contenu). */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/30" />
        <DialogPrimitive.Content className="sheet-content fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] bg-bg pt-10 shadow-2xl outline-none">
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Navigation du manager Edualis</DialogPrimitive.Description>
          <DialogPrimitive.Close aria-label="Fermer le menu" className="absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full hover:bg-fg/6">
            <X className="size-4" />
          </DialogPrimitive.Close>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

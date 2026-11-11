'use client'

import { ArrowRight, ArrowUpRight, Check, Plus } from 'lucide-react'
import Link from 'next/link'

import { AppIcon } from '@/components/app-icon'
import { PageHeader, SectionTitle } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SeatBar } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { appMonthly, PRODUCTS, productBySlug } from '@/lib/catalog'
import { seatsUsed, useStore } from '@/lib/store'
import { cn, formatDateShort, formatEuro, plural } from '@/lib/utils'

export default function SoftwarePage() {
  const { workspace, isOrg, canManage, myApps } = useStore()
  const toast = useToast()
  const owned = workspace.subscriptions
  const others = PRODUCTS.filter((product) => !owned.some((sub) => sub.slug === product.slug))
  const open = (name: string) => toast(`Ouverture de ${name}…`, { tone: 'info' })

  if (isOrg && !canManage)
    return (
      <>
        <PageHeader title="Mes logiciels" description={`Attribués par ${workspace.name}.`} />
        <div className="grid gap-3 sm:grid-cols-2">
          {myApps.map((slug) => {
            const product = productBySlug(slug)!
            return (
              <Card key={slug} className="flex items-center gap-4 p-5">
                <span className="size-12 shrink-0">
                  <AppIcon product={product} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="truncate text-[0.85rem] text-muted">{product.description}</p>
                </div>
                <Button variant="secondary" onClick={() => open(product.name)}>
                  Ouvrir <ArrowUpRight />
                </Button>
              </Card>
            )
          })}
        </div>
      </>
    )

  return (
    <>
      <PageHeader
        title={isOrg ? 'Logiciels et places' : 'Mes logiciels'}
        description={isOrg ? 'Chaque logiciel a son propre nombre de places. Attribuez-les aux membres qui en ont besoin.' : 'Chaque logiciel existe en version gratuite. Passez en Pro seulement ceux dont vous avez besoin.'}
        actions={
          <ButtonLink href="/souscrire" variant="accent">
            <Plus /> Ajouter un logiciel
          </ButtonLink>
        }
      />

      <SectionTitle>{isOrg ? 'Abonnements de l’organisation' : 'En Pro'}</SectionTitle>
      {owned.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((sub) => {
            const product = productBySlug(sub.slug)!
            const used = seatsUsed(workspace, sub.slug)
            const free = Math.max(0, sub.seats - used)
            const monthly = appMonthly(sub.slug, isOrg, sub.seats)
            return (
              <Link key={sub.slug} href={`/logiciels/${sub.slug}`} className="bento group flex flex-col transition-shadow hover:shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow)]">
                <div className="flex items-start gap-3.5 p-5">
                  <span className="size-12 shrink-0">
                    <AppIcon product={product} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{product.name}</p>
                      <Badge tone="accent">Pro</Badge>
                    </div>
                    <p className="text-[0.82rem] text-muted">{sub.billing === 'annual' ? 'Annuel' : 'Mensuel'}</p>
                  </div>
                  <p className="shrink-0 text-right text-[1.05rem] leading-tight font-semibold whitespace-nowrap tabular-nums">
                    {formatEuro(monthly)}
                    <span className="block text-[0.75rem] font-normal text-muted">par mois</span>
                  </p>
                </div>

                {isOrg ? (
                  <div className="px-5 pb-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[0.88rem] tabular-nums">
                        <span className="text-[1.35rem] font-semibold tracking-[-0.02em]">{used}</span>
                        <span className="text-muted"> / {sub.seats} places</span>
                      </p>
                      <p className={cn('text-[0.8rem] font-medium', free === 0 ? 'text-danger' : free / sub.seats <= 0.1 ? 'text-warning' : 'text-muted')}>{free === 0 ? 'Complet' : plural(free, 'libre')}</p>
                    </div>
                    <SeatBar used={used} total={sub.seats} className="mt-2" />
                  </div>
                ) : (
                  <p className="line-clamp-2 px-5 pb-5 text-[0.85rem] text-muted">{product.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-[0.82rem]">
                  <span className="truncate text-muted">Renouvelé le {formatDateShort(sub.renews)} {new Date(sub.renews).getFullYear()}</span>
                  <span className="flex shrink-0 items-center gap-1 font-medium">
                    Gérer <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="p-6 text-[0.9rem] text-muted">Aucun logiciel en Pro pour l’instant. Commencez par en choisir un ci-dessous.</Card>
      )}

      <SectionTitle className="mt-10">{isOrg ? 'Ajouter à l’organisation' : 'Version gratuite'}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((product) => (
          <Card key={product.slug} className="flex flex-col p-5">
            <div className="flex items-center gap-3">
              <span className="size-10 shrink-0">
                <AppIcon product={product} />
              </span>
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-[0.8rem] text-muted">{isOrg ? `dès ${formatEuro(product.seatPrice)} la place/mois` : `Pro à ${formatEuro(product.price)}/mois`}</p>
              </div>
            </div>
            <p className="mt-3 text-[0.85rem] text-muted">{product.description}</p>
            <ul className="mt-3 space-y-1 text-[0.82rem]">
              {product.pro.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" /> {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-2 pt-4">
              {!isOrg && (
                <Button variant="secondary" onClick={() => open(product.name)}>
                  Ouvrir
                </Button>
              )}
              <ButtonLink href={`/souscrire?app=${product.slug}`} variant={isOrg ? 'secondary' : 'ghost'} className={isOrg ? '' : 'text-accent'}>
                {isOrg ? 'Ajouter' : 'Passer en Pro'}
              </ButtonLink>
            </div>
          </Card>
        ))}
        {others.length === 0 && <p className="text-[0.9rem] text-muted">Vous avez déjà tous les logiciels Edualis. Bravo.</p>}
      </div>
    </>
  )
}

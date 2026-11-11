'use client'

import { ArrowRight, Check, CreditCard, FileText, Landmark, Loader2, Lock, PartyPopper, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SeatStepper } from '@/components/ui/seat-stepper'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'
import { ANNUAL_MONTHS, appMonthly, BUNDLE_DISCOUNT, BUNDLE_PRICE, PRODUCTS, productBySlug, seatPriceFor, tierFor, type Billing } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { cn, formatEuro } from '@/lib/utils'

export default function SubscribePage() {
  return (
    <Suspense>
      <Configurator />
    </Suspense>
  )
}

type Pay = 'card' | 'sepa' | 'order'

function Step({ n, title, text, children }: { n: number; title: string; text?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg text-[0.8rem] font-semibold text-bg">{n}</span>
        <div>
          <h2 className="font-sans text-[1.02rem] font-semibold tracking-normal">{title}</h2>
          {text && <p className="text-[0.85rem] text-muted">{text}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Configurator() {
  const params = useSearchParams()
  const { workspace, isOrg, subscribe } = useStore()
  const toast = useToast()
  const team = isOrg
  const ownedSlugs = workspace.subscriptions.map((sub) => sub.slug)
  const preset = params.get('app')
  const [selected, setSelected] = useState<string[]>(() => (preset && !ownedSlugs.includes(preset) ? [preset] : []))
  const [seats, setSeats] = useState<Record<string, number>>({})
  const [billing, setBilling] = useState<Billing>(team ? 'annual' : 'monthly')
  const [pay, setPay] = useState<Pay>(team ? 'order' : 'card')
  const [status, setStatus] = useState<'idle' | 'pending' | 'done'>('idle')
  const [done, setDone] = useState<string[]>([])

  const defaultSeats = Math.max(10, workspace.members.length)
  const seatsOf = (slug: string) => seats[slug] ?? defaultSeats
  const toggle = (slug: string) => setSelected((prev) => (prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]))

  // Pack Multifruit : tous les logiciels (ceux déjà pris compris), prix rond en individuel, −30 % en organisation.
  const allTaken = PRODUCTS.every((product) => selected.includes(product.slug) || ownedSlugs.includes(product.slug))
  const bundle = allTaken && ownedSlugs.length === 0
  const lines = selected.map((slug) => ({ slug, seats: seatsOf(slug), monthly: appMonthly(slug, team, seatsOf(slug)) }))
  const full = lines.reduce((sum, line) => sum + line.monthly, 0)
  const monthly = bundle ? (team ? full * (1 - BUNDLE_DISCOUNT) : BUNDLE_PRICE) : full
  const period = billing === 'annual' ? monthly * ANNUAL_MONTHS : monthly
  const saved = (billing === 'annual' ? monthly * 2 : 0) + (bundle ? (full - monthly) * (billing === 'annual' ? ANNUAL_MONTHS : 1) : 0)

  const confirm = () => {
    setStatus('pending')
    window.setTimeout(() => {
      subscribe(
        lines.map(({ slug, seats }) => ({ slug, seats })),
        billing,
        period,
      )
      setDone(selected)
      setStatus('done')
      toast(pay === 'order' ? 'Commande enregistrée' : 'Paiement accepté', { text: pay === 'order' ? 'Le devis et le bon de commande sont dans Facturation.' : 'La facture est disponible dans Facturation.' })
    }, 1200)
  }

  if (status === 'done') return <Success slugs={done} team={team} order={pay === 'order'} />

  return (
    <>
      <PageHeader title="Souscrire" description={team ? `Composez l’offre de ${workspace.name} : choisissez les logiciels, puis le nombre de places pour chacun.` : 'Choisissez les logiciels à passer en Pro. Sans engagement, résiliable à tout moment.'} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10">
          <Step n={1} title="Logiciels" text={team ? 'Chaque logiciel a ses propres places.' : `Prenez les ${PRODUCTS.length} logiciels : pack Multifruit à ${formatEuro(BUNDLE_PRICE)}/mois.`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRODUCTS.map((product) => {
                const owned = ownedSlugs.includes(product.slug)
                const on = selected.includes(product.slug)
                return (
                  <button
                    key={product.slug}
                    type="button"
                    disabled={owned}
                    aria-pressed={on}
                    onClick={() => toggle(product.slug)}
                    className={cn(
                      'bento flex items-start gap-3 p-4 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-55',
                      on ? 'shadow-[inset_0_0_0_2px_var(--accent),var(--shadow)]!' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow)]',
                    )}
                  >
                    <span className="size-10 shrink-0">
                      <AppIcon product={product} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">{product.name}</span>
                        {owned && <Badge tone="success">Déjà actif</Badge>}
                      </span>
                      <span className="mt-0.5 block text-[0.82rem] text-muted">{product.tagline}</span>
                      <span className="mt-2 block text-[0.82rem] font-medium tabular-nums">{team ? `dès ${formatEuro(product.seatPrice * 0.6)} la place` : `${formatEuro(product.price)}/mois`}</span>
                    </span>
                    <span className={cn('grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-line-strong transition-colors ring-inset', on && 'bg-accent text-accent-fg ring-accent')}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                  </button>
                )
              })}
            </div>
            {!team && !allTaken && ownedSlugs.length === 0 && selected.length >= 3 && (
              <button
                type="button"
                onClick={() => setSelected(PRODUCTS.filter((product) => !ownedSlugs.includes(product.slug)).map((product) => product.slug))}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-accent-soft/60 px-4 py-3 text-left text-[0.88rem] transition-colors hover:bg-accent-soft"
              >
                <Sparkles className="size-4 shrink-0 text-accent" />
                <span className="flex-1">Pour {formatEuro(Math.max(0, BUNDLE_PRICE - full))} de plus par mois, prenez tous les logiciels avec le pack Multifruit.</span>
                <ArrowRight className="size-4 text-accent" />
              </button>
            )}
          </Step>

          {team && selected.length > 0 && (
            <Step n={2} title="Places" text={`${workspace.members.length} membres dans l’organisation. Plus il y a de places, moins chacune coûte.`}>
              <Card className="divide-y divide-line">
                {lines.map((line) => {
                  const product = productBySlug(line.slug)!
                  const tier = tierFor(line.seats)
                  return (
                    <div key={line.slug} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className="size-9 shrink-0">
                        <AppIcon product={product} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-[0.8rem] text-muted tabular-nums">
                          {formatEuro(seatPriceFor(line.slug, line.seats))} la place{tier.discount > 0 && <span className="text-success"> · −{tier.discount * 100} %</span>}
                        </p>
                      </div>
                      <SeatStepper size="sm" value={line.seats} onChange={(value) => setSeats((prev) => ({ ...prev, [line.slug]: value }))} label={`Places sur ${product.name}`} />
                      <p className="w-24 text-right text-[0.9rem] font-medium tabular-nums">{formatEuro(line.monthly)}</p>
                    </div>
                  )
                })}
              </Card>
            </Step>
          )}

          <Step n={team && selected.length > 0 ? 3 : 2} title="Paiement">
            <div className="space-y-4">
              <Segmented<Billing>
                label="Rythme"
                value={billing}
                onChange={setBilling}
                options={[
                  { value: 'monthly', label: 'Mensuel' },
                  { value: 'annual', label: <>Annuel <span className="text-success">2 mois offerts</span></> },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { id: 'card', icon: CreditCard, title: 'Carte bancaire', text: workspace.payment?.kind === 'card' ? `${workspace.payment.brand} •••• ${workspace.payment.last4}` : 'Visa, Mastercard, CB', detail: 'Débit immédiat' },
                    { id: 'sepa', icon: Landmark, title: 'Prélèvement SEPA', text: 'Depuis un compte en euros', detail: 'Débit sous 3 jours ouvrés' },
                    ...(team ? [{ id: 'order' as const, icon: FileText, title: 'Bon de commande', text: 'Virement à 30 jours', detail: 'Devis envoyé à l’intendance' }] : []),
                  ] as const
                ).map((option) => {
                  const on = pay === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPay(option.id)}
                      className={cn(
                        'bento flex min-h-36 flex-col p-5 text-left transition-shadow',
                        on ? 'shadow-[inset_0_0_0_2px_var(--accent),var(--shadow)]!' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow)]',
                      )}
                    >
                      <span className="flex w-full items-start justify-between">
                        <span className={cn('grid size-11 place-items-center rounded-xl bg-fg/[0.06] text-muted transition-colors', on && 'bg-accent text-accent-fg')}>
                          <option.icon className="size-5" />
                        </span>
                        <span className={cn('grid size-5 place-items-center rounded-full ring-1 ring-line-strong transition-colors ring-inset', on && 'bg-accent text-accent-fg ring-accent')}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                      </span>
                      <span className="mt-auto block pt-4 text-[0.98rem] font-semibold">{option.title}</span>
                      <span className="mt-0.5 block text-[0.84rem] text-muted">{option.text}</span>
                      <span className="mt-2 block text-[0.78rem] text-muted/80">{option.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="p-5">
              <h2 className="font-sans text-[1rem] font-semibold tracking-normal">Récapitulatif</h2>
              {lines.length === 0 ? (
                <p className="mt-3 text-[0.88rem] text-muted">Sélectionnez au moins un logiciel.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {lines.map((line) => {
                    const product = productBySlug(line.slug)!
                    return (
                      <li key={line.slug} className="flex items-center gap-3 text-[0.88rem]">
                        <span className="size-6 shrink-0">
                          <AppIcon product={product} />
                        </span>
                        <span className="flex-1">
                          {product.name} Pro{team && <span className="text-muted"> · {line.seats} places</span>}
                        </span>
                        <span className="tabular-nums">{formatEuro(line.monthly)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="space-y-2 border-t border-line bg-card-alt/60 p-5 text-[0.88rem]">
                {bundle && (
                  <div className="flex justify-between text-success">
                    <span>Pack Multifruit</span>
                    <span className="tabular-nums">−{formatEuro(full - monthly)}/mois</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Par mois</span>
                  <span className="tabular-nums">{formatEuro(monthly)}</span>
                </div>
                {saved > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Économie</span>
                    <span className="tabular-nums">{formatEuro(saved)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-2">
                  <span className="font-medium">Total {billing === 'annual' ? 'par an' : 'aujourd’hui'}</span>
                  <span className="text-[1.5rem] font-semibold tracking-tight tabular-nums">{formatEuro(period)}</span>
                </div>
                <p className="text-[0.75rem] text-muted">{team ? 'Montants HT. TVA ajoutée sur la facture.' : 'TTC. Résiliable à tout moment.'}</p>
                <Button variant="accent" size="lg" className="mt-3 w-full" disabled={status === 'pending'} onClick={confirm}>
                  {status === 'pending' ? (
                    <>
                      <Loader2 className="animate-spin" /> Traitement…
                    </>
                  ) : pay === 'order' ? (
                    'Générer le devis et commander'
                  ) : (
                    <>
                      <Lock /> Payer {formatEuro(period)}
                    </>
                  )}
                </Button>
                <p className="pt-1 text-center text-[0.72rem] text-muted">Simulation : aucun paiement n’est effectué.</p>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}

function Success({ slugs, team, order }: { slugs: string[]; team: boolean; order: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg py-10 text-center">
      <motion.span initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }} className="mx-auto grid size-16 place-items-center rounded-3xl bg-success-soft text-success">
        <PartyPopper className="size-7" />
      </motion.span>
      <h1 className="title-lg mt-6">{order ? 'Commande enregistrée.' : 'C’est prêt.'}</h1>
      <p className="mt-2 text-muted">{team ? (order ? 'Vos places sont actives pendant 30 jours, le temps de régler le bon de commande. Attribuez-les dès maintenant.' : 'Vos places sont actives. Il ne reste qu’à les attribuer à vos membres.') : 'Vos logiciels Pro sont débloqués. Bon travail !'}</p>
      <div className="mt-6 flex justify-center gap-3">
        {slugs.map((slug) => {
          const product = productBySlug(slug)!
          return (
            <span key={slug} className="size-12" title={product.name}>
              <AppIcon product={product} />
            </span>
          )
        })}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {team ? (
          <ButtonLink href={`/logiciels/${slugs[0]}`} variant="primary">
            Attribuer les places
          </ButtonLink>
        ) : (
          <ButtonLink href="/logiciels">Voir mes logiciels</ButtonLink>
        )}
        <ButtonLink href="/factures" variant="secondary">
          Voir la facture
        </ButtonLink>
      </div>
      <p className="hand mt-8 -rotate-2">merci de votre confiance !</p>
    </motion.div>
  )
}

'use client'

import { ArrowLeft, ArrowRight, Building2, Check, LayoutGrid, PartyPopper, UserPlus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { SeatStepper } from '@/components/ui/seat-stepper'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ANNUAL_MONTHS, appMonthly, BUNDLE_DISCOUNT, ORG_TYPES, PRODUCTS, productBySlug, seatPriceFor, type Billing } from '@/lib/catalog'
import { CheckoutPanel, type PaymentMethod } from '@/components/checkout'
import { useStore } from '@/lib/store'
import { cn, formatEuro } from '@/lib/utils'

type Step = 'identity' | 'apps' | 'payment' | 'done'

const STEPS: { id: Exclude<Step, 'done'>; label: string }[] = [
  { id: 'identity', label: 'Organisation' },
  { id: 'apps', label: 'Logiciels et places' },
  { id: 'payment', label: 'Paiement' },
]


const DEFAULT_SEATS = 10

/** Panier d'une nouvelle organisation : logiciels, places, rythme et moyen de paiement. Partagé par la fenêtre et l'inscription. */
export function useOrgCart() {
  const [selected, setSelected] = useState<string[]>([])
  const [seats, setSeats] = useState<Record<string, number>>({})
  const [billing, setBilling] = useState<Billing>('annual')
  const seatsOf = (slug: string) => seats[slug] ?? DEFAULT_SEATS
  const lines = selected.map((slug) => ({ slug, seats: seatsOf(slug), monthly: appMonthly(slug, true, seatsOf(slug)) }))
  const full = lines.reduce((sum, line) => sum + line.monthly, 0)
  // Tous les logiciels : pack Multifruit, −30 % en organisation (comme sur la page Souscrire).
  const bundle = PRODUCTS.every((product) => selected.includes(product.slug))
  const monthly = bundle ? full * (1 - BUNDLE_DISCOUNT) : full
  const period = billing === 'annual' ? monthly * ANNUAL_MONTHS : monthly
  return {
    selected,
    toggle: (slug: string) => setSelected((prev) => (prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug])),
    setSeat: (slug: string, value: number) => setSeats((prev) => ({ ...prev, [slug]: value })),
    lines,
    full,
    bundle,
    monthly,
    period,
    billing,
    setBilling,
    purchase: { cart: lines.map(({ slug, seats }) => ({ slug, seats })), billing, total: period },
    reset: () => {
      setSelected([])
      setSeats({})
      setBilling('annual')
    },
  }
}
export type OrgCart = ReturnType<typeof useOrgCart>

/**
 * Étape « Logiciels et places » : cartes à cocher, puis le nombre de places de chacun. S'adapte à la largeur (container queries).
 * `listClassName` permet de borner la hauteur de la liste pour qu'elle défile seule (colonne étroite de l'inscription).
 * `showSeats={false}` : les places sont réglées dans une étape à part (`OrgSeatsPicker`).
 */
export function OrgAppsPicker({ cart, listClassName, showSeats = true }: { cart: OrgCart; listClassName?: string; showSeats?: boolean }) {
  return (
    <div className="@container space-y-6">
      <div className={cn('grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3', listClassName)}>
        {PRODUCTS.map((product) => {
          const on = cart.selected.includes(product.slug)
          return (
            <button
              key={product.slug}
              type="button"
              aria-pressed={on}
              onClick={() => cart.toggle(product.slug)}
              className={cn('flex items-start gap-3 rounded-2xl p-3.5 text-left ring-1 transition-shadow ring-inset', on ? 'bg-accent-soft/40 ring-2 ring-accent' : 'ring-line-strong hover:bg-bg-alt')}
            >
              <span className="size-10 shrink-0">
                <AppIcon product={product} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{product.name}</span>
                <span className="block truncate text-[0.8rem] text-muted">{product.tagline}</span>
                <span className="mt-1 block text-[0.8rem] font-medium tabular-nums">dès {formatEuro(product.seatPrice * 0.6)} la place</span>
              </span>
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-line-strong transition-colors ring-inset', on && 'bg-accent text-accent-fg ring-accent')}>{on && <Check className="size-3" strokeWidth={3} />}</span>
            </button>
          )
        })}
      </div>

      {showSeats && cart.lines.length > 0 && (
        <div>
          <p className="mb-2 text-[0.88rem] font-medium">Places</p>
          <SeatLines cart={cart} />
        </div>
      )}
    </div>
  )
}

/** Lignes de places, une par logiciel choisi : prix de la place, compteur, montant mensuel. */
function SeatLines({ cart }: { cart: OrgCart }) {
  return (
    <ul className="divide-y divide-line rounded-2xl ring-1 ring-line ring-inset">
      {cart.lines.map((line) => {
        const product = productBySlug(line.slug)!
        return (
          <li key={line.slug} className="flex flex-wrap items-center gap-4 px-4 py-3">
            <span className="size-8 shrink-0">
              <AppIcon product={product} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-medium">{product.name}</p>
              <p className="text-[0.78rem] text-muted tabular-nums">{formatEuro(seatPriceFor(line.slug, line.seats))} la place</p>
            </div>
            <SeatStepper size="sm" value={line.seats} onChange={(value) => cart.setSeat(line.slug, value)} label={`Places sur ${product.name}`} />
            <p className="w-24 text-right text-[0.9rem] font-medium tabular-nums">{formatEuro(line.monthly)}</p>
          </li>
        )
      })}
    </ul>
  )
}

/** Étape « Places » à part (inscription) : le nombre de places par logiciel, puis le résumé de ce qui sera payé. */
export function OrgSeatsPicker({ cart }: { cart: OrgCart }) {
  const annual = cart.monthly * ANNUAL_MONTHS
  return (
    <div className="space-y-5">
      <SeatLines cart={cart} />
      <div className="rounded-2xl bg-bg-alt p-4 text-[0.88rem]">
        <p className="font-medium">Ce que vous paierez</p>
        <div className="mt-3 space-y-1.5">
          {cart.bundle && (
            <div className="flex justify-between text-success">
              <span>Pack Multifruit</span>
              <span className="tabular-nums">−{formatEuro(cart.full - cart.monthly)}/mois</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Au mois</span>
            <span className="font-medium tabular-nums">{formatEuro(cart.monthly)} HT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">À l’année, 2 mois offerts</span>
            <span className="font-medium tabular-nums">{formatEuro(annual)} HT</span>
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[0.78rem] text-muted">Vous choisirez le rythme et le moyen de paiement à l’étape suivante. Les places s’ajustent à tout moment.</p>
      </div>
    </div>
  )
}

/**
 * Création d'une organisation, dans une grande fenêtre : identité, logiciels et places au tarif équipe, paiement.
 * Une organisation n'existe qu'avec un premier abonnement : elle est créée au paiement, jamais avant.
 */
export function CreateOrgDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone?: () => void }) {
  const { state, createOrganization, switchWorkspace } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState<Step>('identity')
  const [name, setName] = useState('')
  const [type, setType] = useState<string>(ORG_TYPES[0])
  const cart = useOrgCart()
  const { selected, lines, monthly } = cart
  const [pending, setPending] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const index = STEPS.findIndex((item) => item.id === step)

  const reset = () => {
    setStep('identity')
    setName('')
    setType(ORG_TYPES[0])
    cart.reset()
    setPending(false)
    setCreatedId(null)
  }

  const close = (next: boolean) => {
    if (pending) return
    onOpenChange(next)
    if (!next) window.setTimeout(reset, 200)
  }

  // Ouvre la nouvelle organisation puis va à `href` (le changement d'espace remonte la page).
  const go = (href: string) => {
    if (createdId) switchWorkspace(createdId)
    close(false)
    router.push(href)
    onDone?.()
  }

  const confirm = (method: PaymentMethod, total: number) => {
    setPending(true)
    window.setTimeout(() => {
      const id = createOrganization(name.trim(), type, { ...cart.purchase, total, method })
      setCreatedId(id)
      setPending(false)
      setStep('done')
      toast(`${name.trim()} est créée`, { text: 'La facture est disponible dans Facturation.' })
    }, 1200)
  }

  const descriptions: Record<Step, string> = {
    identity: 'Pour un établissement, une équipe pédagogique ou une entreprise. Elle détient les logiciels, leurs places et la facture.',
    apps: 'Une organisation démarre avec au moins un logiciel au tarif équipe. Vous la gardez même si un abonnement expire.',
    payment: '',
    done: '',
  }

  const footer =
    step === 'identity' ? (
      <>
        <Button variant="ghost" onClick={() => close(false)}>
          Annuler
        </Button>
        <Button type="submit" form="create-org" disabled={!name.trim()}>
          Continuer <ArrowRight />
        </Button>
      </>
    ) : step === 'apps' ? (
      <>
        <p className="mr-auto text-[0.85rem] text-muted tabular-nums">{lines.length ? <>À partir de <span className="font-medium text-fg">{formatEuro(monthly)}</span> HT par mois</> : 'Choisissez au moins un logiciel.'}</p>
        <Button variant="ghost" onClick={() => setStep('identity')}>
          <ArrowLeft /> Retour
        </Button>
        <Button disabled={!lines.length} onClick={() => setStep('payment')}>
          Continuer <ArrowRight />
        </Button>
      </>
    ) : step === 'payment' ? (
      <Button variant="ghost" disabled={pending} onClick={() => setStep('apps')} className="mr-auto">
        <ArrowLeft /> Retour
      </Button>
    ) : (
      <>
        <Button variant="secondary" onClick={() => go('/membres?inviter=1')}>
          <UserPlus /> Inviter des membres
        </Button>
        <Button onClick={() => go(`/logiciels/${selected[0]}`)}>
          Ouvrir l’organisation <ArrowRight />
        </Button>
      </>
    )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="h-[min(46rem,calc(100dvh-2rem))] max-w-5xl" title={step === 'done' ? `${name.trim()} est prête` : step === 'identity' ? 'Créer une organisation' : name.trim()} description={descriptions[step] || undefined} footer={footer}>
        {step !== 'done' && (
          <ol className="mb-6 flex items-center gap-2 text-[0.8rem]">
            {STEPS.map((item, position) => (
              <li key={item.id} className="flex items-center gap-2">
                {position > 0 && <span className="h-px w-6 bg-line-strong" />}
                <span className={cn('flex items-center gap-1.5', position === index ? 'font-medium text-fg' : 'text-muted')}>
                  <span className={cn('grid size-5 place-items-center rounded-full text-[0.7rem] font-semibold', position < index ? 'bg-fg text-bg' : position === index ? 'bg-accent text-accent-fg' : 'ring-1 ring-line-strong ring-inset')}>{position < index ? <Check className="size-3" strokeWidth={3} /> : position + 1}</span>
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        )}

        {step === 'identity' && (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem]">
            <form
              id="create-org"
              onSubmit={(event) => {
                event.preventDefault()
                if (name.trim()) setStep('apps')
              }}
              className="space-y-4"
            >
              <Field label="Nom de l’organisation" htmlFor="org-name">
                <Input id="org-name" autoFocus placeholder="Lycée Victor-Hugo" value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Type" htmlFor="org-type">
                <Select id="org-type" value={type} onValueChange={setType} options={ORG_TYPES.map((item) => ({ value: item, label: item }))} />
              </Field>
            </form>
            <div className="h-fit rounded-2xl bg-bg-alt p-5">
              <p className="text-[0.88rem] font-medium">Ce que comprend une organisation</p>
              <ul className="mt-3 space-y-3 text-[0.85rem]">
                {[
                  { icon: LayoutGrid, title: 'Des logiciels au tarif équipe', text: 'Au moins un, avec ses places. Moins cher par place avec le volume.' },
                  { icon: Users, title: 'Vos membres et vos groupes', text: 'Invitez élèves et enseignants, rangés par classe.' },
                  { icon: Building2, title: 'Une seule facture', text: 'Au nom de l’établissement, par bon de commande si besoin.' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <item.icon className="mt-0.5 size-4 shrink-0 text-muted" />
                    <span>
                      <span className="block font-medium">{item.title}</span>
                      <span className="block text-muted">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-[0.78rem] text-muted">Vous en serez le propriétaire. Votre compte personnel reste séparé.</p>
            </div>
          </div>
        )}

        {step === 'apps' && <OrgAppsPicker cart={cart} />}

        {step === 'payment' && (
          // Le checkout occupe tout le corps de la fenêtre, bord à bord.
          <div className="-mx-6 -my-5 h-[calc(100%+2.5rem)]">
            <CheckoutPanel cart={cart} description="Le paiement crée l’organisation et active ses places tout de suite." defaultName={{ first: state.user.firstName, last: state.user.lastName }} pending={pending} onPay={confirm} className="h-full" />
          </div>
        )}

        {step === 'done' && (
          <div className="grid h-full place-content-center py-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-success-soft text-success">
              <PartyPopper className="size-6" />
            </span>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Vos places sont actives. Il ne reste qu’à inviter vos membres et leur attribuer une place.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {selected.map((slug) => (
                <span key={slug} className="size-10" title={productBySlug(slug)?.name}>
                  <AppIcon product={productBySlug(slug)!} />
                </span>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

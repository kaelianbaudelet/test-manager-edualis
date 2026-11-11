'use client'

import { CreditCard, Landmark, Loader2, Lock, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useEffect, useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import type { OrgCart } from '@/components/create-org-dialog'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ANNUAL_MONTHS, productBySlug, type Billing } from '@/lib/catalog'
import type { Workspace } from '@/lib/demo-data'
import { cn, formatEuro } from '@/lib/utils'

// Paiement façon StudentSphere / Stripe Checkout : à gauche la facturation et le module de paiement (onglets Carte
// et Prélèvement SEPA), à droite le résumé de la commande et le bouton. Simulation : rien n'est débité.

type Method = 'card' | 'sepa'
export type PaymentMethod = NonNullable<Workspace['payment']>

const METHODS: { id: Method; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Carte', icon: CreditCard },
  { id: 'sepa', label: 'Prélèvement SEPA', icon: Landmark },
]

// Code de démo : −10 % sur la première période.
const PROMOS: Record<string, number> = { RENTREE: 0.1 }

const digits = (value: string) => value.replace(/\D/g, '')
const formatCard = (value: string) => digits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (value: string) => {
  const raw = digits(value).slice(0, 4)
  return raw.length > 2 ? `${raw.slice(0, 2)} / ${raw.slice(2)}` : raw
}
const formatIban = (value: string) =>
  value
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 34)
    .replace(/(.{4})(?=.)/g, '$1 ')

function BrandMarks() {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      <span className="grid h-5 w-8 place-items-center rounded-[4px] bg-[#1a1f71] text-[0.55rem] font-bold tracking-wide text-white italic">VISA</span>
      <span className="relative flex h-5 w-8 items-center justify-center rounded-[4px] bg-[#252525]">
        <span className="size-3 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 size-3 rounded-full bg-[#f79e1b]/90" />
      </span>
      <span className="grid h-5 w-8 place-items-center rounded-[4px] bg-[#0e4c96] text-[0.55rem] font-bold text-white">CB</span>
    </span>
  )
}

/** Squelette du module de paiement, le temps qu'il « charge » (comme le Payment Element de Stripe). */
function PaymentSkeleton() {
  const bar = 'animate-pulse rounded bg-fg/10'
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1].map((index) => (
          <div key={index} className={cn('flex h-16 flex-col justify-center gap-2 rounded-xl p-3 ring-1 ring-inset', index === 0 ? 'ring-fg/25' : 'ring-line')}>
            <span className={cn(bar, 'h-3.5 w-5')} />
            <span className={cn(bar, 'h-3 w-16')} />
          </div>
        ))}
      </div>
      {[0, 1].map((index) => (
        <div key={index} className="space-y-2">
          <span className={cn(bar, 'block h-3.5 w-28')} />
          <span className="block h-11 rounded-xl ring-1 ring-line ring-inset" />
        </div>
      ))}
    </div>
  )
}

/**
 * Le checkout lui-même, sans cadre : utilisable dans une fenêtre (`CheckoutDialog`) ou comme étape d'un parcours.
 * `onPay` reçoit le moyen de paiement saisi et le total réellement facturé (code promo compris).
 */
export function CheckoutPanel({
  cart,
  title,
  description,
  defaultName,
  pending,
  onPay,
  className,
}: {
  cart: OrgCart
  /** Titre du formulaire ; omis quand le cadre (fenêtre, étape) affiche déjà le sien. */
  title?: string
  description: string
  defaultName?: { first: string; last: string }
  pending: boolean
  onPay: (method: PaymentMethod, total: number) => void
  className?: string
}) {
  const [ready, setReady] = useState(false)
  const [method, setMethod] = useState<Method>('card')
  const [first, setFirst] = useState(defaultName?.first ?? '')
  const [last, setLast] = useState(defaultName?.last ?? '')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [country, setCountry] = useState('FR')
  const [iban, setIban] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Corriger un champ efface son erreur tout de suite.
  const edit = (key: string, set: (value: string) => void) => (value: string) => {
    set(value)
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  // Le module « charge » un court instant, puis le formulaire remplace le squelette en fondu.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 650)
    return () => window.clearTimeout(timer)
  }, [])

  const discount = promo ? cart.period * PROMOS[promo] : 0
  const total = cart.period - discount
  const per = cart.billing === 'annual' ? 'an' : 'mois'

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (PROMOS[code]) {
      setPromo(code)
      setPromoError(undefined)
    } else setPromoError('Ce code n’est pas valide.')
  }

  const submit = () => {
    const found: Record<string, string> = {}
    if (!first.trim()) found.first = 'Requis.'
    if (!last.trim()) found.last = 'Requis.'
    if (method === 'card') {
      if (digits(card).length !== 16) found.card = 'Numéro de carte incomplet.'
      const [month, year] = [Number(digits(expiry).slice(0, 2)), digits(expiry).slice(2)]
      if (year.length !== 2 || month < 1 || month > 12) found.expiry = 'Date invalide.'
      if (digits(cvc).length < 3) found.cvc = 'Code incomplet.'
    }
    if (method === 'sepa' && iban.replace(/\s/g, '').length < 14) found.iban = 'IBAN incomplet.'
    setErrors(found)
    if (Object.keys(found).length) return
    const payment: PaymentMethod =
      method === 'card'
        ? { kind: 'card', brand: digits(card).startsWith('5') ? 'Mastercard' : 'Visa', last4: digits(card).slice(-4), exp: `${digits(expiry).slice(0, 2)}/${digits(expiry).slice(2)}` }
        : { kind: 'sepa', iban: `${iban.replace(/\s/g, '').slice(0, 4)} •••• ${iban.replace(/\s/g, '').slice(-4)}` }
    onPay(payment, Math.round(total * 100) / 100)
  }

  return (
    <div className={cn('grid min-h-0 md:grid-cols-[minmax(0,1fr)_22rem]', className)}>
      {/* Formulaire */}
      <div className="min-h-0 overflow-y-auto p-6 md:p-8">
        {title && <h2 className="font-serif text-[1.5rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>}
        <p className={cn('text-[0.88rem] text-muted', title && 'mt-1.5')}>{description}</p>

        <div className="mt-7">
          <p className="mb-3 text-[0.88rem] font-medium">Options de facturation</p>
          <div role="radiogroup" aria-label="Options de facturation" className="space-y-2.5">
            {(
              [
                { value: 'monthly', title: 'Paiement mensuel', text: 'Facturé chaque mois, sans engagement.' },
                { value: 'annual', title: 'Paiement annuel', text: 'Facturé en une fois pour l’année.', badge: `${12 - ANNUAL_MONTHS} mois offerts` },
              ] as { value: Billing; title: string; text: string; badge?: string }[]
            ).map((option) => {
              const on = cart.billing === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={pending}
                  onClick={() => cart.setBilling(option.value)}
                  className={cn('flex w-full items-start gap-3 rounded-xl p-4 text-left ring-1 transition-shadow ring-inset', on ? 'bg-accent-soft/40 ring-2 ring-accent' : 'ring-line-strong hover:bg-bg-alt')}
                >
                  <span className={cn('mt-0.5 size-4 shrink-0 rounded-full ring-1 ring-line-strong ring-inset', on && 'ring-[5px] ring-accent')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[0.9rem] font-medium">{option.title}</span>
                      {option.badge && <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.72rem] font-medium text-success">{option.badge}</span>}
                    </span>
                    <span className="block text-[0.8rem] text-muted">{option.text}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Field label="Prénom" htmlFor="co-first" error={errors.first}>
            <Input id="co-first" autoComplete="given-name" placeholder="Jean" disabled={pending} value={first} aria-invalid={Boolean(errors.first)} onChange={(event) => edit('first', setFirst)(event.target.value)} />
          </Field>
          <Field label="Nom" htmlFor="co-last" error={errors.last}>
            <Input id="co-last" autoComplete="family-name" placeholder="Dupont" disabled={pending} value={last} aria-invalid={Boolean(errors.last)} onChange={(event) => edit('last', setLast)(event.target.value)} />
          </Field>
        </div>

        {/* Module de paiement */}
        <div className="relative mt-6 min-h-80">
          <div className={cn('transition duration-300 ease-out', ready ? 'pointer-events-none absolute inset-x-0 top-0 scale-[0.99] opacity-0 blur-[1px]' : 'opacity-100')}>
            <PaymentSkeleton />
          </div>
          <div className={cn('space-y-4 transition duration-500 ease-out', ready ? 'translate-y-0 opacity-100' : 'pointer-events-none absolute inset-x-0 top-0 translate-y-2 opacity-0')}>
            <div role="tablist" aria-label="Moyen de paiement" className="grid grid-cols-2 gap-2.5">
              {METHODS.map((item) => {
                const on = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    disabled={pending}
                    onClick={() => {
                      setMethod(item.id)
                      setErrors({})
                    }}
                    className={cn('flex h-16 flex-col justify-center gap-1.5 rounded-xl px-3 text-left ring-1 transition-shadow ring-inset', on ? 'text-accent ring-2 ring-accent' : 'text-muted ring-line-strong hover:bg-bg-alt hover:text-fg')}
                  >
                    <item.icon className="size-4" />
                    <span className="truncate text-[0.82rem] font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {method === 'card' && (
              <>
                <Field label="Numéro de carte" htmlFor="co-card" error={errors.card}>
                  <div className="relative">
                    <Input id="co-card" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" disabled={pending} value={card} aria-invalid={Boolean(errors.card)} onChange={(event) => edit('card', setCard)(formatCard(event.target.value))} className="pr-32 tabular-nums" />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                      <BrandMarks />
                    </span>
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date d’expiration" htmlFor="co-exp" error={errors.expiry}>
                    <Input id="co-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / AA" disabled={pending} value={expiry} aria-invalid={Boolean(errors.expiry)} onChange={(event) => edit('expiry', setExpiry)(formatExpiry(event.target.value))} className="tabular-nums" />
                  </Field>
                  <Field label="Code de sécurité" htmlFor="co-cvc" error={errors.cvc}>
                    <Input id="co-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" disabled={pending} value={cvc} aria-invalid={Boolean(errors.cvc)} onChange={(event) => edit('cvc', setCvc)(digits(event.target.value).slice(0, 4))} className="tabular-nums" />
                  </Field>
                </div>
                <Field label="Pays" htmlFor="co-country">
                  <Select
                    id="co-country"
                    value={country}
                    onValueChange={setCountry}
                    options={[
                      { value: 'FR', label: 'France' },
                      { value: 'BE', label: 'Belgique' },
                      { value: 'CH', label: 'Suisse' },
                      { value: 'LU', label: 'Luxembourg' },
                    ]}
                  />
                </Field>
              </>
            )}

            {method === 'sepa' && (
              <>
                <Field label="IBAN" htmlFor="co-iban" error={errors.iban}>
                  <Input id="co-iban" autoComplete="off" placeholder="FR76 3000 6000 0112 3456 7890 189" disabled={pending} value={iban} aria-invalid={Boolean(errors.iban)} onChange={(event) => edit('iban', setIban)(formatIban(event.target.value))} className="font-mono tracking-wide" />
                </Field>
                <p className="text-[0.78rem] text-muted">En fournissant votre IBAN, vous autorisez Edualis à envoyer des instructions à votre banque pour débiter votre compte, conformément au mandat SEPA. Premier prélèvement sous 3 jours ouvrés.</p>
              </>
            )}

            <p className="text-[0.75rem] text-muted">En confirmant, vous autorisez Edualis à débiter ce moyen de paiement selon les conditions de l’abonnement, jusqu’à sa résiliation.</p>
          </div>
        </div>
      </div>

      {/* Résumé de la commande */}
      <div className="flex min-h-0 flex-col overflow-y-auto border-t border-line bg-bg-alt/60 p-6 md:border-t-0 md:border-l md:p-8">
        <h3 className="mb-4 font-sans text-[0.95rem] font-medium tracking-normal">Résumé de la commande</h3>
        <ul className="space-y-2">
          {cart.lines.map((line) => {
            const product = productBySlug(line.slug)!
            return (
              <li key={line.slug} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-line ring-inset">
                <span className="size-8 shrink-0">
                  <AppIcon product={product} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.88rem] font-semibold">{product.name} Pro</span>
                  <span className="block text-[0.75rem] text-muted">{line.seats} places · tarif équipe</span>
                </span>
                <span className="text-right text-[0.85rem] font-semibold tabular-nums">
                  {formatEuro(line.monthly)}
                  <span className="block text-[0.7rem] font-normal text-muted">/ mois</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 mb-auto space-y-3 text-[0.88rem]">
          {cart.bundle && (
            <div className="flex justify-between text-success">
              <span>Pack Multifruit</span>
              <span className="tabular-nums">−{formatEuro(cart.full - cart.monthly)} / mois</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>{cart.billing === 'annual' ? 'Facturé annuellement' : 'Facturé mensuellement'}</span>
            <span className="tabular-nums">
              {formatEuro(cart.period)} / {per}
            </span>
          </div>
          {promo && (
            <div className="flex justify-between text-success">
              <span className="flex items-center gap-1.5">
                Code {promo}
                <button type="button" aria-label="Retirer le code" disabled={pending} onClick={() => setPromo(null)} className="grid size-4 place-items-center rounded-full text-muted hover:bg-fg/10 hover:text-fg">
                  <X className="size-3" />
                </button>
              </span>
              <span className="tabular-nums">−{formatEuro(discount)}</span>
            </div>
          )}
          <div className="h-px bg-line" />
          <div className="flex items-baseline justify-between gap-4 text-[1.05rem] font-semibold">
            <span>Total à payer aujourd’hui</span>
            <span className="tabular-nums">{formatEuro(total)}</span>
          </div>
          <p className="text-[0.75rem] text-muted">Montants HT. La TVA est ajoutée sur la facture.</p>

          {!promo && (
            <div className="pt-2">
              <label htmlFor="co-promo" className="mb-1.5 block text-[0.82rem] font-medium">
                Code promo
              </label>
              {/* Un seul champ, « Appliquer » intégré à droite (comme Stripe). */}
              <div className="relative">
                <Input
                  id="co-promo"
                  placeholder="RENTREE"
                  autoComplete="off"
                  disabled={pending}
                  value={promoInput}
                  aria-invalid={Boolean(promoError)}
                  onChange={(event) => {
                    setPromoInput(event.target.value)
                    setPromoError(undefined)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyPromo()
                    }
                  }}
                  className="h-11 pr-24 uppercase placeholder:normal-case"
                />
                <button
                  type="button"
                  disabled={pending || !promoInput.trim()}
                  onClick={applyPromo}
                  className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg px-3 text-[0.85rem] font-medium text-accent transition-colors hover:bg-accent-soft disabled:pointer-events-none disabled:text-muted/60"
                >
                  Appliquer
                </button>
              </div>
              {promoError && <p className="mt-1.5 text-[0.78rem] text-danger">{promoError}</p>}
            </div>
          )}
        </div>

        <Button variant="accent" size="lg" className="mt-6 w-full" disabled={pending || !ready || !cart.lines.length} onClick={submit}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> Paiement en cours…
            </>
          ) : (
            <>
              <Lock /> Payer {formatEuro(total)}
            </>
          )}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.72rem] text-muted">
          <Lock className="size-3" /> Paiement sécurisé · simulation, aucun débit
        </p>
      </div>
    </div>
  )
}

/** Le checkout dans sa propre grande fenêtre (ouverte au clic sur « Payer »). */
export function CheckoutDialog({ open, onOpenChange, pending, ...panel }: { open: boolean; onOpenChange: (open: boolean) => void } & React.ComponentProps<typeof CheckoutPanel>) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="dialog-content fixed top-1/2 left-1/2 z-50 flex h-[min(48rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.4rem] bg-card shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-line outline-none">
          <DialogPrimitive.Title className="sr-only">{panel.title ?? 'Paiement'}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{panel.description}</DialogPrimitive.Description>
          <DialogPrimitive.Close aria-label="Fermer" disabled={pending} className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg">
            <X className="size-4" />
          </DialogPrimitive.Close>
          <CheckoutPanel {...panel} pending={pending} className="h-full overflow-y-auto md:overflow-hidden" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

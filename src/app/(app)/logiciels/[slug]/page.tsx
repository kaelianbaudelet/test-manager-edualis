'use client'

import { ArrowLeft, ArrowUpRight, Check, Search, UserMinus, UserPlus, X } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SeatBar } from '@/components/ui/progress'
import { SeatStepper } from '@/components/ui/seat-stepper'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'
import { ANNUAL_MONTHS, appMonthly, periodAmount, productBySlug, ROLES, SEAT_TIERS, seatPriceFor, tierFor, type Billing, type Product } from '@/lib/catalog'
import type { Subscription } from '@/lib/demo-data'
import { seatsUsed, useStore } from '@/lib/store'
import { cn, formatDate, formatEuro, plural } from '@/lib/utils'

export default function SoftwareDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const product = productBySlug(slug)
  const { workspace, isOrg, canManage } = useStore()
  const toast = useToast()
  if (!product) notFound()
  const sub = workspace.subscriptions.find((item) => item.slug === slug)

  return (
    <>
      <Link href="/logiciels" className="mb-6 inline-flex items-center gap-1.5 text-[0.85rem] text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {isOrg && canManage ? 'Logiciels et places' : 'Mes logiciels'}
      </Link>

      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="size-16 shrink-0">
          <AppIcon product={product} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="title-lg">{product.name}</h1>
            {sub ? <Badge tone="accent">Pro</Badge> : <Badge tone="outline">Gratuit</Badge>}
          </div>
          <p className="mt-1 text-muted">{product.description}</p>
        </div>
        <Button variant="secondary" onClick={() => toast(`Ouverture de ${product.name}…`, { tone: 'info' })}>
          Ouvrir {product.name} <ArrowUpRight />
        </Button>
      </header>

      {!sub ? <Upsell product={product} team={isOrg} /> : isOrg && canManage ? <OrgManage product={product} sub={sub} /> : <PersonalManage product={product} sub={sub} />}
    </>
  )
}

function Features({ product }: { product: Product }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-bg-alt p-5">
        <p className="text-[0.82rem] font-medium text-muted">Standard · gratuit</p>
        <ul className="mt-3 space-y-2 text-[0.88rem]">
          {product.free.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-muted" /> {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-accent-soft/60 p-5 ring-1 ring-accent/20 ring-inset">
        <p className="text-[0.82rem] font-medium text-accent">Pro</p>
        <ul className="mt-3 space-y-2 text-[0.88rem]">
          {product.pro.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Upsell({ product, team }: { product: Product; team: boolean }) {
  return (
    <Card>
      <CardHeader title={`Passer ${product.name} en Pro`} description={team ? `À partir de ${formatEuro(product.seatPrice)} la place par mois, moins cher avec le volume.` : `${formatEuro(product.price)} par mois, sans engagement. Deux mois offerts à l’année.`} />
      <CardBody>
        <Features product={product} />
      </CardBody>
      <CardFooter>
        <ButtonLink href={`/souscrire?app=${product.slug}`} variant="accent">
          Configurer l’abonnement
        </ButtonLink>
      </CardFooter>
    </Card>
  )
}

function CancelDialog({ product, open, onOpenChange, team }: { product: Product; open: boolean; onOpenChange: (open: boolean) => void; team: boolean }) {
  const { cancel } = useStore()
  const router = useRouter()
  const toast = useToast()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Résilier ${product.name} Pro ?`}
        description={team ? 'Les membres perdront l’accès Pro à la fin de la période en cours. Leurs projets sont conservés 12 mois.' : 'Vous repasserez en version gratuite à la fin de la période. Vos projets sont conservés.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Garder mon abonnement
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancel(product.slug)
                toast(`${product.name} Pro résilié`, { text: 'Un e-mail de confirmation vous a été envoyé.' })
                router.push('/logiciels')
              }}
            >
              Résilier
            </Button>
          </>
        }
      />
    </Dialog>
  )
}

function BillingCard({ sub, team, product }: { sub: Subscription; team: boolean; product: Product }) {
  const { setBilling } = useStore()
  const toast = useToast()
  const [cancelOpen, setCancelOpen] = useState(false)
  const monthly = appMonthly(sub.slug, team, sub.seats)
  return (
    <Card>
      <CardHeader title="Facturation" description={`Abonné depuis le ${formatDate(sub.since)}`} />
      <CardBody className="divide-y divide-line py-0">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-[0.92rem] font-medium">Rythme de paiement</p>
            <p className="text-[0.82rem] text-muted">Le changement s’applique au prochain renouvellement.</p>
          </div>
          <Segmented<Billing>
            label="Rythme de paiement"
            value={sub.billing}
            onChange={(billing) => {
              setBilling(sub.slug, billing)
              toast(billing === 'annual' ? 'Passage à l’année programmé' : 'Passage au mois programmé', { text: `À partir du ${formatDate(sub.renews)}.` })
            }}
            options={[
              { value: 'monthly', label: 'Mensuel' },
              { value: 'annual', label: <>Annuel <span className="text-success">−2 mois</span></> },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-4 py-4 text-[0.92rem]">
          <p className="font-medium">Montant par {sub.billing === 'annual' ? 'an' : 'mois'}</p>
          <p className="font-medium tabular-nums">{formatEuro(periodAmount(monthly, sub.billing))}</p>
        </div>
        <div className="flex items-center justify-between gap-4 py-4 text-[0.92rem]">
          <p className="font-medium">Prochain renouvellement</p>
          <p>{formatDate(sub.renews)}</p>
        </div>
        {sub.billing === 'monthly' && (
          <div className="flex items-center justify-between gap-4 py-4 text-[0.92rem]">
            <p className="font-medium">À l’année, vous économiseriez</p>
            <p className="font-medium text-success tabular-nums">{formatEuro(monthly * (12 - ANNUAL_MONTHS))}</p>
          </div>
        )}
      </CardBody>
      <CardFooter className="justify-between">
        <Button variant="danger-ghost" onClick={() => setCancelOpen(true)}>
          Résilier
        </Button>
        <ButtonLink href="/factures" variant="secondary">
          Voir les factures
        </ButtonLink>
      </CardFooter>
      <CancelDialog product={product} team={team} open={cancelOpen} onOpenChange={setCancelOpen} />
    </Card>
  )
}

function PersonalManage({ product, sub }: { product: Product; sub: Subscription }) {
  const { isOrg, workspace } = useStore()
  if (isOrg)
    return (
      <Card className="p-6 text-[0.9rem] text-muted">
        Votre place sur {product.name} est fournie par {workspace.name} jusqu’au {formatDate(sub.renews)}.
      </Card>
    )
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Votre formule" description="Tout ce qui est inclus dans votre abonnement Pro." />
        <CardBody>
          <Features product={product} />
        </CardBody>
      </Card>
      <BillingCard sub={sub} team={false} product={product} />
    </div>
  )
}

// ------------------------------------------------------------------ Organisation : places et accès
function OrgManage({ product, sub }: { product: Product; sub: Subscription }) {
  const { workspace, setSeats, toggleMemberApp } = useStore()
  const toast = useToast()
  const used = seatsUsed(workspace, sub.slug)
  const [draft, setDraft] = useState(sub.seats)
  const [query, setQuery] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const holders = workspace.members.filter((member) => member.apps.includes(sub.slug))
  const shown = holders.filter((member) => `${member.name} ${member.email} ${member.group}`.toLowerCase().includes(query.toLowerCase()))
  const free = sub.seats - used

  const before = appMonthly(sub.slug, true, sub.seats)
  const after = appMonthly(sub.slug, true, draft)
  const diff = draft - sub.seats
  const tooFew = draft < used
  const tier = tierFor(draft)
  const nextTier = SEAT_TIERS.find((item) => item.from > draft)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Places" description="Une place permet à un membre d’utiliser la version Pro. Ajustez-les à tout moment." />
        <CardBody>
          <p className="text-[2.2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {used} <span className="text-[1.1rem] font-normal text-muted">/ {sub.seats} attribuées</span>
          </p>
          <SeatBar used={used} total={sub.seats} className="mt-4 h-2" color={product.color} />
          <p className="mt-2 text-[0.82rem] text-muted">{free > 0 ? `${plural(free, 'place libre')}` : 'Toutes les places sont attribuées.'}</p>

          <div className="mt-6 rounded-2xl bg-bg-alt p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[0.88rem] font-medium">Modifier le nombre de places</p>
                <p className="text-[0.8rem] text-muted">
                  {formatEuro(seatPriceFor(sub.slug, draft))} la place · palier {tier.label}
                  {tier.discount > 0 && <span className="text-success"> (−{tier.discount * 100} %)</span>}
                </p>
              </div>
              <SeatStepper value={draft} onChange={setDraft} size="sm" />
            </div>
            {nextTier && <p className="mt-3 text-[0.8rem] text-muted">Encore {nextTier.from - draft} places et chaque place passe à −{nextTier.discount * 100} %.</p>}
            {diff !== 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-[0.85rem]">
                  {tooFew ? (
                    <span className="text-danger">Retirez d’abord l’accès à {used - draft} membre{used - draft > 1 ? 's' : ''} : {used} places sont attribuées.</span>
                  ) : (
                    <>
                      {diff > 0 ? `+${diff}` : diff} places · <span className="font-medium tabular-nums">{formatEuro(after)}/mois</span> <span className="text-muted">au lieu de {formatEuro(before)}</span>
                      {diff > 0 && <span className="block text-[0.78rem] text-muted">Facturé au prorata jusqu’au {formatDate(sub.renews)}.</span>}
                    </>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDraft(sub.seats)}>
                    Annuler
                  </Button>
                  <Button
                    disabled={tooFew}
                    onClick={() => {
                      setSeats(sub.slug, draft)
                      toast(`${product.name} : ${draft} places`, { text: diff > 0 ? 'Les nouvelles places sont disponibles tout de suite.' : 'Le changement s’applique au prochain renouvellement.' })
                    }}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Qui a accès"
          description={`${plural(holders.length, 'membre')} avec une place sur ${product.name}.`}
          action={
            <Button onClick={() => setAssignOpen(true)} disabled={free <= 0}>
              <UserPlus /> Attribuer
            </Button>
          }
        />
        <CardBody className="pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <Input placeholder="Rechercher un membre ou un groupe" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-10" />
          </div>
          <ul className="mt-3 max-h-[26rem] divide-y divide-line overflow-y-auto">
            {shown.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-medium">
                    {member.name} {member.id === 'm-me' && <span className="font-normal text-muted">(vous)</span>}
                  </p>
                  <p className="truncate text-[0.78rem] text-muted">
                    {ROLES[member.role].short} · {member.group}
                  </p>
                </div>
                {member.status === 'invited' && <Badge tone="warning">Invité</Badge>}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Retirer l’accès de ${member.name}`}
                  title="Retirer l’accès"
                  onClick={() => {
                    toggleMemberApp([member.id], sub.slug, false)
                    toast(`Accès retiré à ${member.name}`, { text: 'La place est de nouveau libre.' })
                  }}
                >
                  <UserMinus />
                </Button>
              </li>
            ))}
            {shown.length === 0 && <li className="py-6 text-center text-[0.88rem] text-muted">Aucun membre ne correspond.</li>}
          </ul>
        </CardBody>
      </Card>

      <BillingCard sub={sub} team product={product} />

      <Card>
        <CardHeader title="Inclus dans Pro" />
        <CardBody>
          <ul className="grid gap-x-6 gap-y-2 text-[0.88rem] sm:grid-cols-2">
            {product.pro.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {feature}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} product={product} free={free} />
    </div>
  )
}

function AssignDialog({ open, onOpenChange, product, free }: { open: boolean; onOpenChange: (open: boolean) => void; product: Product; free: number }) {
  const { workspace, toggleMemberApp } = useStore()
  const toast = useToast()
  const [selected, setSelected] = useState<string[]>([])
  const [group, setGroup] = useState('Tous')
  const candidates = useMemo(() => workspace.members.filter((member) => !member.apps.includes(product.slug) && (group === 'Tous' || member.group === group)), [workspace.members, product.slug, group])
  const over = selected.length > free
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  const allIn = candidates.length > 0 && candidates.every((member) => selected.includes(member.id))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setSelected([])
      }}
    >
      <DialogContent
        title={`Attribuer des places sur ${product.name}`}
        description={`${plural(free, 'place libre')}. Choisissez des membres ou un groupe entier.`}
        footer={
          <>
            <p className={cn('mr-auto text-[0.82rem] text-muted', over && 'text-danger')}>{over ? `${selected.length - free} de trop : ajoutez des places d’abord.` : `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`}</p>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              disabled={!selected.length || over}
              onClick={() => {
                toggleMemberApp(selected, product.slug, true)
                toast(`${plural(selected.length, 'place attribuée')}`, { text: `Les membres reçoivent un e-mail pour ouvrir ${product.name}.` })
                setSelected([])
                onOpenChange(false)
              }}
            >
              Attribuer
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['Tous', ...workspace.groups].map((item) => (
            <button key={item} type="button" onClick={() => setGroup(item)} className={cn('h-7 rounded-full px-3 text-[0.8rem] ring-1 ring-line-strong ring-inset transition-colors', group === item ? 'bg-fg text-bg ring-fg' : 'text-muted hover:text-fg')}>
              {item}
            </button>
          ))}
        </div>
        {candidates.length ? (
          <>
            <label className="flex items-center gap-3 border-b border-line py-2 text-[0.85rem] font-medium">
              <Checkbox checked={allIn ? true : selected.length ? 'indeterminate' : false} onCheckedChange={() => setSelected(allIn ? [] : [...new Set([...selected, ...candidates.map((member) => member.id)])])} />
              Tout sélectionner ({candidates.length})
            </label>
            <ul className="max-h-80 overflow-y-auto">
              {candidates.map((member) => (
                <li key={member.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl py-2">
                    <Checkbox checked={selected.includes(member.id)} onCheckedChange={() => toggle(member.id)} />
                    <Avatar name={member.name} className="size-7 text-[0.65rem]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem]">{member.name}</span>
                      <span className="block truncate text-[0.75rem] text-muted">{member.group}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="flex items-center gap-2 py-6 text-[0.88rem] text-muted">
            <X className="size-4" /> Tous les membres de ce groupe ont déjà accès.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

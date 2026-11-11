'use client'

import { CreditCard, Download, FileText, Landmark, Pencil, ReceiptText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PageHeader, SectionTitle } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty'
import { Field, Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { useToast } from '@/components/ui/toast'
import { appMonthly, periodAmount, productBySlug } from '@/lib/catalog'
import type { Workspace } from '@/lib/demo-data'
import { useStore } from '@/lib/store'
import { formatDate, formatEuro } from '@/lib/utils'

const STATUS = {
  paid: { label: 'Payée', tone: 'success' },
  due: { label: 'À régler', tone: 'warning' },
  refunded: { label: 'Gratuite', tone: 'neutral' },
} as const

export default function InvoicesPage() {
  const { workspace, isOrg, canManage } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [year, setYear] = useState<'all' | '2026' | '2025'>('all')
  const [payOpen, setPayOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)

  useEffect(() => {
    if (isOrg && !canManage) router.replace('/')
  }, [isOrg, canManage, router])
  if (isOrg && !canManage) return null

  const invoices = workspace.invoices.filter((invoice) => year === 'all' || invoice.date.startsWith(year))
  const total = workspace.invoices.filter((invoice) => invoice.date.startsWith('2026') && invoice.status !== 'refunded').reduce((sum, invoice) => sum + invoice.amount, 0)

  return (
    <>
      <PageHeader title={isOrg ? 'Facturation' : 'Factures'} description={isOrg ? 'Échéances, moyen de paiement et documents comptables de l’organisation.' : 'Vos paiements, votre moyen de paiement et vos factures.'} />

      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingCard workspace={workspace} />

        <Card className="flex flex-col">
          <CardHeader title="Moyen de paiement" />
          <CardBody className="flex-1">
            <PaymentMethod workspace={workspace} />
          </CardBody>
          <CardFooter className="justify-start">
            <Button variant="secondary" onClick={() => setPayOpen(true)}>
              <Pencil /> Modifier
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Adresse de facturation" />
          <CardBody className="flex-1 text-[0.88rem]">
            <p className="font-medium">{workspace.billingAddress.name}</p>
            <p className="text-muted">{workspace.billingAddress.line || 'Adresse à compléter'}</p>
            <p className="text-muted">{workspace.billingAddress.city}</p>
            {workspace.billingAddress.vat && <p className="mt-2 text-[0.8rem] text-muted">TVA {workspace.billingAddress.vat}</p>}
          </CardBody>
          <CardFooter className="justify-start">
            <Button variant="secondary" onClick={() => setAddressOpen(true)}>
              <Pencil /> Modifier
            </Button>
          </CardFooter>
        </Card>
      </div>

      <SectionTitle
        className="mt-10"
        action={
          <Segmented
            size="sm"
            label="Année"
            value={year}
            onChange={setYear}
            options={[
              { value: 'all', label: 'Toutes' },
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025' },
            ]}
          />
        }
      >
        Historique {total > 0 && <span className="ml-2 text-[0.85rem] font-normal text-muted">· {formatEuro(total)} en 2026</span>}
      </SectionTitle>
      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState icon={<ReceiptText />} title="Aucune facture" text="Vos factures apparaîtront ici après votre premier abonnement." action={<ButtonLink href="/souscrire">Souscrire</ButtonLink>} />
        ) : (
          <table className="w-full text-[0.88rem]">
            <thead className="border-b border-line bg-card-alt/60 text-left text-[0.78rem] text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Numéro</th>
                <th className="px-5 py-2.5 font-medium">Détail</th>
                <th className="px-5 py-2.5 text-right font-medium">Montant</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Statut</th>
                <th className="w-12 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-fg/[0.02]">
                  <td className="px-5 py-3 whitespace-nowrap">{formatDate(invoice.date)}</td>
                  <td className="hidden px-5 py-3 font-mono text-[0.8rem] text-muted sm:table-cell">{invoice.number}</td>
                  <td className="max-w-[16rem] truncate px-5 py-3 text-muted">{invoice.label}</td>
                  <td className="px-5 py-3 text-right font-medium whitespace-nowrap tabular-nums">{formatEuro(invoice.amount)}</td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <Badge tone={STATUS[invoice.status].tone} dot>
                      {STATUS[invoice.status].label}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Button size="icon-sm" variant="ghost" aria-label={`Télécharger la facture ${invoice.number}`} onClick={() => toast(`${invoice.number}.pdf téléchargée`)}>
                      <Download />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} />
      <AddressDialog open={addressOpen} onOpenChange={setAddressOpen} />
    </>
  )
}

function UpcomingCard({ workspace }: { workspace: Workspace }) {
  const team = workspace.kind === 'organization'
  const subs = workspace.subscriptions
  const date = subs.map((sub) => sub.renews).sort()[0]
  const due = subs.filter((sub) => sub.renews === date)
  const amount = due.reduce((sum, sub) => sum + periodAmount(appMonthly(sub.slug, team, sub.seats), sub.billing), 0)
  return (
    <Card className="flex flex-col bg-fg! text-bg">
      <CardHeader title={<span className="text-bg">Prochaine échéance</span>} description={<span className="text-bg/60">{date ? `le ${formatDate(date)}` : 'Aucun abonnement'}</span>} />
      <CardBody className="flex-1">
        <p className="text-[2.2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{formatEuro(amount)}</p>
        <ul className="mt-4 space-y-1.5 text-[0.82rem] text-bg/70">
          {due.map((sub) => (
            <li key={sub.slug} className="flex justify-between">
              <span>
                {productBySlug(sub.slug)?.name}
                {team && ` · ${sub.seats} places`}
              </span>
              <span className="tabular-nums">{formatEuro(periodAmount(appMonthly(sub.slug, team, sub.seats), sub.billing))}</span>
            </li>
          ))}
        </ul>
      </CardBody>
      <div className="px-6 pb-5 text-[0.78rem] text-bg/60">{team ? 'Devis envoyé 30 jours avant, à l’intendance.' : 'Prélevé automatiquement.'}</div>
    </Card>
  )
}

function PaymentMethod({ workspace }: { workspace: Workspace }) {
  const payment = workspace.payment
  if (!payment) return <p className="text-[0.88rem] text-muted">Aucun moyen de paiement enregistré.</p>
  const [Icon, title, text] =
    payment.kind === 'card'
      ? [CreditCard, `${payment.brand} •••• ${payment.last4}`, `Expire fin ${payment.exp}`]
      : payment.kind === 'sepa'
        ? [Landmark, 'Prélèvement SEPA', payment.iban]
        : [FileText, 'Bon de commande', 'Virement à 30 jours, sur devis. Chorus Pro accepté.']
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-bg-alt ring-1 ring-line ring-inset">
        <Icon className="size-4 text-muted" />
      </span>
      <div className="text-[0.88rem]">
        <p className="font-medium">{title}</p>
        <p className="text-muted">{text}</p>
      </div>
    </div>
  )
}

function PaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { isOrg, updateWorkspace } = useStore()
  const toast = useToast()
  const [kind, setKind] = useState<'card' | 'sepa' | 'order'>('card')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Moyen de paiement"
        description="Simulation : aucune donnée bancaire n’est enregistrée."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                updateWorkspace({ payment: kind === 'card' ? { kind: 'card', brand: 'Mastercard', last4: '5100', exp: '04/29' } : kind === 'sepa' ? { kind: 'sepa', iban: 'FR76 •••• •••• •••• 0189' } : { kind: 'order' } })
                toast('Moyen de paiement mis à jour')
                onOpenChange(false)
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <Segmented
          label="Type"
          value={kind}
          onChange={setKind}
          className="mb-5"
          options={[{ value: 'card', label: 'Carte' }, { value: 'sepa', label: 'SEPA' }, ...(isOrg ? [{ value: 'order' as const, label: 'Bon de commande' }] : [])]}
        />
        {kind === 'card' && (
          <div className="space-y-3">
            <Field label="Numéro de carte" htmlFor="cc">
              <Input id="cc" inputMode="numeric" placeholder="1234 1234 1234 1234" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiration" htmlFor="exp">
                <Input id="exp" placeholder="MM/AA" />
              </Field>
              <Field label="Cryptogramme" htmlFor="cvc">
                <Input id="cvc" placeholder="123" />
              </Field>
            </div>
          </div>
        )}
        {kind === 'sepa' && (
          <div className="space-y-3">
            <Field label="Titulaire du compte" htmlFor="holder">
              <Input id="holder" />
            </Field>
            <Field label="IBAN" htmlFor="iban">
              <Input id="iban" placeholder="FR76 …" className="font-mono" />
            </Field>
          </div>
        )}
        {kind === 'order' && <p className="rounded-2xl bg-bg-alt p-4 text-[0.88rem] text-muted">Nous vous envoyons un devis à chaque échéance. Les places restent actives 30 jours, le temps de régler par virement ou via Chorus Pro.</p>}
      </DialogContent>
    </Dialog>
  )
}

function AddressDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { workspace, isOrg, updateWorkspace } = useStore()
  const toast = useToast()
  const [address, setAddress] = useState(workspace.billingAddress)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Adresse de facturation"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                updateWorkspace({ billingAddress: address })
                toast('Adresse enregistrée')
                onOpenChange(false)
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={isOrg ? 'Établissement ou service' : 'Nom'} htmlFor="a-name">
            <Input id="a-name" value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} />
          </Field>
          <Field label="Adresse" htmlFor="a-line">
            <Input id="a-line" value={address.line} onChange={(event) => setAddress({ ...address, line: event.target.value })} />
          </Field>
          <Field label="Code postal et ville" htmlFor="a-city">
            <Input id="a-city" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
          </Field>
          {isOrg && (
            <Field label="N° de TVA intracommunautaire" htmlFor="a-vat" hint="Facultatif pour un établissement public.">
              <Input id="a-vat" value={address.vat ?? ''} onChange={(event) => setAddress({ ...address, vat: event.target.value })} />
            </Field>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

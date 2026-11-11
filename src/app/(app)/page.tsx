'use client'

import { AlertTriangle, ArrowRight, ArrowUpRight, Building2, CalendarClock, LayoutGrid, Mail, Plus, ReceiptText, ShieldCheck, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'

import { AppIcon } from '@/components/app-icon'
import { PageHeader, SectionTitle } from '@/components/shell/page-header'
import { Stat } from '@/components/stat'
import { InvitationCard } from '@/components/invitation-card'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SeatBar } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { appMonthly, periodAmount, PRODUCTS, productBySlug } from '@/lib/catalog'
import { findInvite, type Workspace } from '@/lib/demo-data'
import { seatsUsed, useStore } from '@/lib/store'
import { cn, formatDateShort, formatEuro, plural } from '@/lib/utils'

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 18 ? 'Bonjour' : 'Bonsoir'
}

export default function HomePage() {
  const { isOrg, canManage } = useStore()
  if (!isOrg) return <PersonalHome />
  if (!canManage) return <MemberHome />
  return <OrgHome />
}

/** Prochaine échéance : la date de renouvellement la plus proche et le montant facturé ce jour-là. */
function nextCharge(workspace: Workspace) {
  if (!workspace.subscriptions.length) return null
  const team = workspace.kind === 'organization'
  const date = workspace.subscriptions.map((sub) => sub.renews).sort()[0]
  const amount = workspace.subscriptions.filter((sub) => sub.renews === date).reduce((sum, sub) => sum + periodAmount(appMonthly(sub.slug, team, sub.seats), sub.billing), 0)
  return { date, amount }
}

function OpenButton({ name }: { name: string }) {
  const toast = useToast()
  return (
    <Button variant="secondary" onClick={() => toast(`Ouverture de ${name}…`, { tone: 'info', text: 'Le logiciel s’ouvre dans un nouvel onglet.' })}>
      Ouvrir <ArrowUpRight />
    </Button>
  )
}

// ------------------------------------------------------------------ Compte personnel
function PersonalHome() {
  const { state, workspace, joinOrganization, declineInvite } = useStore()
  const toast = useToast()
  const orgs = state.workspaces.filter((item) => item.kind === 'organization')
  const invites = state.pendingInvites.filter((token) => findInvite(token))
  const pro = workspace.subscriptions
  const charge = nextCharge(workspace)

  return (
    <>
      <PageHeader
        eyebrow={<span className="inline-block first-letter:uppercase">{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>}
        title={`${greeting()}, ${state.user.firstName}.`}
        description="Vos logiciels, vos abonnements et vos factures, au même endroit."
        actions={
          <ButtonLink href="/souscrire" variant="accent">
            <Plus /> Ajouter un logiciel
          </ButtonLink>
        }
      />

      {invites.length > 0 && (
        <section className="mb-10">
          <SectionTitle>Invitation en attente</SectionTitle>
          <div className="space-y-3">
            {invites.map((token) => (
              <InvitationCard key={token} invitation={findInvite(token)!} className="bento ring-0">
                <Button
                  variant="ghost"
                  onClick={() => {
                    declineInvite(token)
                    toast('Invitation refusée')
                  }}
                >
                  Refuser
                </Button>
                <Button
                  onClick={() => {
                    joinOrganization(token)
                    toast(`Bienvenue chez ${findInvite(token)!.name}`, { text: 'Vos logiciels sont prêts.' })
                  }}
                >
                  Accepter l’invitation <ArrowRight />
                </Button>
              </InvitationCard>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Logiciels Pro" icon={<LayoutGrid />} href="/logiciels" value={`${pro.length} sur ${PRODUCTS.length}`} detail={pro.length ? pro.map((sub) => productBySlug(sub.slug)?.name).join(', ') : 'Tous en version gratuite'} />
        <Stat label="Prochaine échéance" icon={<CalendarClock />} href="/factures" value={charge ? formatDateShort(charge.date) : '—'} detail={charge ? `${formatEuro(charge.amount)} prélevés` : 'Aucun abonnement en cours'} />
        <Stat label="Organisations" icon={<Building2 />} href="/organisation" value={orgs.length} detail={orgs.length ? orgs.map((org) => org.name).join(', ') : 'Aucune pour l’instant'} />
      </div>
    </>
  )
}

// ------------------------------------------------------------------ Organisation (administrateur)
function OrgHome() {
  const { state, workspace } = useStore()
  const charge = nextCharge(workspace)
  const totalSeats = workspace.subscriptions.reduce((sum, sub) => sum + sub.seats, 0)
  const usedSeats = workspace.subscriptions.reduce((sum, sub) => sum + seatsUsed(workspace, sub.slug), 0)
  const active = workspace.members.filter((member) => member.status === 'active').length
  const invited = workspace.members.length - active
  const monthly = workspace.subscriptions.reduce((sum, sub) => sum + appMonthly(sub.slug, true, sub.seats), 0)
  const tight = workspace.subscriptions.filter((sub) => seatsUsed(workspace, sub.slug) / sub.seats >= 0.9)
  const empty = workspace.subscriptions.length === 0

  return (
    <>
      <PageHeader
        eyebrow={workspace.name}
        title={`${greeting()}, ${state.user.firstName}.`}
        description={empty ? 'Votre organisation est prête. Trois étapes et vos membres pourront travailler.' : 'Voici l’essentiel de votre organisation aujourd’hui.'}
        actions={
          <>
            <ButtonLink href="/membres?inviter=1" variant="secondary">
              <UserPlus /> Inviter
            </ButtonLink>
            <ButtonLink href="/souscrire" variant="accent">
              <Plus /> Ajouter un logiciel
            </ButtonLink>
          </>
        }
      />

      {empty ? (
        <Onboarding />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Places attribuées" value={`${usedSeats} / ${totalSeats}`} detail={<SeatBar used={usedSeats} total={totalSeats} className="mt-2" />} icon={<LayoutGrid />} href="/logiciels" />
            <Stat label="Membres" value={workspace.members.length} detail={`${active} actifs · ${invited} invitation${invited > 1 ? 's' : ''} en attente`} icon={<Users />} href="/membres" />
            <Stat label="Coût mensuel" value={formatEuro(monthly)} detail="Remises de volume comprises" icon={<ReceiptText />} href="/factures" />
            <Stat label="Prochaine échéance" value={charge ? formatDateShort(charge.date) : '—'} detail={charge ? `${formatEuro(charge.amount)} · bon de commande` : undefined} icon={<CalendarClock />} href="/factures" />
          </div>

          {(tight.length > 0 || invited > 0) && (
            <div className="mt-6 space-y-2">
              {tight.map((sub) => {
                const product = productBySlug(sub.slug)!
                const used = seatsUsed(workspace, sub.slug)
                return (
                  <div key={sub.slug} className="flex flex-col gap-3 rounded-2xl bg-warning-soft px-4 py-3 sm:flex-row sm:items-center">
                    <AlertTriangle className="size-4 shrink-0 text-warning" />
                    <p className="flex-1 text-[0.88rem]">
                      <span className="font-medium">{product.name}</span> est presque complet : {used} places sur {sub.seats} sont attribuées.
                    </p>
                    <ButtonLink href={`/logiciels/${sub.slug}`} variant="secondary">
                      Ajouter des places
                    </ButtonLink>
                  </div>
                )
              })}
              {invited > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl bg-accent-soft/70 px-4 py-3 sm:flex-row sm:items-center">
                  <Mail className="size-4 shrink-0 text-accent" />
                  <p className="flex-1 text-[0.88rem]">
                    <span className="font-medium">{plural(invited, 'invitation')}</span> {invited > 1 ? 'attendent' : 'attend'} encore une réponse.
                  </p>
                  <ButtonLink href="/membres?statut=invited" variant="secondary">
                    Voir et relancer
                  </ButtonLink>
                </div>
              )}
            </div>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section>
              <SectionTitle
                action={
                  <Link href="/logiciels" className="text-[0.85rem] text-muted hover:text-fg">
                    Tout gérer
                  </Link>
                }
              >
                Logiciels et places
              </SectionTitle>
              <Card className="divide-y divide-line">
                {workspace.subscriptions.map((sub) => {
                  const product = productBySlug(sub.slug)!
                  const used = seatsUsed(workspace, sub.slug)
                  return (
                    <Link key={sub.slug} href={`/logiciels/${sub.slug}`} className="flex items-center gap-4 px-5 py-4 transition-colors first:rounded-t-[inherit] last:rounded-b-[inherit] hover:bg-fg/[0.02]">
                      <span className="size-10 shrink-0">
                        <AppIcon product={product} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-[0.82rem] text-muted tabular-nums">
                            {used} / {sub.seats} places
                          </p>
                        </div>
                        <SeatBar used={used} total={sub.seats} className="mt-2" />
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted" />
                    </Link>
                  )
                })}
              </Card>
            </section>

            <section>
              <SectionTitle>Activité récente</SectionTitle>
              <Card className="p-5">
                <ul className="space-y-4">
                  {[
                    { icon: UserPlus, text: 'Sophie Lambert a rejoint Figue', when: 'Il y a 2 h' },
                    { icon: LayoutGrid, text: '8 places ajoutées sur Myrtille', when: 'Hier' },
                    { icon: Mail, text: '12 élèves invités dans BTS SIO 2', when: '6 nov.' },
                    { icon: ShieldCheck, text: 'SSO activé pour @lycee-jeanmoulin.fr', when: '2 nov.' },
                    { icon: ReceiptText, text: 'Facture ED-2026-01-0311 réglée', when: '12 janv.' },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3 text-[0.88rem]">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg/[0.05] text-muted">
                        <item.icon className="size-3.5" />
                      </span>
                      <span className="flex-1 pt-0.5">{item.text}</span>
                      <span className="pt-0.5 text-[0.78rem] whitespace-nowrap text-muted">{item.when}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </div>
        </>
      )}
    </>
  )
}

function Onboarding() {
  const { workspace } = useStore()
  const steps = [
    { done: true, title: 'Créer l’organisation', text: `${workspace.name} est prête.`, href: '/organisation', cta: 'Compléter le profil' },
    { done: workspace.subscriptions.length > 0, title: 'Choisir vos logiciels', text: 'Sélectionnez les logiciels et le nombre de places.', href: '/souscrire', cta: 'Configurer l’offre' },
    { done: workspace.members.length > 1, title: 'Inviter vos membres', text: 'Par e-mail, par fichier CSV ou avec un lien sécurisé.', href: '/membres?inviter=1', cta: 'Inviter' },
  ]
  const current = steps.findIndex((step) => !step.done)
  return (
    <Card className="overflow-hidden">
      <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((step, index) => (
          <div key={step.title} className={cn('p-6', index === current && 'bg-accent-soft/40')}>
            <span className={cn('grid size-8 place-items-center rounded-full text-[0.85rem] font-semibold', step.done ? 'bg-success text-white dark:text-black' : index === current ? 'bg-fg text-bg' : 'bg-fg/[0.07] text-muted')}>{step.done ? '✓' : index + 1}</span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1 text-[0.88rem] text-muted">{step.text}</p>
            <ButtonLink href={step.href} variant={index === current ? 'primary' : 'secondary'} className="mt-4">
              {step.cta}
            </ButtonLink>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ------------------------------------------------------------------ Organisation (membre)
function MemberHome() {
  const { state, workspace, myApps } = useStore()
  return (
    <>
      <PageHeader eyebrow={workspace.name} title={`${greeting()}, ${state.user.firstName}.`} description={`Les logiciels mis à votre disposition par ${workspace.name}.`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {myApps.map((slug) => {
          const product = productBySlug(slug)!
          return (
            <Card key={slug} className="flex items-center gap-4 p-5">
              <span className="size-14 shrink-0">
                <AppIcon product={product} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[1.05rem] font-semibold">{product.name}</p>
                  <Badge tone="accent">Pro</Badge>
                </div>
                <p className="truncate text-[0.85rem] text-muted">{product.tagline}</p>
              </div>
              <OpenButton name={product.name} />
            </Card>
          )
        })}
      </div>
    </>
  )
}

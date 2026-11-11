'use client'

import { AtSign, Building2, Inbox, LockKeyhole, LogOut, Plus, ShieldCheck, Trash2, UserRoundCog, Users, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { NewGroupDialog } from '@/components/members/new-group-dialog'
import { SsoDialog } from '@/components/sso-dialog'
import { CreateOrgDialog, InvitationsDialog } from '@/components/org-dialogs'
import { PageHeader, SectionTitle } from '@/components/shell/page-header'
import { roleLabel } from '@/components/shell/workspace-switcher'
import { WorkspaceBadge } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { ORG_TYPES } from '@/lib/catalog'
import { ssoProvider } from '@/lib/sso'
import { useStore } from '@/lib/store'
import { cn, plural } from '@/lib/utils'

export default function OrganisationPage() {
  const { isOrg, canManage } = useStore()
  if (!isOrg) return <PersonalOrgs />
  if (!canManage) return <MemberOrg />
  return <OrgSettings />
}

// ------------------------------------------------------------------ Compte personnel : mes organisations
function PersonalOrgs() {
  const { state, switchWorkspace, leaveWorkspace } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [dialog, setDialog] = useState<'create' | 'join' | null>(null)
  const orgs = state.workspaces.filter((item) => item.kind === 'organization')

  return (
    <>
      <PageHeader
        title="Organisations"
        description="Une organisation regroupe les logiciels, les places et les membres d’un établissement ou d’une équipe."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog('join')}>
              <Inbox /> Invitations reçues
              {state.pendingInvites.length > 0 && <span className="-mr-1 grid size-5 place-items-center rounded-full bg-accent text-[0.7rem] font-semibold text-accent-fg">{state.pendingInvites.length}</span>}
            </Button>
            <Button variant="accent" onClick={() => setDialog('create')}>
              <Plus /> Créer une organisation
            </Button>
          </>
        }
      />

      <SectionTitle>Vos organisations</SectionTitle>
      {orgs.length ? (
        <Card className="divide-y divide-line">
          {orgs.map((org) => (
            <div key={org.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <WorkspaceBadge name={org.name} color={org.color} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{org.name}</p>
                <p className="text-[0.82rem] text-muted">
                  {org.orgType} · {roleLabel(org)} · {plural(org.members.length, 'membre')}
                </p>
              </div>
              {org.role !== 'owner' && (
                <Button
                  variant="danger-ghost"
                  onClick={() => {
                    leaveWorkspace(org.id)
                    toast(`Vous avez quitté ${org.name}`)
                  }}
                >
                  Quitter
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  switchWorkspace(org.id)
                  router.push('/')
                }}
              >
                Ouvrir
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-6 text-[0.9rem] text-muted">Vous ne faites partie d’aucune organisation pour l’instant.</Card>
      )}
      <CreateOrgDialog open={dialog === 'create'} onOpenChange={(open) => setDialog(open ? 'create' : null)} />
      <InvitationsDialog open={dialog === 'join'} onOpenChange={(open) => setDialog(open ? 'join' : null)} />
    </>
  )
}

// ------------------------------------------------------------------ Organisation : membre
function MemberOrg() {
  const { workspace, leaveWorkspace } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const me = workspace.members.find((member) => member.id === 'm-me')
  return (
    <>
      <PageHeader title="Mon organisation" />
      <Card>
        <div className="flex items-center gap-4 p-5 sm:p-6">
          <WorkspaceBadge name={workspace.name} color={workspace.color} className="size-12 rounded-[14px] text-[0.9rem]" />
          <div className="min-w-0">
            <p className="truncate text-[1.05rem] leading-snug font-semibold">{workspace.name}</p>
            <p className="truncate text-[0.85rem] text-muted">{[workspace.orgType, workspace.city].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <dl className="mx-5 divide-y divide-line border-t border-line sm:mx-6">
          {[
            ['Votre rôle', roleLabel(workspace)],
            ['Groupe', me?.group ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3.5 text-[0.9rem]">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">
          <Button variant="danger-ghost" onClick={() => setConfirm(true)} className="-mr-3">
            <LogOut /> Quitter
          </Button>
        </div>
      </Card>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          title={`Quitter ${workspace.name} ?`}
          description="Vous perdrez l’accès aux logiciels fournis par l’établissement. Il faudra une nouvelle invitation pour revenir."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  leaveWorkspace(workspace.id)
                  toast(`Vous avez quitté ${workspace.name}`)
                  router.push('/')
                }}
              >
                Quitter
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  )
}

// ------------------------------------------------------------------ Organisation : réglages (admin)
const COLORS = ['#0e7490', '#4f5bd5', '#7c4dcc', '#5f9e1f', '#c2410c', '#be185d', '#1a1a19']

function OrgSettings() {
  const { workspace, updateWorkspace, leaveWorkspace } = useStore()
  const router = useRouter()
  const toast = useToast()
  const initialForm = { name: workspace.name, orgType: workspace.orgType ?? ORG_TYPES[0], uai: workspace.uai ?? '', city: workspace.city ?? '', domain: workspace.domain ?? '', color: workspace.color }
  const [form, setForm] = useState(initialForm)
  const [groupOpen, setGroupOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [ssoOpen, setSsoOpen] = useState(false)
  const sso = workspace.sso
  // Groupe qu'on a voulu supprimer alors qu'il contient encore des membres.
  const [blockedGroup, setBlockedGroup] = useState<{ name: string; count: number } | null>(null)
  const [deleteText, setDeleteText] = useState('')
  const dirty = (Object.keys(initialForm) as (keyof typeof initialForm)[]).some((key) => form[key] !== initialForm[key])

  return (
    <>
      <PageHeader title="Organisation" description="Identité, connexion des membres et groupes." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Identité" description="Visible par vos membres et sur vos factures." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <WorkspaceBadge name={form.name || '?'} color={form.color} className="size-14 rounded-2xl text-base" />
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur de l’organisation">
                {COLORS.map((color) => (
                  <button key={color} type="button" role="radio" aria-checked={form.color === color} aria-label={color} onClick={() => setForm({ ...form, color })} className={cn('size-7 rounded-full ring-offset-2 ring-offset-card transition-shadow', form.color === color && 'ring-2 ring-fg')} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="o-name">
                <Input id="o-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="Type" htmlFor="o-type">
                <Select id="o-type" value={form.orgType} onValueChange={(value) => setForm({ ...form, orgType: value })} options={ORG_TYPES.map((item) => ({ value: item, label: item }))} />
              </Field>
              <Field label="Code UAI / RNE" htmlFor="o-uai" hint="Pour les établissements scolaires.">
                <Input id="o-uai" placeholder="0350029K" value={form.uai} onChange={(event) => setForm({ ...form, uai: event.target.value.toUpperCase() })} className="font-mono" />
              </Field>
              <Field label="Ville" htmlFor="o-city">
                <Input id="o-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              </Field>
              <Field label="Domaine e-mail" htmlFor="o-domain" hint="Sert à reconnaître vos membres." className="sm:col-span-2">
                <Input id="o-domain" placeholder="mon-lycee.fr" value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" disabled={!dirty} onClick={() => setForm(initialForm)}>
              Annuler
            </Button>
            <Button
              disabled={!dirty || !form.name.trim()}
              onClick={() => {
                updateWorkspace({ ...form, name: form.name.trim() })
                toast('Organisation mise à jour')
              }}
            >
              Enregistrer
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader title="Connexion des membres" description="Comment vos élèves et enseignants se connectent." />
          <CardBody className="divide-y divide-line py-0">
            {/* Authentification unique : fournisseur, protocole, domaines ; la configuration se fait dans la fenêtre dédiée. */}
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[0.92rem] font-medium">
                    Authentification unique (SSO)
                    {sso?.status === 'active' ? <Badge tone="success">Actif</Badge> : sso ? <Badge tone="neutral">Désactivé</Badge> : <Badge tone="neutral">Non configuré</Badge>}
                  </p>
                  <p className="truncate text-[0.82rem] text-muted">
                    {sso ? `${ssoProvider(sso.provider).name} · ${ssoProvider(sso.provider).protocol} · ${sso.domains.filter((item) => item.verified).map((item) => `@${item.name}`).join(', ') || 'aucun domaine vérifié'}` : 'Microsoft Entra ID, Google Workspace, Okta, SAML 2.0, OpenID Connect, CAS…'}
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setSsoOpen(true)}>
                {sso ? 'Gérer' : 'Configurer'}
              </Button>
            </div>
            <label className={cn('flex items-center justify-between gap-4 py-4', sso?.status !== 'active' && 'opacity-50')}>
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <p className="text-[0.92rem] font-medium">Imposer le SSO</p>
                  <p className="text-[0.82rem] text-muted">{sso?.status === 'active' ? `Les membres ${sso.domains.filter((item) => item.verified).map((item) => `@${item.name}`).join(', ')} ne peuvent plus se connecter par mot de passe.` : 'Disponible une fois le SSO actif.'}</p>
                </div>
              </div>
              <Switch
                checked={Boolean(sso?.enforced && sso.status === 'active')}
                disabled={sso?.status !== 'active'}
                onCheckedChange={(value) => {
                  if (!sso) return
                  updateWorkspace({ sso: { ...sso, enforced: value } })
                  toast(value ? 'SSO imposé' : 'Mot de passe de nouveau autorisé')
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <AtSign className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-[0.92rem] font-medium">
                    Adhésion automatique{workspace.domain ? ` @${workspace.domain}` : ''} {workspace.domainJoin && <Badge tone="success">Activée</Badge>}
                  </p>
                  <p className="text-[0.82rem] text-muted">Les adresses de votre domaine rejoignent l’organisation sans invitation.</p>
                </div>
              </div>
              <Switch
                checked={workspace.domainJoin}
                onCheckedChange={(value) => {
                  updateWorkspace({ domainJoin: value })
                  toast(`Adhésion automatique ${value ? 'activée' : 'désactivée'}`)
                }}
              />
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Groupes et classes"
            description="Pour filtrer les membres et attribuer des places d’un coup."
            action={
              <Button variant="secondary" onClick={() => setGroupOpen(true)}>
                <Plus /> Nouveau groupe
              </Button>
            }
          />
          <CardBody>
            <ul className="flex flex-wrap gap-2">
              {workspace.groups.map((group) => {
                const count = workspace.members.filter((member) => member.group === group).length
                return (
                  <li
                    key={group}
                    className="flex h-8 items-center gap-2 rounded-full bg-bg-alt pr-1.5 pl-3 text-[0.85rem]"
                  >
                    <Users className="size-3.5 text-muted" />
                    {group}
                    <span className="text-[0.75rem] text-muted">{count}</span>
                    <button
                      type="button"
                      aria-label={`Supprimer le groupe ${group}`}
                      title="Supprimer"
                      onClick={() => {
                        if (count > 0) return setBlockedGroup({ name: group, count })
                        updateWorkspace({ groups: workspace.groups.filter((item) => item !== group) })
                        toast(`Groupe « ${group} » supprimé`)
                      }}
                      className="grid size-5 place-items-center rounded-full text-muted hover:bg-fg/10 hover:text-fg"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <NewGroupDialog open={groupOpen} onOpenChange={setGroupOpen} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Propriété et suppression" description="Transférez la propriété à un autre administrateur avant de partir." />
          <CardBody className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => toast('Demande de transfert envoyée', { tone: 'info', text: 'Le nouvel administrateur doit l’accepter.' })}>
              <UserRoundCog /> Transférer la propriété
            </Button>
            <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Supprimer l’organisation
            </Button>
          </CardBody>
        </Card>
      </div>

      <SsoDialog key={ssoOpen ? 'open' : 'closed'} open={ssoOpen} onOpenChange={setSsoOpen} />

      <Dialog open={blockedGroup !== null} onOpenChange={(open) => !open && setBlockedGroup(null)}>
        <DialogContent
          className="max-w-md"
          title="Videz d’abord le groupe"
          description={blockedGroup ? `${plural(blockedGroup.count, 'membre')} ${blockedGroup.count > 1 ? 'font' : 'fait'} encore partie de « ${blockedGroup.name} ». Déplacez-les dans un autre groupe, puis supprimez-le.` : undefined}
          footer={
            <>
              <Button variant="ghost" onClick={() => setBlockedGroup(null)}>
                Fermer
              </Button>
              {blockedGroup && (
                <ButtonLink href={`/membres?groupe=${encodeURIComponent(blockedGroup.name)}`}>
                  <Users /> Voir les membres
                </ButtonLink>
              )}
            </>
          }
        />
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent
          title="Supprimer l’organisation ?"
          description={`Les ${workspace.members.length} membres perdent leur accès et les abonnements sont résiliés. Cette action est définitive.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                disabled={deleteText !== workspace.name}
                onClick={() => {
                  leaveWorkspace(workspace.id)
                  toast('Organisation supprimée')
                  router.push('/')
                }}
              >
                Supprimer définitivement
              </Button>
            </>
          }
        >
          <Field label={`Tapez « ${workspace.name} » pour confirmer`} htmlFor="confirm-name">
            <Input id="confirm-name" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} />
          </Field>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-[0.82rem] text-danger">
            <Building2 className="mt-0.5 size-4 shrink-0" />
            Les projets créés par les membres restent dans leurs comptes personnels.
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

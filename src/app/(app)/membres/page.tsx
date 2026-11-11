'use client'

import { Download, Filter, MoreHorizontal, Search, Send, Trash2, UserCog, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import { InviteDialog } from '@/components/members/invite-dialog'
import { NewGroupDialog } from '@/components/members/new-group-dialog'
import { PageHeader } from '@/components/shell/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from '@/components/ui/menu'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { productBySlug, ROLES, type Role } from '@/lib/catalog'
import type { Member } from '@/lib/demo-data'
import { seatsUsed, useStore } from '@/lib/store'
import { cn, formatDateShort, plural } from '@/lib/utils'

export default function MembersPage() {
  return (
    <Suspense>
      <Members />
    </Suspense>
  )
}

type RoleFilter = 'all' | Role
type StatusFilter = 'all' | 'active' | 'invited'

function Members() {
  const params = useSearchParams()
  const router = useRouter()
  const { workspace, isOrg, canManage, removeMembers, toggleMemberApp, updateMember } = useStore()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(params.get('inviter') === '1')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>((params.get('statut') as StatusFilter) ?? 'all')
  const [group, setGroup] = useState(() => {
    const wanted = params.get('groupe')
    return wanted && workspace.groups.includes(wanted) ? wanted : 'all'
  })
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Member | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string[] | null>(null)

  useEffect(() => {
    if (!isOrg || !canManage) router.replace('/')
  }, [isOrg, canManage, router])

  const members = useMemo(
    () =>
      workspace.members.filter(
        (member) =>
          (role === 'all' || member.role === role) &&
          (status === 'all' || member.status === status) &&
          (group === 'all' || member.group === group) &&
          `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [workspace.members, role, status, group, query],
  )

  if (!isOrg || !canManage) return null

  const allIn = members.length > 0 && members.every((member) => selected.includes(member.id))
  const counts = {
    student: workspace.members.filter((member) => member.role === 'student').length,
    teacher: workspace.members.filter((member) => member.role === 'teacher').length,
    admin: workspace.members.filter((member) => member.role === 'admin').length,
  }
  const filtered = role !== 'all' || status !== 'all' || group !== 'all' || query

  const bulkApp = (slug: string, on: boolean) => {
    const sub = workspace.subscriptions.find((item) => item.slug === slug)!
    const targets = workspace.members.filter((member) => selected.includes(member.id) && member.apps.includes(slug) !== on).map((member) => member.id)
    const left = sub.seats - seatsUsed(workspace, slug)
    const ids = on ? targets.slice(0, Math.max(0, left)) : targets
    toggleMemberApp(ids, slug, on)
    const name = productBySlug(slug)?.name
    if (on && ids.length < targets.length) toast(`${plural(ids.length, 'place attribuée')} sur ${name}`, { tone: 'warning', text: `${targets.length - ids.length} membres sans place : ajoutez-en depuis la page du logiciel.` })
    else toast(on ? `${name} attribué à ${plural(ids.length, 'membre')}` : `Accès à ${name} retiré à ${plural(ids.length, 'membre')}`)
  }

  return (
    <>
      <PageHeader
        title="Membres"
        description={`${plural(workspace.members.length, 'membre')} dans ${workspace.name} : ${counts.student} élèves, ${counts.teacher} enseignants, ${counts.admin} admin.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => toast('Export CSV téléchargé', { text: `${workspace.members.length} lignes.` })}>
              <Download /> Exporter
            </Button>
            <Button variant="accent" onClick={() => setInviteOpen(true)}>
              <UserPlus /> Ajouter des membres
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Rechercher par nom ou e-mail" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-10" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<RoleFilter>
            size="sm"
            label="Rôle"
            value={role}
            onChange={setRole}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'student', label: 'Élèves' },
              { value: 'teacher', label: 'Enseignants' },
              { value: 'admin', label: 'Admins' },
            ]}
          />
          <Select size="sm" aria-label="Groupe" value={group} onValueChange={setGroup} className="w-auto min-w-40" options={[{ value: 'all', label: 'Tous les groupes' }, ...workspace.groups.map((item) => ({ value: item, label: item }))]} />
          <Select size="sm" aria-label="Statut" value={status} onValueChange={(value) => setStatus(value as StatusFilter)} className="w-auto min-w-40" options={[{ value: 'all', label: 'Tous les statuts' }, { value: 'active', label: 'Actifs' }, { value: 'invited', label: 'Invitations en attente' }]} />
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => {
                setRole('all')
                setStatus('all')
                setGroup('all')
                setQuery('')
              }}
            >
              <X /> Effacer
            </Button>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-[4.75rem] z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-fg px-4 py-2.5 text-bg shadow-lg">
          <p className="mr-auto text-[0.88rem] font-medium">{plural(selected.length, 'sélectionné')}</p>
          <Menu>
            <MenuTrigger asChild>
              <Button className="bg-bg/15 text-bg hover:bg-bg/25">
                Logiciels
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuSub>
                <MenuSubTrigger>
                  <UserPlus /> Attribuer une place
                </MenuSubTrigger>
                <MenuSubContent>
                  {workspace.subscriptions.map((sub) => {
                    const free = sub.seats - seatsUsed(workspace, sub.slug)
                    // Membres sélectionnés qui n'ont pas encore ce logiciel : s'il n'y en a aucun, rien à attribuer.
                    const missing = workspace.members.filter((member) => selected.includes(member.id) && !member.apps.includes(sub.slug)).length
                    return (
                      <MenuItem key={sub.slug} disabled={missing === 0 || free <= 0} onSelect={() => bulkApp(sub.slug, true)}>
                        <span className="size-6 shrink-0">
                          <AppIcon product={productBySlug(sub.slug)!} />
                        </span>
                        {productBySlug(sub.slug)?.name}
                        <span className="ml-auto pl-4 text-[0.75rem] text-muted tabular-nums">{missing === 0 ? 'Déjà attribué' : free > 0 ? plural(free, 'place libre', 'places libres') : 'Complet'}</span>
                      </MenuItem>
                    )
                  })}
                </MenuSubContent>
              </MenuSub>
              <MenuSub>
                <MenuSubTrigger>
                  <UserMinus /> Retirer l’accès
                </MenuSubTrigger>
                <MenuSubContent>
                  {workspace.subscriptions.map((sub) => {
                    const holders = workspace.members.filter((member) => selected.includes(member.id) && member.apps.includes(sub.slug)).length
                    return (
                      <MenuItem key={sub.slug} disabled={holders === 0} onSelect={() => bulkApp(sub.slug, false)}>
                        <span className="size-6 shrink-0">
                          <AppIcon product={productBySlug(sub.slug)!} />
                        </span>
                        {productBySlug(sub.slug)?.name}
                        <span className="ml-auto pl-4 text-[0.75rem] text-muted tabular-nums">{holders > 0 ? plural(holders, 'accès', 'accès') : 'Aucun accès'}</span>
                      </MenuItem>
                    )
                  })}
                </MenuSubContent>
              </MenuSub>
            </MenuContent>
          </Menu>
          <Menu>
            <MenuTrigger asChild>
              <Button className="bg-bg/15 text-bg hover:bg-bg/25">
                Groupe
              </Button>
            </MenuTrigger>
            <MenuContent>
              {workspace.groups.map((item) => (
                <MenuItem
                  key={item}
                  onSelect={() => {
                    selected.forEach((id) => updateMember(id, { group: item }))
                    toast(`${plural(selected.length, 'membre déplacé')} dans ${item}`)
                  }}
                >
                  <Users /> {item}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          <Button className="bg-bg/15 text-bg hover:bg-bg/25" onClick={() => toast(`Invitations renvoyées`, { text: plural(workspace.members.filter((member) => selected.includes(member.id) && member.status === 'invited').length, 'e-mail') })}>
            <Send /> Relancer
          </Button>
          <Button className="bg-bg/15 text-bg hover:bg-danger" onClick={() => setConfirmRemove(selected.filter((id) => id !== 'm-me'))}>
            <Trash2 /> Retirer
          </Button>
          <Button size="icon-sm" className="text-bg hover:bg-bg/15" aria-label="Désélectionner" onClick={() => setSelected([])}>
            <X />
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[2rem_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_6rem_2.5rem] items-center gap-4 border-b border-line bg-card-alt/60 px-5 py-2.5 text-[0.78rem] font-medium text-muted md:grid">
          <Checkbox aria-label="Tout sélectionner" checked={allIn ? true : selected.length ? 'indeterminate' : false} onCheckedChange={() => setSelected(allIn ? [] : members.map((member) => member.id))} />
          <span>Membre</span>
          <span>Rôle</span>
          <span>Groupe</span>
          <span>Logiciels</span>
          <span>Activité</span>
          <span />
        </div>
        {members.length === 0 ? (
          <EmptyState icon={<Filter />} title="Aucun membre ne correspond" text="Modifiez la recherche ou les filtres." />
        ) : (
          <ul className="divide-y divide-line">
            {members.map((member) => (
              <li key={member.id} className={cn('grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors md:grid-cols-[2rem_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_6rem_2.5rem]', selected.includes(member.id) && 'bg-accent-soft/40')}>
                <Checkbox aria-label={`Sélectionner ${member.name}`} checked={selected.includes(member.id)} onCheckedChange={() => setSelected((prev) => (prev.includes(member.id) ? prev.filter((id) => id !== member.id) : [...prev, member.id]))} />
                <button type="button" onClick={() => setEditing(member)} className="flex min-w-0 items-center gap-3 text-left">
                  <Avatar name={member.name} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 truncate text-[0.88rem] font-medium">
                      {member.name}
                      {member.id === 'm-me' && <span className="font-normal text-muted">(vous)</span>}
                      {member.status === 'invited' && <Badge tone="warning">Invité</Badge>}
                    </span>
                    <span className="block truncate text-[0.78rem] text-muted">{member.email}</span>
                  </span>
                </button>
                <span className="hidden text-[0.85rem] md:block">{ROLES[member.role].short}</span>
                <span className="hidden truncate text-[0.85rem] text-muted md:block">{member.group}</span>
                <span className="col-start-2 flex -space-x-1 md:col-start-auto">
                  {member.apps.length ? (
                    member.apps.map((slug) => (
                      <span key={slug} className="size-6 rounded-[7px] ring-2 ring-card" title={productBySlug(slug)?.name}>
                        <AppIcon product={productBySlug(slug)!} />
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.8rem] text-muted">Aucun</span>
                  )}
                </span>
                <span className="hidden text-[0.8rem] text-muted md:block">{member.lastSeen ? (member.lastSeen === '2026-11-10' ? 'Aujourd’hui' : formatDateShort(member.lastSeen)) : '—'}</span>
                <Menu>
                  <MenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label={`Actions pour ${member.name}`} className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto">
                      <MoreHorizontal />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem onSelect={() => setEditing(member)}>
                      <UserCog /> Modifier rôle et accès
                    </MenuItem>
                    {member.status === 'invited' && (
                      <MenuItem onSelect={() => toast(`Invitation renvoyée à ${member.email}`)}>
                        <Send /> Renvoyer l’invitation
                      </MenuItem>
                    )}
                    {member.id !== 'm-me' && (
                      <>
                        <MenuSeparator />
                        <MenuItem danger onSelect={() => setConfirmRemove([member.id])}>
                          <Trash2 /> Retirer de l’organisation
                        </MenuItem>
                      </>
                    )}
                  </MenuContent>
                </Menu>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {workspace.subscriptions.length === 0 && (
        <p className="mt-4 text-[0.85rem] text-muted">
          Aucun logiciel pour l’instant : <ButtonLink href="/souscrire" variant="link">souscrivez</ButtonLink> pour attribuer des places à vos membres.
        </p>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <MemberDialog member={editing} onClose={() => setEditing(null)} />
      <Dialog open={confirmRemove !== null} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent
          title={`Retirer ${confirmRemove?.length === 1 ? 'ce membre' : plural(confirmRemove?.length ?? 0, 'membre')} ?`}
          description="Leurs places sont libérées immédiatement. Leurs projets restent dans leur compte personnel."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmRemove(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  removeMembers(confirmRemove ?? [])
                  toast(`${plural(confirmRemove?.length ?? 0, 'membre retiré')}`)
                  setSelected([])
                  setConfirmRemove(null)
                }}
              >
                Retirer
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  )
}

function MemberDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { workspace, updateMember } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<Member | null>(member)
  const [lastId, setLastId] = useState<string | null>(null)
  const [groupOpen, setGroupOpen] = useState(false)
  const [fresh, setFresh] = useState(false)
  // Recharge le brouillon quand on ouvre un autre membre.
  if (member && member.id !== lastId) {
    setLastId(member.id)
    setDraft(member)
  }
  if (!member && lastId !== null) setLastId(null)

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      {draft && (
        <DialogContent
          title={draft.name}
          description={draft.email}
          footer={
            <>
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  updateMember(draft.id, { role: draft.role, group: draft.group, apps: draft.apps })
                  toast('Modifications enregistrées')
                  onClose()
                }}
              >
                Enregistrer
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rôle" htmlFor="m-role" hint={ROLES[draft.role].text}>
                <Select id="m-role" value={draft.role} disabled={draft.id === 'm-me'} onValueChange={(value) => setDraft({ ...draft, role: value as Role })} options={(Object.keys(ROLES) as Role[]).map((key) => ({ value: key, label: ROLES[key].label, description: ROLES[key].text }))} />
              </Field>
              <Field label="Groupe" htmlFor="m-group">
                <Select id="m-group" value={draft.group} onValueChange={(value) => setDraft({ ...draft, group: value })} className={cn('transition-[box-shadow,background-color] duration-500', fresh && 'bg-accent-soft/50 ring-2 ring-accent')} options={workspace.groups.map((item) => ({ value: item, label: item }))} action={{ label: 'Nouveau groupe…', onSelect: () => setGroupOpen(true) }} />
                <NewGroupDialog
                  open={groupOpen}
                  onOpenChange={setGroupOpen}
                  onCreated={(created) => {
                    setDraft({ ...draft, group: created })
                    setFresh(true)
                    window.setTimeout(() => setFresh(false), 1600)
                  }}
                />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[0.85rem] font-medium">Accès aux logiciels</p>
              {workspace.subscriptions.length ? (
                <ul className="divide-y divide-line rounded-2xl ring-1 ring-line ring-inset">
                  {workspace.subscriptions.map((sub) => {
                    const product = productBySlug(sub.slug)!
                    const had = member?.apps.includes(sub.slug)
                    const on = draft.apps.includes(sub.slug)
                    const left = sub.seats - seatsUsed(workspace, sub.slug) + (had ? 1 : 0)
                    const full = !on && left <= 0
                    return (
                      <li key={sub.slug} className="flex items-center gap-3 px-4 py-3">
                        <span className="size-8 shrink-0">
                          <AppIcon product={product} />
                        </span>
                        <div className="flex-1">
                          <p className="text-[0.9rem] font-medium">{product.name}</p>
                          <p className={cn('text-[0.78rem] text-muted', full && 'text-warning')}>{full ? 'Plus de place libre' : `${left - (on ? 1 : 0)} place${left - (on ? 1 : 0) > 1 ? 's' : ''} libre${left - (on ? 1 : 0) > 1 ? 's' : ''} après`}</p>
                        </div>
                        <Switch aria-label={`Accès à ${product.name}`} checked={on} disabled={full} onCheckedChange={(value) => setDraft({ ...draft, apps: value ? [...draft.apps, sub.slug] : draft.apps.filter((slug) => slug !== sub.slug) })} />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-[0.85rem] text-muted">Aucun logiciel souscrit.</p>
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

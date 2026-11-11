'use client'

import { Check, Download, FileSpreadsheet, Link2, Mail, UploadCloud, UserCog } from 'lucide-react'
import { useState } from 'react'

import { AppIcon } from '@/components/app-icon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { productBySlug, ROLES, type Role } from '@/lib/catalog'
import { seatsUsed, useStore } from '@/lib/store'
import { cn, plural } from '@/lib/utils'

import { InviteLinkPanel } from './invite-link'
import { NewGroupDialog } from './new-group-dialog'

type Mode = 'email' | 'csv' | 'link' | 'managed'

const CSV_SAMPLE = [
  ['Mathilde', 'Rey', 'mathilde.rey'],
  ['Bastien', 'Colin', 'bastien.colin'],
  ['Océane', 'Marchand', 'oceane.marchand'],
  ['Kylian', 'Picard', 'kylian.picard'],
  ['Elsa', 'Barbier', 'elsa.barbier'],
  ['Timéo', 'Renaud', 'timeo.renaud'],
  ['Agathe', 'Lemoine', 'agathe.lemoine'],
  ['Maxime', 'Brun', 'maxime.brun'],
]

/** Ajouter des membres : quatre façons, du plus simple (e-mail) au plus « établissement » (comptes gérés sans e-mail). */
export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { workspace, invite, updateWorkspace } = useStore()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('email')
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [group, setGroup] = useState(workspace.groups.find((item) => item.startsWith('BTS')) ?? workspace.groups[0] ?? '')
  const [groupOpen, setGroupOpen] = useState(false)
  // Groupe tout juste créé : le champ s'éclaire un instant pour montrer qu'il est sélectionné.
  const [fresh, setFresh] = useState(false)
  const [apps, setApps] = useState<string[]>(workspace.subscriptions.slice(0, 1).map((sub) => sub.slug))
  const [file, setFile] = useState(false)
  const [count, setCount] = useState(25)
  const [prefix, setPrefix] = useState('bts1')
  const [generated, setGenerated] = useState(false)

  const domain = workspace.domain ?? 'exemple.fr'
  const parsed = emails
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => /^\S+@\S+\.\S+$/.test(item))
  const people =
    mode === 'email'
      ? parsed.map((email) => ({ email, name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }))
      : mode === 'csv' && file
        ? CSV_SAMPLE.map(([first, last, local]) => ({ name: `${first} ${last}`, email: `${local}@${domain}` }))
        : mode === 'managed' && generated
          ? Array.from({ length: count }, (_, index) => ({ name: `Élève ${String(index + 1).padStart(2, '0')}`, email: `${prefix}.eleve${String(index + 1).padStart(2, '0')}@comptes.edualis.fr` }))
          : []
  const finalGroup = group

  const reset = () => {
    setEmails('')
    setFile(false)
    setGenerated(false)
  }

  const submit = () => {
    if (!people.length) return
    invite(people, role, finalGroup, apps)
    toast(mode === 'managed' ? `${plural(people.length, 'compte créé')}` : `${plural(people.length, 'invitation envoyée')}`, {
      text: mode === 'managed' ? 'Les identifiants sont prêts à imprimer.' : apps.length ? `Avec accès à ${apps.map((slug) => productBySlug(slug)?.name).join(', ')}.` : undefined,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent
        className="max-w-2xl"
        title="Ajouter des membres"
        description="Invitez par e-mail, importez une liste ou créez des comptes pour les élèves sans adresse."
        footer={
          mode === 'link' ? (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <p className="mr-auto text-[0.82rem] text-muted">{people.length ? plural(people.length, 'personne') : 'Personne pour l’instant'}</p>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button disabled={!people.length || !finalGroup} onClick={submit}>
                {mode === 'managed' ? 'Créer les comptes' : 'Envoyer les invitations'}
              </Button>
            </>
          )
        }
      >
        <div role="radiogroup" aria-label="Méthode" className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { value: 'email', icon: Mail, title: 'E-mail', text: 'Coller des adresses' },
              { value: 'csv', icon: FileSpreadsheet, title: 'Fichier', text: 'CSV, Pronote, ENT' },
              { value: 'link', icon: Link2, title: 'Lien sécurisé', text: 'À partager par l’ENT' },
              { value: 'managed', icon: UserCog, title: 'Comptes gérés', text: 'Élèves sans e-mail' },
            ] as const
          ).map((option) => {
            const on = mode === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setMode(option.value)}
                className={cn(
                  'flex flex-col items-start gap-2.5 rounded-2xl bg-card p-3 text-left ring-1 ring-line-strong transition-all ring-inset hover:bg-bg-alt',
                  on && 'bg-accent-soft/50 ring-2 ring-accent hover:bg-accent-soft/50',
                )}
              >
                <span className={cn('grid size-8 place-items-center rounded-xl bg-fg/[0.06] text-muted transition-colors', on && 'bg-accent text-accent-fg')}>
                  <option.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-[0.85rem] leading-tight font-medium">{option.title}</span>
                  <span className="mt-0.5 block text-[0.75rem] leading-tight text-muted">{option.text}</span>
                </span>
              </button>
            )
          })}
        </div>

        {mode === 'email' && (
          <Field label="Adresses e-mail" htmlFor="emails" hint={parsed.length ? `${plural(parsed.length, 'adresse valide', 'adresses valides')}` : 'Séparées par des virgules, des espaces ou des retours à la ligne. Collez directement depuis un tableur.'}>
            <Textarea id="emails" autoFocus placeholder={`lea.martin@${domain}, hugo.petit@${domain}`} value={emails} onChange={(event) => setEmails(event.target.value)} />
          </Field>
        )}

        {mode === 'csv' &&
          (file ? (
            <div className="rounded-2xl ring-1 ring-line ring-inset">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <FileSpreadsheet className="size-4 text-success" />
                <p className="flex-1 text-[0.88rem] font-medium">eleves-bts-sio.csv</p>
                <span className="text-[0.8rem] text-muted">{CSV_SAMPLE.length} lignes · 0 erreur</span>
                <Button variant="ghost" onClick={() => setFile(false)}>
                  Changer
                </Button>
              </div>
              <table className="w-full text-[0.82rem]">
                <thead className="text-muted">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Prénom</th>
                    <th className="px-4 py-2 font-medium">Nom</th>
                    <th className="px-4 py-2 font-medium">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {CSV_SAMPLE.slice(0, 4).map(([first, last, local]) => (
                    <tr key={local} className="border-t border-line">
                      <td className="px-4 py-2">{first}</td>
                      <td className="px-4 py-2">{last}</td>
                      <td className="truncate px-4 py-2 text-muted">
                        {local}@{domain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-line px-4 py-2 text-[0.78rem] text-muted">Et {CSV_SAMPLE.length - 4} autres…</p>
            </div>
          ) : (
            <button type="button" onClick={() => setFile(true)} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-line-strong px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent-soft/30">
              <UploadCloud className="size-6 text-muted" />
              <p className="mt-3 text-[0.92rem] font-medium">Déposez un fichier CSV ou Excel</p>
              <p className="mt-1 text-[0.8rem] text-muted">Colonnes prénom, nom, e-mail. Export Pronote et ENT acceptés.</p>
              <span className="mt-4 text-[0.82rem] font-medium text-accent">Cliquer pour simuler un import</span>
            </button>
          ))}

        {mode === 'link' && (
          <div className="space-y-5">
            <InviteLinkPanel />
            <label className="flex items-center justify-between gap-4 ">
              <span>
                <span className="block text-[0.9rem] font-medium">Rejoindre automatiquement avec une adresse @{domain}</span>
                <span className="block text-[0.8rem] text-muted">Les personnes de votre domaine rejoignent sans validation.</span>
              </span>
              <Switch
                checked={workspace.domainJoin}
                onCheckedChange={(value) => {
                  updateWorkspace({ domainJoin: value })
                  toast(value ? 'Adhésion par domaine activée' : 'Adhésion par domaine désactivée')
                }}
              />
            </label>
          </div>
        )}

        {mode === 'managed' &&
          (generated ? (
            <div className="rounded-2xl ring-1 ring-line ring-inset">
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <UserCog className="size-4 text-accent" />
                <p className="flex-1 text-[0.88rem] font-medium">{plural(count, 'compte')} prêts</p>
                <Button variant="secondary" onClick={() => toast('Fiches d’identifiants téléchargées', { text: 'Une fiche par élève, à découper (PDF).' })}>
                  <Download /> Fiches PDF
                </Button>
              </div>
              <ul className="divide-y divide-line font-mono text-[0.8rem]">
                {Array.from({ length: 3 }, (_, index) => (
                  <li key={index} className="flex justify-between px-4 py-2">
                    <span>
                      {prefix}.eleve{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-muted">{['pomme-lune-42', 'velo-ciel-17', 'note-arbre-08'][index]}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-line px-4 py-2 text-[0.78rem] text-muted">Mot de passe provisoire, à changer à la première connexion.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="rounded-2xl bg-bg-alt p-4 text-[0.85rem] text-muted">Pour les élèves sans adresse e-mail (collège, lycée). Edualis génère un identifiant et un mot de passe provisoire pour chacun, que vous imprimez.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre de comptes" htmlFor="count">
                  <Input id="count" type="number" min={1} max={200} value={count} onChange={(event) => setCount(Math.max(1, Math.min(200, event.target.valueAsNumber || 1)))} />
                </Field>
                <Field label="Préfixe des identifiants" htmlFor="prefix" hint={`Ex. ${prefix || 'classe'}.eleve01`}>
                  <Input id="prefix" value={prefix} onChange={(event) => setPrefix(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
                </Field>
              </div>
              <Button variant="secondary" onClick={() => setGenerated(true)}>
                Générer les identifiants
              </Button>
            </div>
          ))}

        {mode !== 'link' && (
          <div className="mt-6 space-y-4 border-t border-line pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rôle" htmlFor="role">
                <Select id="role" value={role} onValueChange={(value) => setRole(value as Role)} options={(Object.keys(ROLES) as Role[]).map((key) => ({ value: key, label: ROLES[key].label, description: ROLES[key].text }))} />
              </Field>
              <Field label="Groupe ou classe" htmlFor="group">
                <Select id="group" value={group} onValueChange={setGroup} className={cn('transition-[box-shadow,background-color] duration-500', fresh && 'bg-accent-soft/50 ring-2 ring-accent')} options={workspace.groups.map((item) => ({ value: item, label: item }))} action={{ label: 'Nouveau groupe…', onSelect: () => setGroupOpen(true) }} />
              </Field>
            </div>
            <NewGroupDialog
              open={groupOpen}
              onOpenChange={setGroupOpen}
              onCreated={(created) => {
                setGroup(created)
                setFresh(true)
                window.setTimeout(() => setFresh(false), 1600)
              }}
            />
            {workspace.subscriptions.length > 0 && (
              <div>
                <p className="mb-2 text-[0.85rem] font-medium">Donner accès à</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {workspace.subscriptions.map((sub) => {
                    const product = productBySlug(sub.slug)!
                    const left = sub.seats - seatsUsed(workspace, sub.slug)
                    const on = apps.includes(sub.slug)
                    const short = on && people.length > left
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setApps((prev) => (on ? prev.filter((item) => item !== sub.slug) : [...prev, sub.slug]))}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl bg-card p-2 pr-3 text-left ring-1 ring-line-strong transition-all ring-inset hover:bg-bg-alt',
                          on && 'bg-accent-soft/50 ring-2 ring-accent hover:bg-accent-soft/50',
                          short && 'bg-warning-soft ring-warning hover:bg-warning-soft',
                        )}
                      >
                        <span className="size-8 shrink-0">
                          <AppIcon product={product} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.85rem] leading-tight font-medium">{product.name}</span>
                          <span className={cn('block text-[0.75rem] leading-tight text-muted', short && 'text-warning')}>{plural(left, 'place libre', 'places libres')}</span>
                        </span>
                        <span className={cn('grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-line-strong transition-colors ring-inset', on && 'bg-accent text-accent-fg ring-accent')}>{on && <Check className="size-3" strokeWidth={3} />}</span>
                      </button>
                    )
                  })}
                </div>
                {apps.some((slug) => {
                  const sub = workspace.subscriptions.find((item) => item.slug === slug)!
                  return people.length > sub.seats - seatsUsed(workspace, slug)
                }) && <p className="mt-2 text-[0.8rem] text-warning">Pas assez de places libres pour tout le monde : les membres en trop seront ajoutés sans accès Pro.</p>}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

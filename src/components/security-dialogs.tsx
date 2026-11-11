'use client'

import { Check, FileDown, Fingerprint, KeyRound, Loader2, LockKeyhole, LockKeyholeOpen, MoreHorizontal, Pencil, Plus, RotateCcw, SmartphoneNfc, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import { TODAY, type Credential } from '@/lib/demo-data'
import { useStore } from '@/lib/store'
import { formatDateShort } from '@/lib/utils'

// Gestion de la sécurité façon StudentSphere : une fenêtre par type d'identifiant, avec sa liste et ses étapes.
// Simulation : aucun secret n'est réellement créé, tout code à 6 chiffres est accepté.

const MAX_AUTHENTICATORS = 2
const uid = () => Math.random().toString(36).slice(2, 10)
const randomChars = (length: number) => Array.from({ length }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('')
const newSecret = () => Array.from({ length: 4 }, () => randomChars(4).toUpperCase()).join(' ')
const newBackupCodes = () => Array.from({ length: 10 }, () => `${randomChars(4)}-${randomChars(4)}`)

function downloadBackupCodes(codes: string[]) {
  const text = `Codes de secours Edualis\nChaque code ne sert qu’une fois.\n\n${codes.join('\n')}\n`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'edualis-codes-de-secours.txt' })
  link.click()
  URL.revokeObjectURL(url)
}

/** Ligne d'un identifiant : icône, nom, date d'ajout, menu Renommer / Supprimer. */
function CredentialRow({ icon: Icon, credential, added = 'Ajoutée', onRename, onRemove }: { icon: typeof KeyRound; credential: Credential; added?: string; onRename: () => void; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-3 ring-1 ring-line ring-inset">
      <span className="grid size-9 shrink-0 place-items-center">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9rem] font-medium">{credential.name}</span>
        <span className="block text-[0.78rem] text-muted">{added} le {formatDateShort(credential.createdAt)}</span>
      </span>
      <Menu>
        <MenuTrigger aria-label={`Options de ${credential.name}`} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg data-[state=open]:bg-fg/[0.06]">
          <MoreHorizontal className="size-5" />
        </MenuTrigger>
        <MenuContent className="min-w-40">
          <MenuItem onSelect={onRename}>
            <Pencil /> Renommer
          </MenuItem>
          <MenuItem danger onSelect={onRemove}>
            <Trash2 /> Supprimer
          </MenuItem>
        </MenuContent>
      </Menu>
    </li>
  )
}

/** Grande ligne d'action (ajouter, régénérer) : icône, titre, sous-titre. */
function ActionRow({ icon: Icon, title, text, onClick, disabled }: { icon: typeof Plus; title: string; text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ring-1 ring-line-strong transition-colors ring-inset hover:bg-bg-alt disabled:pointer-events-none disabled:opacity-50">
      <span className="grid size-9 shrink-0 place-items-center text-muted">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9rem] font-medium">{title}</span>
        <span className="block text-[0.78rem] text-muted">{text}</span>
      </span>
    </button>
  )
}

const QR_SIZE = 25

/** Modules noirs d'un faux QR code, stables pour un secret donné (démo) : motif pseudo-aléatoire hors des trois repères. */
function qrCells(seed: string) {
  let state = [...seed].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) >>> 0
  const cells: [number, number][] = []
  const corner = (x: number, y: number) => (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8)
  for (let y = 0; y < QR_SIZE; y += 1)
    for (let x = 0; x < QR_SIZE; x += 1) {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0
      if (!corner(x, y) && state / 2 ** 32 < 0.5) cells.push([x, y])
    }
  return cells
}

function QrEye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={7} height={7} />
      <rect x={1} y={1} width={5} height={5} fill="#fff" />
      <rect x={2} y={2} width={3} height={3} />
    </g>
  )
}

function FakeQr({ seed }: { seed: string }) {
  return (
    <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} className="size-full" shapeRendering="crispEdges" aria-label="Code QR à scanner">
      <rect x={-1} y={-1} width={QR_SIZE + 2} height={QR_SIZE + 2} fill="#fff" />
      <g fill="#111">
        {qrCells(seed).map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
        <QrEye x={0} y={0} />
        <QrEye x={QR_SIZE - 7} y={0} />
        <QrEye x={0} y={QR_SIZE - 7} />
      </g>
    </svg>
  )
}

/** Champ de code à 6 chiffres. */
function CodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      id="otp"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
      className="h-14 text-center font-mono text-[1.5rem] tracking-[0.5em] placeholder:text-muted/40"
    />
  )
}

// ------------------------------------------------------------------ Vérification en 2 étapes
type MfaStep = 'list' | 'add' | 'backup' | 'rename' | 'remove' | 'disable' | 'regenerate'

export function MfaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, updateUser } = useStore()
  const toast = useToast()
  const { authenticators, backupCodes } = state.user
  const [step, setStep] = useState<MfaStep>('list')
  const [target, setTarget] = useState<Credential | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState('')
  const [pending, setPending] = useState(false)
  const [shownCodes, setShownCodes] = useState<string[]>([])

  const close = (next: boolean) => {
    // Les codes de secours ne s'affichent qu'une fois : on ne ferme pas sans les avoir confirmés.
    if (step === 'backup' || pending) return
    onOpenChange(next)
    if (!next) window.setTimeout(() => setStep('list'), 200)
  }
  const startAdd = () => {
    setName('')
    setCode('')
    setSecret(newSecret())
    setStep('add')
  }
  const verify = () => {
    setPending(true)
    window.setTimeout(() => {
      const first = authenticators.length === 0
      const codes = first ? newBackupCodes() : backupCodes
      updateUser({ authenticators: [...authenticators, { id: uid(), name: name.trim(), createdAt: TODAY }], backupCodes: codes })
      setPending(false)
      toast(first ? 'Vérification en 2 étapes activée' : 'Authentificateur ajouté')
      if (first) {
        setShownCodes(codes)
        setStep('backup')
      } else setStep('list')
    }, 800)
  }
  const last = authenticators.length <= 1

  const view = (() => {
    switch (step) {
      case 'list':
        return {
          title: 'Vérification en 2 étapes',
          description: 'Confirmez que c’est bien vous avec votre mot de passe et un code de vérification.',
          body: (
            <div className="space-y-6">
              {authenticators.length > 0 && (
                <div>
                  <p className="mb-2 text-[0.72rem] font-medium tracking-wide text-muted uppercase">Méthodes actives</p>
                  <ul className="space-y-2">
                    {authenticators.map((item) => (
                      <CredentialRow
                        key={item.id}
                        icon={SmartphoneNfc}
                        credential={item}
                        added="Ajouté"
                        onRename={() => {
                          setTarget(item)
                          setName(item.name)
                          setStep('rename')
                        }}
                        onRemove={() => {
                          setTarget(item)
                          setStep('remove')
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="mb-2 text-[0.88rem] font-medium">{authenticators.length ? 'Ajouter d’autres méthodes' : 'Ajouter une méthode'}</p>
                <div className="space-y-2">
                  {authenticators.length < MAX_AUTHENTICATORS && <ActionRow icon={LockKeyhole} title="Ajouter un authentificateur" text={`${authenticators.length} sur ${MAX_AUTHENTICATORS} ajouté${authenticators.length > 1 ? 's' : ''} · Google Authenticator, 1Password, Authy…`} onClick={startAdd} />}
                  {authenticators.length > 0 && <ActionRow icon={RotateCcw} title="Régénérer les codes de secours" text="Pour récupérer votre compte sans votre téléphone" onClick={() => setStep('regenerate')} />}
                </div>
              </div>
            </div>
          ),
          footer: (
            <>
              {authenticators.length > 0 && (
                <Button variant="danger-ghost" onClick={() => setStep('disable')} className="mr-auto">
                  <LockKeyholeOpen /> Désactiver
                </Button>
              )}
              <Button onClick={() => close(false)}>Terminé</Button>
            </>
          ),
        }
      case 'add':
        return {
          title: 'Configurer l’authentificateur',
          description: 'Scannez le code QR avec votre application d’authentification, puis saisissez le code affiché.',
          body: (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="size-48 overflow-hidden rounded-xl p-2 ring-1 ring-line ring-inset" style={{ backgroundColor: '#fff' }}>
                  <FakeQr seed={secret} />
                </div>
                <p className="text-[0.78rem] text-muted">Impossible de scanner ? Saisissez cette clé :</p>
                <code className="rounded-lg bg-bg-alt px-2.5 py-1 font-mono text-[0.85rem] tracking-wider select-all">{secret}</code>
              </div>
              <Field label="Nom de l’appareil" htmlFor="mfa-name">
                <Input id="mfa-name" autoFocus placeholder="ex. Mon iPhone" value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Code à 6 chiffres" htmlFor="otp">
                <CodeInput value={code} onChange={setCode} />
              </Field>
            </div>
          ),
          footer: (
            <>
              <Button variant="ghost" disabled={pending} onClick={() => setStep('list')}>
                Retour
              </Button>
              <Button disabled={pending || code.length !== 6 || !name.trim()} onClick={verify}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" /> Vérification…
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>
            </>
          ),
        }
      case 'backup':
        return {
          title: 'Codes de secours',
          description: 'Gardez ces codes en lieu sûr. Ils ne s’affichent qu’une fois et vous permettent de vous connecter sans votre téléphone.',
          body: (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-bg-alt p-5">
              {shownCodes.map((item) => (
                <li key={item} className="text-center font-mono text-[1.05rem] font-medium tracking-wider">
                  {item}
                </li>
              ))}
            </ul>
          ),
          footer: (
            <>
              <Button variant="secondary" onClick={() => downloadBackupCodes(shownCodes)} className="mr-auto">
                <FileDown /> Télécharger
              </Button>
              <Button onClick={() => setStep('list')}>
                <Check /> J’ai sauvegardé les codes
              </Button>
            </>
          ),
        }
      case 'rename':
        return {
          title: 'Renommer l’authentificateur',
          description: 'Un nom pour le reconnaître facilement.',
          body: (
            <form
              id="mfa-rename"
              onSubmit={(event) => {
                event.preventDefault()
                if (!target || !name.trim()) return
                updateUser({ authenticators: authenticators.map((item) => (item.id === target.id ? { ...item, name: name.trim() } : item)) })
                toast('Authentificateur renommé')
                setStep('list')
              }}
            >
              <Field label="Nom" htmlFor="mfa-rename-name">
                <Input id="mfa-rename-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
            </form>
          ),
          footer: (
            <>
              <Button variant="ghost" onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button type="submit" form="mfa-rename" disabled={!name.trim()}>
                Enregistrer
              </Button>
            </>
          ),
        }
      case 'remove':
      case 'disable': {
        const all = step === 'disable' || last
        return {
          title: all ? 'Désactiver la vérification en 2 étapes ?' : 'Supprimer cet authentificateur ?',
          description: all
            ? `${step === 'remove' && target ? `Supprimer « ${target.name} » désactive la vérification en 2 étapes. ` : ''}Edualis ne vous demandera plus que votre mot de passe, et vos codes de secours ne fonctionneront plus.`
            : `« ${target?.name} » ne pourra plus générer de code pour votre compte.`,
          body: null,
          footer: (
            <>
              <Button variant="ghost" onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (all) updateUser({ authenticators: [], backupCodes: [] })
                  else updateUser({ authenticators: authenticators.filter((item) => item.id !== target?.id) })
                  toast(all ? 'Vérification en 2 étapes désactivée' : 'Authentificateur supprimé')
                  setStep('list')
                }}
              >
                {all ? 'Désactiver' : 'Supprimer'}
              </Button>
            </>
          ),
        }
      }
      case 'regenerate':
        return {
          title: 'Régénérer les codes de secours ?',
          description: 'Les anciens codes ne fonctionneront plus.',
          body: null,
          footer: (
            <>
              <Button variant="ghost" onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const codes = newBackupCodes()
                  updateUser({ backupCodes: codes })
                  setShownCodes(codes)
                  setStep('backup')
                }}
              >
                Régénérer
              </Button>
            </>
          ),
        }
    }
  })()

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg" title={view.title} description={view.description} footer={view.footer}>
        {view.body}
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------ Clés d'accès
type PasskeyStep = 'list' | 'add' | 'rename' | 'remove'

export function PasskeysDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, updateUser } = useStore()
  const toast = useToast()
  const { passkeys } = state.user
  const [step, setStep] = useState<PasskeyStep>('list')
  const [target, setTarget] = useState<Credential | null>(null)
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)

  const close = (next: boolean) => {
    if (pending) return
    onOpenChange(next)
    if (!next) window.setTimeout(() => setStep('list'), 200)
  }
  const add = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!name.trim()) return
    // Simulation de l'invite biométrique du navigateur (Face ID, Touch ID, Windows Hello).
    setPending(true)
    window.setTimeout(() => {
      updateUser({ passkeys: [...passkeys, { id: uid(), name: name.trim(), createdAt: TODAY }] })
      setPending(false)
      toast('Clé d’accès ajoutée')
      setStep('list')
    }, 1200)
  }

  const view = (() => {
    switch (step) {
      case 'list':
        return {
          title: 'Clés d’accès',
          description: 'Les clés d’accès vérifient votre identité avec la biométrie ou le code PIN de votre appareil.',
          body: (
            <div className="space-y-6">
              {passkeys.length > 0 ? (
                <div>
                  <p className="mb-2 text-[0.72rem] font-medium tracking-wide text-muted uppercase">Clés actives</p>
                  <ul className="space-y-2">
                    {passkeys.map((item) => (
                      <CredentialRow
                        key={item.id}
                        icon={Fingerprint}
                        credential={item}
                        onRename={() => {
                          setTarget(item)
                          setName(item.name)
                          setStep('rename')
                        }}
                        onRemove={() => {
                          setTarget(item)
                          setStep('remove')
                        }}
                      />
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-muted">
                  <Fingerprint className="mb-2 size-12 opacity-50" />
                  <p className="text-[0.88rem]">Vous n’avez encore aucune clé d’accès.</p>
                </div>
              )}
              <ActionRow
                icon={Plus}
                title="Ajouter une clé d’accès"
                text="Face ID, Touch ID, Windows Hello ou une clé physique"
                onClick={() => {
                  setName('')
                  setStep('add')
                }}
              />
            </div>
          ),
          footer: <Button onClick={() => close(false)}>Terminé</Button>,
        }
      case 'add':
        return {
          title: 'Ajouter une clé d’accès',
          description: pending ? 'Suivez les instructions de votre appareil…' : 'Donnez-lui un nom, puis validez pour lancer la biométrie.',
          body: (
            <form id="passkey-add" onSubmit={add}>
              <Field label="Nom" htmlFor="passkey-name">
                <Input id="passkey-name" autoFocus disabled={pending} placeholder="ex. MacBook Pro" value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
            </form>
          ),
          footer: (
            <>
              <Button variant="ghost" disabled={pending} onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button type="submit" form="passkey-add" disabled={pending || !name.trim()}>
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" /> En attente de l’appareil…
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </>
          ),
        }
      case 'rename':
        return {
          title: 'Renommer la clé d’accès',
          description: undefined,
          body: (
            <form
              id="passkey-rename"
              onSubmit={(event) => {
                event.preventDefault()
                if (!target || !name.trim()) return
                updateUser({ passkeys: passkeys.map((item) => (item.id === target.id ? { ...item, name: name.trim() } : item)) })
                toast('Clé d’accès renommée')
                setStep('list')
              }}
            >
              <Field label="Nom" htmlFor="passkey-rename-name">
                <Input id="passkey-rename-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
            </form>
          ),
          footer: (
            <>
              <Button variant="ghost" onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button type="submit" form="passkey-rename" disabled={!name.trim()}>
                Enregistrer
              </Button>
            </>
          ),
        }
      case 'remove':
        return {
          title: 'Supprimer cette clé d’accès ?',
          description: `Vous ne pourrez plus utiliser « ${target?.name} » pour vous connecter.`,
          body: null,
          footer: (
            <>
              <Button variant="ghost" onClick={() => setStep('list')}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  updateUser({ passkeys: passkeys.filter((item) => item.id !== target?.id) })
                  toast('Clé d’accès supprimée')
                  setStep('list')
                }}
              >
                Supprimer
              </Button>
            </>
          ),
        }
    }
  })()

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg" title={view.title} description={view.description} footer={view.footer}>
        {view.body}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Download, Fingerprint, KeyRound, Laptop, Smartphone, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { StrengthMeter } from '@/components/auth/auth-bits'
import { PageHeader } from '@/components/shell/page-header'
import { MfaDialog, PasskeysDialog } from '@/components/security-dialogs'
import { ThemeSelector } from '@/components/theme-selector'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import type { User } from '@/lib/demo-data'
import { useStore } from '@/lib/store'

export default function ProfilePage() {
  const { state, updateUser, signOut } = useStore()
  const toast = useToast()
  const router = useRouter()
  const [form, setForm] = useState(state.user)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [securityDialog, setSecurityDialog] = useState<'mfa' | 'passkeys' | null>(null)
  const user = state.user
  const dirty = (['firstName', 'lastName', 'email', 'status', 'school'] as const).some((key) => form[key] !== user[key])

  return (
    <>
      <PageHeader title="Profil et sécurité" description="Ces informations vous suivent dans tous les logiciels Edualis." />
      <div className="space-y-6">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Informations personnelles" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${form.firstName} ${form.lastName}`} className="size-14 text-base" />
                <Button variant="secondary" onClick={() => toast('Photo mise à jour', { tone: 'info', text: 'Simulation : aucune image envoyée.' })}>
                  Changer la photo
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" htmlFor="p-first">
                  <Input id="p-first" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
                </Field>
                <Field label="Nom" htmlFor="p-last">
                  <Input id="p-last" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
                </Field>
                <Field label="Adresse e-mail" htmlFor="p-email" className="sm:col-span-2" hint="Un lien de confirmation est envoyé à la nouvelle adresse.">
                  <Input id="p-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </Field>
                <Field label="Vous êtes" htmlFor="p-status">
                  <Select id="p-status" value={form.status} onValueChange={(value) => setForm({ ...form, status: value as User['status'] })} options={['Étudiant', 'Enseignant', 'Indépendant', 'Personnel administratif'].map((item) => ({ value: item, label: item }))} />
                </Field>
                <Field label="Établissement" htmlFor="p-school">
                  <Input id="p-school" placeholder="Facultatif" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} />
                </Field>
              </div>
            </CardBody>
            <CardFooter>
              <Button variant="ghost" disabled={!dirty} onClick={() => setForm(user)}>
                Annuler
              </Button>
              <Button
                disabled={!dirty}
                onClick={() => {
                  updateUser(form)
                  toast('Profil enregistré')
                }}
              >
                Enregistrer
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader title="Sécurité" description="Protégez l’accès à vos logiciels et à votre organisation." />
            <CardBody className="divide-y divide-line py-0">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 size-4 text-muted" />
                  <div>
                    <p className="text-[0.92rem] font-medium">Mot de passe</p>
                    <p className="text-[0.82rem] text-muted">Modifié il y a 4 mois</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
                  Modifier
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 size-4 text-muted" />
                  <div>
                    <p className="flex items-center gap-2 text-[0.92rem] font-medium">Vérification en 2 étapes {user.authenticators.length ? <Badge tone="success">Activée</Badge> : <Badge tone="warning">Recommandée</Badge>}</p>
                    <p className="text-[0.82rem] text-muted">Un code depuis une application d’authentification, en plus du mot de passe.</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setSecurityDialog('mfa')}>
                  {user.authenticators.length ? 'Gérer' : 'Activer'}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <Fingerprint className="mt-0.5 size-4 text-muted" />
                  <div>
                    <p className="text-[0.92rem] font-medium">Clés d’accès</p>
                    <p className="text-[0.82rem] text-muted">Connexion sans mot de passe, avec Face ID, Touch ID ou Windows Hello.</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setSecurityDialog('passkeys')}>
                  {user.passkeys.length ? 'Gérer' : 'Ajouter'}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Appareils connectés" />
            <CardBody className="divide-y divide-line py-0">
              {[
                { icon: Laptop, name: 'MacBook Air · Safari', where: 'Rennes · maintenant', current: true },
                { icon: Smartphone, name: 'iPhone · Cerise', where: 'Rennes · il y a 2 jours', current: false },
                { icon: Laptop, name: 'PC du CDI · Chrome', where: 'Rennes · 28 oct.', current: false },
              ].map((device) => (
                <div key={device.name} className="flex items-center gap-3 py-3.5">
                  <device.icon className="size-4 text-muted" />
                  <div className="flex-1">
                    <p className="text-[0.9rem] font-medium">{device.name}</p>
                    <p className="text-[0.8rem] text-muted">{device.where}</p>
                  </div>
                  {device.current ? (
                    <Badge tone="success" dot>
                      Cet appareil
                    </Badge>
                  ) : (
                    <Button variant="ghost" onClick={() => toast(`${device.name} déconnecté`)}>
                      Déconnecter
                    </Button>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Apparence" description="Personnalisez l’apparence d’Edualis sur cet appareil." />
            <CardBody>
              <ThemeSelector />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="E-mails" />
            <CardBody className="space-y-4">
              {(
                [
                  { key: 'productNews', title: 'Nouveautés des logiciels', text: 'Une fois par mois au plus.' },
                  { key: 'newsletter', title: 'Conseils pédagogiques', text: 'Guides et idées de séances.' },
                ] as const
              ).map((item) => (
                <label key={item.key} className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-[0.9rem] font-medium">{item.title}</span>
                    <span className="block text-[0.8rem] text-muted">{item.text}</span>
                  </span>
                  <Switch checked={user[item.key]} onCheckedChange={(value) => updateUser({ [item.key]: value })} />
                </label>
              ))}
              <p className="text-[0.78rem] text-muted">Les e-mails de facturation et de sécurité sont toujours envoyés.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vos données" description="Hébergées en France, jamais revendues." />
            <CardBody className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast('Export en préparation', { text: 'Vous recevrez un lien par e-mail sous 24 h.' })}>
                <Download /> Télécharger mes données
              </Button>
              <Button variant="danger-ghost" onClick={() => setDeleteOpen(true)}>
                <Trash2 /> Supprimer mon compte
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <MfaDialog open={securityDialog === 'mfa'} onOpenChange={(open) => setSecurityDialog(open ? 'mfa' : null)} />
      <PasskeysDialog open={securityDialog === 'passkeys'} onOpenChange={(open) => setSecurityDialog(open ? 'passkeys' : null)} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          title="Supprimer votre compte ?"
          description="Vos abonnements personnels sont résiliés et vos projets supprimés sous 30 jours. Vous quittez aussi vos organisations."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  signOut()
                  router.push('/connexion')
                }}
              >
                Supprimer
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  )
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const toast = useToast()
  const [next, setNext] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Modifier le mot de passe"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              disabled={next.length < 8}
              onClick={() => {
                toast('Mot de passe modifié', { text: 'Les autres appareils ont été déconnectés.' })
                setNext('')
                onOpenChange(false)
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Mot de passe actuel" htmlFor="pw-current">
            <Input id="pw-current" type="password" autoComplete="current-password" />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="pw-new">
            <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
            <StrengthMeter password={next} />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}

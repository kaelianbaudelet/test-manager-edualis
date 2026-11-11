'use client'

import { Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/lib/store'

/** Création d'un groupe (classe, promotion, équipe) : ajouté à l'organisation puis renvoyé à l'appelant pour être sélectionné. */
export function NewGroupDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (group: string) => void }) {
  const { workspace, updateWorkspace } = useStore()
  const toast = useToast()
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const exists = workspace.groups.some((group) => group.toLowerCase() === trimmed.toLowerCase())

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setName('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!trimmed || exists) return
    updateWorkspace({ groups: [...workspace.groups, trimmed] })
    toast(`Groupe « ${trimmed} » créé`)
    onCreated?.(trimmed)
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="max-w-md"
        title="Nouveau groupe"
        description="Une classe, une promotion ou une équipe."
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Annuler
            </Button>
            <Button type="submit" form="new-group" disabled={!trimmed || exists}>
              Créer le groupe
            </Button>
          </>
        }
      >
        <form id="new-group" onSubmit={submit}>
          <Field label="Nom du groupe" htmlFor="group-name" error={exists ? 'Ce groupe existe déjà.' : undefined} hint="Sert à filtrer les membres et à attribuer des places d’un coup.">
            <div className="relative">
              <Users className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <Input id="group-name" autoFocus autoComplete="off" maxLength={60} placeholder="Ex. Terminale NSI" value={name} aria-invalid={exists} onChange={(event) => setName(event.target.value)} className="pl-10" />
            </div>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  )
}

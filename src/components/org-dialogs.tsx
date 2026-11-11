'use client'

import { ArrowRight, Inbox } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { InvitationCard } from '@/components/invitation-card'
import { findInvite } from '@/lib/demo-data'
import { useStore } from '@/lib/store'

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onDone?: () => void }

export { CreateOrgDialog } from './create-org-dialog'

/**
 * Invitations reçues. On ne saisit jamais de code ni de lien : l'établissement envoie un e-mail, et le lien qu'il
 * contient ouvre la page d'invitation. Les invitations en attente apparaissent aussi ici, prêtes à accepter.
 */
export function InvitationsDialog({ open, onOpenChange, onDone }: Props) {
  const { state, joinOrganization, declineInvite } = useStore()
  const toast = useToast()
  const router = useRouter()
  const pending = state.pendingInvites.filter((token) => findInvite(token))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Invitations reçues"
        description="Pour rejoindre une organisation, il faut y être invité : vous recevez un e-mail avec un lien personnel."
        footer={
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        }
      >
        {pending.length ? (
          <ul className="space-y-3">
            {pending.map((token) => (
              <li key={token}>
                <InvitationCard invitation={findInvite(token)!}>
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
                      onOpenChange(false)
                      router.push('/')
                      onDone?.()
                    }}
                  >
                    Accepter <ArrowRight />
                  </Button>
                </InvitationCard>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Inbox className="size-5" />
            </span>
            <p className="mt-4 font-semibold">Aucune invitation en attente</p>
            <p className="mt-1 max-w-sm text-[0.88rem] text-muted">Demandez à votre établissement de vous inviter avec {state.user.email}. Cliquez ensuite sur le lien de l’e-mail reçu.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

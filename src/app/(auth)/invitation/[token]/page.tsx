'use client'

import { ArrowRight, Link2Off, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthHeading } from '@/components/auth/auth-bits'
import { InvitationCard } from '@/components/invitation-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { findInvite } from '@/lib/demo-data'
import { useStore } from '@/lib/store'

// Page ouverte en cliquant le lien de l'e-mail d'invitation. Le jeton du lien suffit : rien à saisir.
export default function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const { ready, state, joinOrganization, declineInvite } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const invitation = findInvite(token)

  if (!ready) return null

  if (!invitation)
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
          <Link2Off className="size-5" />
        </span>
        <div className="mt-5">
          <AuthHeading title="Ce lien n’est plus valide" text="Il a expiré, a déjà été utilisé ou a été désactivé par l’établissement. Demandez une nouvelle invitation à la personne qui vous l’a envoyée." />
        </div>
        <ButtonLink href={state.signedIn ? '/' : '/connexion'} variant="secondary">
          {state.signedIn ? 'Retour au tableau de bord' : 'Se connecter'}
        </ButtonLink>
      </div>
    )

  const accept = () => {
    setPending(true)
    window.setTimeout(() => {
      joinOrganization(token)
      toast(`Bienvenue chez ${invitation.name}`, { text: 'Vos logiciels sont prêts.' })
      router.push('/')
    }, 700)
  }

  return (
    <>
      <p className="mb-3 text-[0.85rem] font-medium text-accent">Invitation</p>
      <AuthHeading title={`Rejoindre ${invitation.name}`} text={`${invitation.invitedBy} vous invite à rejoindre l’organisation sur Edualis.`} />
      <InvitationCard invitation={invitation} />

      {state.signedIn ? (
        <>
          <p className="mt-5 text-[0.85rem] text-muted">
            Connecté en tant que <span className="font-medium text-fg">{state.user.email}</span>.
          </p>
          <div className="mt-4 flex gap-3">
            <Button size="lg" className="flex-1" disabled={pending} onClick={accept}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" /> Un instant…
                </>
              ) : (
                <>
                  Accepter l’invitation <ArrowRight />
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                declineInvite(token)
                toast('Invitation refusée')
                router.push('/')
              }}
            >
              Refuser
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-3">
          <ButtonLink href={`/inscription?invitation=${token}`} size="lg" className="w-full">
            Créer mon compte et rejoindre
          </ButtonLink>
          <ButtonLink href={`/connexion?invitation=${token}`} size="lg" variant="secondary" className="w-full">
            J’ai déjà un compte
          </ButtonLink>
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-2xl bg-bg-alt p-4 text-[0.8rem] text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Ce lien vous est personnel et ne fonctionne qu’une fois. Vous ne connaissez pas {invitation.invitedBy} ? Ignorez simplement l’e-mail, ou{' '}
          <Link href="#" className="underline underline-offset-2 hover:text-fg">
            signalez-le
          </Link>
          .
        </p>
      </div>
    </>
  )
}

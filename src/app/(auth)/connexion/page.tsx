'use client'

import { ArrowLeft, Building2, Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { AuthHeading, Divider, LegalNote, SocialButtons } from '@/components/auth/auth-bits'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { InvitationCard } from '@/components/invitation-card'
import { findInvite, findSsoOrganization } from '@/lib/demo-data'
import { ssoProvider } from '@/lib/sso'
import { useStore } from '@/lib/store'

// Connexion en deux temps, comme StudentSphere : l'e-mail d'abord, puis le mot de passe qui se déplie.
export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  )
}

function SignIn() {
  const { signIn, state } = useStore()
  // Arrivée depuis le lien d'un e-mail d'invitation : on rejoint l'organisation juste après la connexion.
  const invite = useSearchParams().get('invitation') ?? undefined
  const invitation = invite ? findInvite(invite) : undefined
  const router = useRouter()
  const toast = useToast()
  // Après l'e-mail : la clé d'accès si le compte en a une (suggérée d'office), sinon le mot de passe.
  // Après l'e-mail : le SSO si le domaine appartient à un établissement qui l'impose, sinon la clé d'accès si le
  // compte en a une, sinon le mot de passe.
  const [step, setStep] = useState<'email' | 'sso' | 'passkey' | 'password'>('email')
  const [email, setEmail] = useState(state.user.email)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  const hasPasskey = email.trim().toLowerCase() === state.user.email.toLowerCase() && state.user.passkeys.length > 0
  const ssoOrg = findSsoOrganization(email, state.workspaces)
  // Un seul mode : le SSO de l'établissement. Le fournisseur (ENT, CAS, Okta…) n'est qu'un détail affiché dessous.
  const ssoVia = ssoOrg?.sso ? ssoProvider(ssoOrg.sso.provider).name : ''

  const done = () => {
    signIn(invite)
    toast(invitation ? `Bienvenue chez ${invitation.name}` : `Bon retour, ${state.user.firstName}`)
    router.push('/')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(undefined)
    if (step === 'email') {
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Entrez une adresse e-mail valide.')
      return setStep(ssoOrg ? 'sso' : hasPasskey ? 'passkey' : 'password')
    }
    if (step === 'sso' || step === 'passkey') {
      // Simulation de l'invite biométrique du navigateur.
      setPending(true)
      return window.setTimeout(done, 900)
    }
    if (password.length < 4) return setError('Mot de passe incorrect. Pour la démo, n’importe quel mot de passe de 4 caractères suffit.')
    setPending(true)
    window.setTimeout(done, 700)
  }

  return (
    <>
      <AuthHeading title="Se connecter" text={invitation ? `Connectez-vous pour rejoindre ${invitation.name}.` : 'Accédez à vos logiciels, vos licences et votre organisation.'} />
      {invitation && <InvitationCard invitation={invitation} className="mb-6" />}
      <form onSubmit={submit} noValidate>
        <Field label="Adresse e-mail" htmlFor="email" error={step === 'email' ? error : undefined}>
          <Input
            id="email"
            type="email"
            autoComplete="username webauthn"
            placeholder="vous@exemple.fr"
            autoFocus
            value={email}
            aria-invalid={step === 'email' && Boolean(error)}
            onChange={(event) => {
              setEmail(event.target.value)
              if (step !== 'email') {
                setStep('email')
                setPassword('')
              }
            }}
          />
        </Field>
        <AnimatePresence initial={false}>
          {step === 'sso' && ssoOrg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-bg-alt p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card ring-1 ring-line ring-inset">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0 text-[0.85rem]">
                  <p className="font-medium">Connexion gérée par {ssoOrg.name}</p>
                  <p className="text-muted">Authentification unique via {ssoVia}.</p>
                </div>
              </div>
            </motion.div>
          )}
          {step === 'passkey' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-bg-alt p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card ring-1 ring-line ring-inset">
                  <Fingerprint className="size-5" />
                </span>
                <div className="min-w-0 text-[0.85rem]">
                  <p className="font-medium">Clé d’accès disponible</p>
                  <p className="truncate text-muted">Face ID, Touch ID ou code PIN</p>
                </div>
              </div>
            </motion.div>
          )}
          {step === 'password' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="pt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-[0.85rem] font-medium">
                    Mot de passe
                  </label>
                  <Link href="/mot-de-passe-oublie" className="text-[0.82rem] text-accent hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" autoFocus placeholder="••••••••" value={password} aria-invalid={Boolean(error)} onChange={(event) => setPassword(event.target.value)} className="pr-11" />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-fg">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {error && <p className="mt-1.5 text-[0.8rem] text-danger">{error}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> Connexion…
            </>
          ) : step === 'email' ? (
            'Continuer'
          ) : step === 'sso' ? (
            <>
              <Building2 /> Continuer avec le SSO
            </>
          ) : step === 'passkey' ? (
            <>
              <Fingerprint /> Se connecter avec ma clé d’accès
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
        {step === 'passkey' && !pending && (
          <button type="button" onClick={() => setStep('password')} className="mt-3 w-full text-center text-[0.85rem] text-muted hover:text-fg">
            Utiliser mon mot de passe
          </button>
        )}
        {(step === 'password' || step === 'sso') && !pending && (
          <button type="button" onClick={() => setStep('email')} className="mt-3 flex w-full items-center justify-center gap-1.5 text-[0.85rem] text-muted hover:text-fg">
            <ArrowLeft className="size-3.5" /> Changer d’adresse
          </button>
        )}
      </form>

      <Divider>Ou continuer avec</Divider>
      <SocialButtons onDone={done} />
      <LegalNote />
      <p className="mt-4 text-[0.9rem]">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-medium text-accent hover:underline">
          Créer un compte
        </Link>
      </p>
    </>
  )
}

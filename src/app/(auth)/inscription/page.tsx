'use client'

import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { AuthHeading, Divider, LegalNote, SocialButtons, StepProgress, strength, StrengthMeter } from '@/components/auth/auth-bits'
import { CheckoutDialog, type PaymentMethod } from '@/components/checkout'
import { OrgAppsPicker, OrgSeatsPicker, useOrgCart } from '@/components/create-org-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ORG_TYPES } from '@/lib/catalog'
import type { User as UserType } from '@/lib/demo-data'
import { findInvite } from '@/lib/demo-data'
import { InvitationCard } from '@/components/invitation-card'
import { useStore } from '@/lib/store'
import { cn, formatEuro } from '@/lib/utils'

type Path = 'personal' | 'create'

const PATHS: { id: Path; title: string; text: string }[] = [
  { id: 'personal', title: 'Pour moi', text: 'Élève, étudiant, enseignant ou indépendant.' },
  { id: 'create', title: 'Pour mon établissement', text: 'Je souscris au tarif équipe et j’invite les membres.' },
]

// Inscription en trois étapes, comme StudentSphere : identité, sécurité, puis l'usage (seul ou établissement).
// « Pour mon établissement » ajoute deux étapes, logiciels et paiement : l'organisation naît payée, avec le compte.
// Une invitation arrive par le lien d'un e-mail : `?invitation=` la porte jusqu'ici.
export default function SignUpPage() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  )
}

function SignUp() {
  const { signUp } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [path, setPath] = useState<Path>('personal')
  const [status, setStatus] = useState<UserType['status']>('Étudiant')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState<string>(ORG_TYPES[0])
  const invite = useSearchParams().get('invitation') ?? undefined
  const invitation = invite ? findInvite(invite) : undefined
  const [terms, setTerms] = useState(false)
  const [news, setNews] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const cart = useOrgCart()
  // « Pour mon établissement » : la dernière étape ouvre le paiement (façon Stripe), qui crée compte et organisation.
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const creating = !invitation && path === 'create'
  const steps = ['Compte', 'Sécurité', invitation ? 'Invitation' : 'Usage', ...(creating ? ['Logiciels', 'Places'] : [])]
  const last = steps.length - 1

  const next = (event: React.FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (step === 0) {
      if (!firstName.trim()) found.firstName = 'Indiquez votre prénom.'
      if (!lastName.trim()) found.lastName = 'Indiquez votre nom.'
      if (!/^\S+@\S+\.\S+$/.test(email)) found.email = 'Entrez une adresse e-mail valide.'
    }
    if (step === 1) {
      if (strength(password) < 2) found.password = 'Choisissez un mot de passe plus solide.'
      if (confirm !== password) found.confirm = 'Les deux mots de passe ne correspondent pas.'
    }
    if (step === 2) {
      if (!invitation && path === 'create' && !orgName.trim()) found.orgName = 'Donnez un nom à votre organisation.'
      if (!terms) found.terms = 'Acceptez les conditions pour continuer.'
    }
    if (step === 3 && !cart.lines.length) found.apps = 'Choisissez au moins un logiciel.'
    setErrors(found)
    if (Object.keys(found).length) return
    if (step < last) return setStep(step + 1)
    if (creating) return setCheckoutOpen(true)
    finish()
  }

  const finish = (payment?: { method: PaymentMethod; total: number }) => {
    setPending(true)
    window.setTimeout(() => {
      signUp({
        user: { firstName: firstName.trim(), lastName: lastName.trim(), email, status, newsletter: news },
        invite,
        organization: creating && payment ? { name: orgName.trim(), type: orgType, purchase: { ...cart.purchase, total: payment.total, method: payment.method } } : undefined,
      })
      toast(invitation ? `Bienvenue chez ${invitation.name}` : creating ? `${orgName.trim()} est créée` : 'Compte créé', { text: invitation ? 'Vos logiciels sont prêts.' : creating ? 'Invitez vos membres et attribuez-leur une place.' : 'Bienvenue sur Edualis.' })
      router.push('/')
    }, 1000)
  }

  const titles = [
    { title: 'Créer votre compte', text: 'Un seul compte pour tous les logiciels Edualis.' },
    { title: 'Sécurité', text: 'Choisissez un mot de passe robuste.' },
    invitation
      ? { title: `Rejoindre ${invitation.name}`, text: 'Dernière étape : vérifiez l’invitation et acceptez les conditions.' }
      : { title: 'Comment utiliserez-vous Edualis ?', text: 'Vous pourrez créer une organisation ou en rejoindre une plus tard.' },
    { title: `Les logiciels de ${orgName.trim() || 'votre organisation'}`, text: 'Une organisation démarre avec au moins un logiciel au tarif équipe. Vous la gardez même si un abonnement expire.' },
    { title: 'Places', text: 'Une place par membre qui utilisera le logiciel. Plus il y en a, moins chacune coûte.' },
  ]

  return (
    <>
      <StepProgress steps={steps} step={step} onBack={step > 0 ? () => setStep(step - 1) : undefined} disabled={pending} />
      <AuthHeading {...titles[step]} />
      <form onSubmit={next} noValidate>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" htmlFor="firstName" error={errors.firstName}>
                    <Input id="firstName" autoFocus autoComplete="given-name" value={firstName} aria-invalid={Boolean(errors.firstName)} onChange={(event) => setFirstName(event.target.value)} />
                  </Field>
                  <Field label="Nom" htmlFor="lastName" error={errors.lastName}>
                    <Input id="lastName" autoComplete="family-name" value={lastName} aria-invalid={Boolean(errors.lastName)} onChange={(event) => setLastName(event.target.value)} />
                  </Field>
                </div>
                <Field label="Adresse e-mail" htmlFor="email" error={errors.email} hint="Utilisez l’adresse de votre établissement si vous en avez une.">
                  <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" value={email} aria-invalid={Boolean(errors.email)} onChange={(event) => setEmail(event.target.value)} />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Mot de passe" htmlFor="password" error={errors.password}>
                  <div className="relative">
                    <Input id="password" autoFocus type={show ? 'text' : 'password'} autoComplete="new-password" value={password} aria-invalid={Boolean(errors.password)} onChange={(event) => setPassword(event.target.value)} className="pr-11" />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Masquer' : 'Afficher'} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-fg">
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <StrengthMeter password={password} />
                </Field>
                <Field label="Confirmer le mot de passe" htmlFor="confirm" error={errors.confirm}>
                  <Input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} aria-invalid={Boolean(errors.confirm)} onChange={(event) => setConfirm(event.target.value)} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                {invitation ? (
                  <InvitationCard invitation={invitation} />
                ) : (
                <>
                <div role="radiogroup" aria-label="Usage" className="space-y-3">
                  {PATHS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={path === item.id}
                      onClick={() => setPath(item.id)}
                      className={cn('flex min-h-20 w-full items-center gap-4 rounded-2xl bg-card px-5 py-4 text-left ring-1 ring-line-strong transition-all ring-inset hover:bg-bg-alt', path === item.id && 'bg-accent-soft/50 ring-2 ring-accent hover:bg-accent-soft/50')}
                    >
                      <span>
                        <span className="block text-[1rem] font-semibold">{item.title}</span>
                        <span className="mt-0.5 block text-[0.85rem] text-muted">{item.text}</span>
                      </span>
                      <span className={cn('ml-auto size-5 shrink-0 rounded-full ring-1 ring-line-strong ring-inset', path === item.id && 'ring-[6px] ring-accent')} />
                    </button>
                  ))}
                </div>

                {path === 'personal' && (
                  <Field label="Vous êtes" htmlFor="status">
                    <Select id="status" value={status} onValueChange={(value) => setStatus(value as UserType['status'])} options={['Étudiant', 'Enseignant', 'Indépendant', 'Personnel administratif'].map((item) => ({ value: item, label: item }))} />
                  </Field>
                )}
                {path === 'create' && (
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Nom de l’organisation" htmlFor="orgName" error={errors.orgName}>
                      <Input id="orgName" placeholder="Lycée Victor-Hugo" value={orgName} aria-invalid={Boolean(errors.orgName)} onChange={(event) => setOrgName(event.target.value)} />
                    </Field>
                    <Field label="Type" htmlFor="orgType">
                      <Select id="orgType" value={orgType} onValueChange={setOrgType} options={ORG_TYPES.map((item) => ({ value: item, label: item }))} />
                    </Field>
                  </div>
                )}
                </>
                )}

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 text-[0.85rem]">
                    <Checkbox checked={terms} onCheckedChange={(value) => setTerms(value === true)} className="mt-0.5" aria-invalid={Boolean(errors.terms)} />
                    <span>
                      J’accepte les <a href="#" className="text-accent underline-offset-2 hover:underline">Conditions d’utilisation</a> et la <a href="#" className="text-accent underline-offset-2 hover:underline">Politique de confidentialité</a>.
                      {errors.terms && <span className="mt-1 block text-[0.8rem] text-danger">{errors.terms}</span>}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-[0.85rem] text-muted">
                    <Checkbox checked={news} onCheckedChange={(value) => setNews(value === true)} className="mt-0.5" />
                    Recevoir les nouveautés des logiciels, une fois par mois au plus.
                  </label>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                {/* La liste défile seule, la page reste en place. */}
                <OrgAppsPicker cart={cart} showSeats={false} listClassName="-mx-1 max-h-[max(14rem,min(26rem,calc(100dvh-30rem)))] overflow-y-auto overscroll-contain px-1 py-1" />
                {errors.apps && !cart.lines.length && <p className="text-[0.85rem] text-danger">{errors.apps}</p>}
              </>
            )}
            {step === 4 && <OrgSeatsPicker cart={cart} />}
          </motion.div>
        </AnimatePresence>

        {step === 3 && cart.lines.length > 0 && (
          <p className="mt-5 text-[0.85rem] text-muted tabular-nums">
            À partir de <span className="font-medium text-fg">{formatEuro(cart.monthly)}</span> HT par mois
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button type="submit" size="lg" className="flex-1" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Création du compte…
              </>
            ) : step < last ? (
              <>
                Continuer <ArrowRight />
              </>
            ) : creating ? (
              <>
                Passer au paiement <ArrowRight />
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </div>
      </form>

      {step === 0 && (
        <>
          <Divider>Ou s’inscrire avec</Divider>
          <SocialButtons
            onDone={() => {
              signUp({ user: { firstName: 'Alex', lastName: 'Durand', email: 'alex.durand@gmail.com', status: 'Étudiant' } })
              router.push('/')
            }}
          />
          <LegalNote />
        </>
      )}
      {creating && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          cart={cart}
          title={`Abonnement de ${orgName.trim()}`}
          description="Votre compte et votre organisation sont créés dès le paiement. Les places sont actives tout de suite."
          defaultName={{ first: firstName.trim(), last: lastName.trim() }}
          pending={pending}
          onPay={(method, total) => finish({ method, total })}
        />
      )}
      <p className="mt-4 text-[0.9rem]">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-medium text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  )
}

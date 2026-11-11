'use client'

import { ArrowLeft, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { AuthHeading } from '@/components/auth/auth-bits'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  if (sent)
    return (
      <div>

        <AuthHeading title="Vérifiez votre boîte mail" text={`Si un compte existe pour ${email}, vous recevrez un lien pour choisir un nouveau mot de passe. Il est valable 30 minutes.`} />
        <Link href="/connexion" className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-accent hover:underline">
          <ArrowLeft className="size-4" /> Retour à la connexion
        </Link>
      </div>
    )

  return (
    <>
      <AuthHeading title="Mot de passe oublié" text="Entrez votre adresse : nous vous envoyons un lien de réinitialisation." />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (email) setSent(true)
        }}
      >
        <Field label="Adresse e-mail" htmlFor="email">
          <Input id="email" type="email" autoFocus required placeholder="vous@exemple.fr" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="mt-6 w-full">
          Envoyer le lien
        </Button>
      </form>
      <Link href="/connexion" className="mt-5 inline-flex items-center gap-1.5 text-[0.9rem] text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>
    </>
  )
}

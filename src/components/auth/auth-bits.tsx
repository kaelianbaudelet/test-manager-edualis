'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { GoogleLogo, MicrosoftLogo } from './brand-logos'

export function AuthHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-sans text-[1.4rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 text-[0.92rem] text-muted">{text}</p>
    </div>
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-[0.8rem] text-muted">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

/**
 * Connexions tierces simulées : chaque bouton « charge » un instant puis appelle `onDone`.
 * Pas de bouton clé d'accès ni SSO : ils sont proposés d'eux-mêmes une fois l'e-mail saisi, seulement quand
 * le compte en a une ou que son établissement les utilise (voir la page de connexion).
 */
export function SocialButtons({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState<string | null>(null)
  const run = (id: string) => {
    setPending(id)
    window.setTimeout(onDone, 900)
  }
  const spinner = <Loader2 className="animate-spin" />
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" disabled={pending !== null} onClick={() => run('google')}>
          {pending === 'google' ? spinner : <GoogleLogo />} Google
        </Button>
        <Button variant="secondary" size="lg" disabled={pending !== null} onClick={() => run('microsoft')}>
          {pending === 'microsoft' ? spinner : <MicrosoftLogo />} Microsoft
        </Button>
      </div>
    </div>
  )
}

/**
 * Progression d'un parcours en plusieurs étapes, sur une seule ligne : « Retour » puis une barre segmentée
 * (fait, en cours, à venir). L'étape exacte est annoncée aux lecteurs d'écran par `aria-valuetext`.
 */
export function StepProgress({ steps, step, onBack, disabled }: { steps: string[]; step: number; onBack?: () => void; disabled?: boolean }) {
  return (
    <div className="mb-6 flex h-6 items-center gap-3 text-[0.82rem]">
      {onBack && (
        <button type="button" onClick={onBack} disabled={disabled} className="group -ml-0.5 inline-flex shrink-0 items-center gap-1 text-muted transition-colors hover:text-fg disabled:opacity-50">
          <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Retour
        </button>
      )}
      <div className="flex flex-1 gap-1" role="progressbar" aria-label="Progression de l’inscription" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-valuetext={`Étape ${step + 1} sur ${steps.length} : ${steps[step]}`}>
        {steps.map((label, index) => (
          <span key={label} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', index < step ? 'bg-fg' : index === step ? 'bg-accent' : 'bg-fg/10')} />
        ))}
      </div>
    </div>
  )
}

export function LegalNote() {
  return (
    <p className="mt-6 text-[0.75rem] leading-relaxed text-muted">
      En continuant, vous acceptez nos <a className="underline underline-offset-2 hover:text-fg" href="#">Conditions d’utilisation</a> et notre{' '}
      <a className="underline underline-offset-2 hover:text-fg" href="#">Politique de confidentialité</a>. Vos données restent en France.
    </p>
  )
}

export function strength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(4, score)
}

export function StrengthMeter({ password }: { password: string }) {
  const score = strength(password)
  const labels = ['Trop court', 'Faible', 'Correct', 'Solide', 'Excellent']
  const colors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success']
  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={cn('h-1 flex-1 rounded-full bg-fg/10 transition-colors', password && index < Math.max(1, score) && colors[score])} />
        ))}
      </div>
      {password && <p className="mt-1.5 text-[0.78rem] text-muted">{labels[score]} · 8 caractères minimum, avec un chiffre</p>}
    </div>
  )
}

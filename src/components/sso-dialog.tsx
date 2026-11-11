'use client'

import { ArrowLeft, ArrowRight, Building, Check, CircleCheck, Copy, KeyRound, Loader2, Plus, Radar, ShieldCheck, Trash2, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useState } from 'react'

import { GoogleLogo, MicrosoftLogo } from '@/components/auth/brand-logos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { ROLES, type Role } from '@/lib/catalog'
import { TODAY } from '@/lib/demo-data'
import { activationBlockers, blankSso, missingFields, newDomain, serviceProvider, SSO_PROVIDERS, ssoProvider, visibleFields, type SsoConfig, type SsoMapping, type SsoProvider } from '@/lib/sso'
import { useStore } from '@/lib/store'
import { cn, formatDateShort } from '@/lib/utils'

type Step = 'provider' | 'connection' | 'attributes' | 'domains' | 'test'

const STEPS: { id: Step; label: string; text: string }[] = [
  { id: 'provider', label: 'Fournisseur', text: 'Protocole ou service' },
  { id: 'connection', label: 'Connexion', text: 'Application et identifiants' },
  { id: 'attributes', label: 'Attributs et rôles', text: 'Profil et droits' },
  { id: 'domains', label: 'Domaines', text: 'Vérification DNS' },
  { id: 'test', label: 'Test et activation', text: 'Connexion d’essai' },
]

const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((role) => ({ value: role, label: ROLES[role].label }))

const MAPPING_LABELS: { key: keyof SsoMapping; label: string }[] = [
  { key: 'email', label: 'Adresse e-mail' },
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
]

/** Pastille du fournisseur : logo de marque quand il existe, sinon une icône du protocole. */
export function ProviderMark({ id, className }: { id: SsoProvider; className?: string }) {
  const box = cn('grid size-10 shrink-0 place-items-center rounded-xl bg-card ring-1 ring-line ring-inset', className)
  if (id === 'entra')
    return (
      <span className={box}>
        <MicrosoftLogo className="size-5" />
      </span>
    )
  if (id === 'google')
    return (
      <span className={box}>
        <GoogleLogo className="size-5" />
      </span>
    )
  if (id === 'okta')
    return (
      <span className={box} aria-hidden>
        <span className="size-5 rounded-full border-[5px] border-[#191919] dark:border-white" />
      </span>
    )
  const Icon = id === 'keycloak' ? KeyRound : id === 'cas' ? Building : id === 'saml' ? ShieldCheck : Radar
  return (
    <span className={box}>
      <Icon className="size-5 text-muted" />
    </span>
  )
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-[0.95rem] font-semibold">{title}</h3>
        {text && <p className="text-[0.82rem] text-muted">{text}</p>}
      </div>
      {children}
    </section>
  )
}

/** Valeur à copier chez le fournisseur ou dans la zone DNS. */
function CopyValue({ label, value }: { label: string; value: string }) {
  const toast = useToast()
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[0.75rem] text-muted">{label}</p>
        <p className="truncate font-mono text-[0.8rem]">{value}</p>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`Copier : ${label}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value)
          toast('Copié', { text: label })
        }}
      >
        <Copy />
      </Button>
    </div>
  )
}

const HEADINGS: Record<Step, (name: string) => { title: string; text: string }> = {
  provider: () => ({ title: 'Quel fournisseur d’identité ?', text: 'Un service connu, ou un protocole standard si votre fournisseur n’est pas dans la liste.' }),
  connection: (name) => ({ title: `Connecter ${name}`, text: `Créez l’application chez ${name}, puis renseignez ses identifiants.` }),
  attributes: () => ({ title: 'Attributs et rôles', text: 'Comment Edualis remplit le profil et choisit le rôle de chaque membre.' }),
  domains: () => ({ title: 'Domaines', text: 'Seuls les domaines vérifiés sont redirigés vers votre fournisseur à la connexion.' }),
  test: () => ({ title: 'Test et activation', text: 'Une connexion d’essai, puis l’activation pour vos membres.' }),
}

/** Configuration de l'authentification unique d'une organisation : fournisseur, connexion, rôles, domaines, test. */
export function SsoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { workspace, updateWorkspace } = useStore()
  const toast = useToast()
  const existing = workspace.sso
  const [step, setStep] = useState<Step>(existing ? 'connection' : 'provider')
  const [draft, setDraft] = useState<SsoConfig>(existing ?? blankSso('entra', workspace.domain))
  const [newDomainName, setNewDomainName] = useState('')
  const [checking, setChecking] = useState<string | null>(null)
  const [discovered, setDiscovered] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [testing, setTesting] = useState(false)

  const info = ssoProvider(draft.provider)
  const index = STEPS.findIndex((item) => item.id === step)
  const missing = missingFields(draft)
  const blockers = activationBlockers(draft)
  const verified = draft.domains.filter((item) => item.verified)
  const busy = testing || discovering || checking !== null
  const heading = HEADINGS[step](info.name)

  const close = (next: boolean) => {
    if (!busy) onOpenChange(next)
  }
  // Toute modification de la connexion ou des attributs invalide le dernier test.
  const change = (patch: Partial<SsoConfig>) => setDraft((prev) => ({ ...prev, ...patch, testedAt: null }))
  const setSetting = (key: string, value: string) => {
    if (key === 'issuer') setDiscovered(false)
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value }, testedAt: null }))
  }

  // Une étape n'est accessible que si les précédentes sont remplies.
  const reachable = (target: Step) => {
    const at = STEPS.findIndex((item) => item.id === target)
    if (at <= 1) return true
    if (missing.length) return false
    if (at === 4) return verified.length > 0
    return true
  }
  const nextStep = STEPS[index + 1]

  const discover = () => {
    setDiscovering(true)
    window.setTimeout(() => {
      setDiscovering(false)
      setDiscovered(true)
    }, 900)
  }
  const verifyDomain = (name: string) => {
    setChecking(name)
    window.setTimeout(() => {
      setChecking(null)
      setDraft((prev) => ({ ...prev, domains: prev.domains.map((item) => (item.name === name ? { ...item, verified: true } : item)) }))
      toast(`${name} vérifié`, { text: 'L’enregistrement TXT a été trouvé.' })
    }, 1100)
  }
  const addDomain = () => {
    const name = newDomainName.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(name) || draft.domains.some((item) => item.name === name)) return
    setDraft((prev) => ({ ...prev, domains: [...prev.domains, newDomain(name)] }))
    setNewDomainName('')
  }
  const runTest = () => {
    setTesting(true)
    window.setTimeout(() => {
      setTesting(false)
      setDraft((prev) => ({ ...prev, testedAt: TODAY }))
    }, 1600)
  }
  const save = (status: SsoConfig['status']) => {
    updateWorkspace({ sso: { ...draft, status, enforced: status === 'active' && draft.enforced } })
    toast(status === 'active' ? `SSO activé avec ${info.name}` : 'Brouillon enregistré', {
      text: status === 'active' ? `Les adresses ${verified.map((item) => `@${item.name}`).join(', ')} se connectent avec le SSO.` : 'Rien n’est actif tant que vous n’activez pas le SSO.',
    })
    onOpenChange(false)
  }

  // Ce que renvoie le fournisseur pendant le test (profil d'exemple).
  const sampleDomain = verified[0]?.name ?? 'exemple.fr'
  const sampleGroup = draft.roleRules[0]?.value || 'Enseignants'
  const sampleRole = draft.roleRules.find((rule) => rule.value === sampleGroup)?.role ?? draft.defaultRole
  const sample: Record<keyof SsoMapping, string> = { email: `c.martin@${sampleDomain}`, firstName: 'Camille', lastName: 'Martin' }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={close}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="dialog-content fixed top-1/2 left-1/2 z-50 flex h-[min(50rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.4rem] bg-card shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-line outline-none">
          {/* Étapes */}
          <nav aria-label="Étapes de configuration" className="hidden w-60 shrink-0 flex-col border-r border-line bg-bg-alt/50 p-5 md:flex">
            <DialogPrimitive.Title className="font-serif text-[1.15rem] leading-tight font-semibold tracking-[-0.02em]">Authentification unique</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-[0.78rem] text-muted">{workspace.name}</DialogPrimitive.Description>
            <ol className="mt-6 space-y-1">
              {STEPS.map((item, position) => {
                const active = item.id === step
                const done = position < index
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!reachable(item.id) || busy}
                      onClick={() => setStep(item.id)}
                      aria-current={active ? 'step' : undefined}
                      className={cn('flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors disabled:opacity-45', active ? 'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--line)]' : 'hover:bg-fg/[0.04]')}
                    >
                      <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.68rem] font-semibold', done ? 'bg-fg text-bg' : active ? 'bg-accent text-accent-fg' : 'ring-1 ring-line-strong ring-inset')}>{done ? <Check className="size-3" strokeWidth={3} /> : position + 1}</span>
                      <span className="min-w-0">
                        <span className={cn('block text-[0.85rem]', active && 'font-medium')}>{item.label}</span>
                        <span className="block text-[0.72rem] text-muted">{item.text}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="mt-auto flex items-center gap-2.5 rounded-xl bg-card p-3 ring-1 ring-line ring-inset">
              <ProviderMark id={draft.provider} className="size-8 rounded-lg [&_svg]:size-4" />
              <span className="min-w-0 text-[0.75rem]">
                <span className="block truncate font-medium">{info.name}</span>
                <span className="block text-muted">
                  {info.protocol} · {existing?.status === 'active' ? 'actif' : 'brouillon'}
                </span>
              </span>
            </div>
          </nav>

          {/* Contenu */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
              <div>
                <p className="text-[0.75rem] text-muted md:hidden">
                  Étape {index + 1} sur {STEPS.length}
                </p>
                <h2 className="font-serif text-[1.35rem] leading-tight font-semibold tracking-[-0.02em]">{heading.title}</h2>
                <p className="mt-1 text-[0.85rem] text-muted">{heading.text}</p>
              </div>
              <DialogPrimitive.Close aria-label="Fermer" disabled={busy} className="-mt-1 -mr-2 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-8">
              {step === 'provider' && (
                <div className="space-y-7">
                  {(['provider', 'protocol'] as const).map((kind) => (
                    <Section key={kind} title={kind === 'provider' ? 'Fournisseurs' : 'Protocoles standards'} text={kind === 'protocol' ? 'Pour ADFS, Shibboleth, RENATER, Authentik, Auth0… ou un serveur CAS universitaire.' : undefined}>
                      <div role="radiogroup" aria-label={kind === 'provider' ? 'Fournisseurs' : 'Protocoles standards'} className="grid gap-3 sm:grid-cols-2">
                        {SSO_PROVIDERS.filter((item) => item.kind === kind).map((item) => {
                          const on = draft.provider === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => {
                                if (!on) setDraft({ ...blankSso(item.id, workspace.domain), domains: draft.domains })
                                setDiscovered(false)
                              }}
                              className={cn('flex items-center gap-3 rounded-2xl p-3.5 text-left ring-1 transition-shadow ring-inset', on ? 'bg-accent-soft/40 ring-2 ring-accent' : 'ring-line-strong hover:bg-bg-alt')}
                            >
                              <ProviderMark id={item.id} />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">{item.name}</span>
                                  {item.kind === 'provider' && <span className="rounded-full bg-fg/[0.06] px-2 py-0.5 text-[0.68rem] font-medium text-muted">{item.protocol}</span>}
                                </span>
                                <span className="block truncate text-[0.8rem] text-muted">{item.text}</span>
                              </span>
                              <span className={cn('size-4 shrink-0 rounded-full ring-1 ring-line-strong ring-inset', on && 'ring-[5px] ring-accent')} />
                            </button>
                          )
                        })}
                      </div>
                    </Section>
                  ))}
                </div>
              )}

              {step === 'connection' && (
                <div className="space-y-8">
                  <Section title={`1. Chez ${info.name}`} text="Créez l’application qui représente Edualis.">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <ol className="space-y-2.5 text-[0.85rem]">
                        {info.guide.map((line, position) => (
                          <li key={line} className="flex gap-3">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-[0.7rem] font-semibold text-muted">{position + 1}</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="h-fit divide-y divide-line rounded-2xl ring-1 ring-line ring-inset">
                        {serviceProvider(workspace.id, info.protocol).map((item) => (
                          <CopyValue key={item.label} {...item} />
                        ))}
                      </div>
                    </div>
                  </Section>

                  <Section title="2. Dans Edualis" text={`Les identifiants de l’application ${info.name}.`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {visibleFields(draft).map((field) => {
                        const id = `sso-${field.key}`
                        const value = draft.settings[field.key] ?? ''
                        const wide = field.type === 'textarea' || field.type === 'url' || field.key === 'clientSecret' || field.key === 'source'
                        return (
                          <Field key={field.key} label={field.optional ? `${field.label} (facultatif)` : field.label} htmlFor={id} hint={field.hint?.replace('{issuer}', draft.settings.issuer?.replace(/\/$/, '') || 'issuer')} className={cn(wide && 'sm:col-span-2')}>
                            {field.type === 'select' ? (
                              <Select id={id} value={value} onValueChange={(next) => setSetting(field.key, next)} options={field.options ?? []} />
                            ) : field.type === 'textarea' ? (
                              <Textarea id={id} value={value} spellCheck={false} placeholder={field.placeholder} onChange={(event) => setSetting(field.key, event.target.value)} className="min-h-32 font-mono text-[0.78rem]" />
                            ) : field.key === 'issuer' ? (
                              <div className="flex gap-2">
                                <Input id={id} type="url" autoComplete="off" spellCheck={false} value={value} placeholder={field.placeholder} onChange={(event) => setSetting(field.key, event.target.value)} className="font-mono text-[0.85rem]" />
                                <Button variant="secondary" disabled={!value.trim() || discovering} onClick={discover} className="h-11 shrink-0">
                                  {discovering ? <Loader2 className="animate-spin" /> : <Radar />} Détecter
                                </Button>
                              </div>
                            ) : (
                              <Input id={id} type={field.type === 'secret' ? 'password' : field.type === 'url' ? 'url' : 'text'} autoComplete="off" spellCheck={false} value={value} placeholder={field.placeholder} onChange={(event) => setSetting(field.key, event.target.value)} className={cn(field.mono && 'font-mono text-[0.85rem]')} />
                            )}
                          </Field>
                        )
                      })}
                    </div>
                    {draft.provider === 'oidc' && discovered && (
                      <div className="mt-4 rounded-2xl bg-bg-alt p-4 text-[0.8rem]">
                        <p className="flex items-center gap-2 font-medium text-success">
                          <CircleCheck className="size-4" /> Configuration détectée
                        </p>
                        <dl className="mt-2 grid gap-x-4 gap-y-1 font-mono text-[0.75rem] sm:grid-cols-[9rem_minmax(0,1fr)]">
                          {[
                            ['authorization', '/authorize'],
                            ['token', '/token'],
                            ['userinfo', '/userinfo'],
                            ['jwks_uri', '/.well-known/jwks.json'],
                          ].map(([key, path]) => (
                            <div key={key} className="contents">
                              <dt className="text-muted">{key}</dt>
                              <dd className="truncate">
                                {draft.settings.issuer.replace(/\/$/, '')}
                                {path}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </Section>
                </div>
              )}

              {step === 'attributes' && (
                <div className="space-y-8">
                  <Section title="Profil" text="Le nom des attributs envoyés par le fournisseur.">
                    <div className="divide-y divide-line rounded-2xl ring-1 ring-line ring-inset">
                      {MAPPING_LABELS.map((item) => (
                        <div key={item.key} className="grid items-center gap-2 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                          <label htmlFor={`map-${item.key}`} className="text-[0.85rem] font-medium">
                            {item.label}
                          </label>
                          <Input id={`map-${item.key}`} spellCheck={false} value={draft.mapping[item.key]} onChange={(event) => change({ mapping: { ...draft.mapping, [item.key]: event.target.value } })} className="h-10 font-mono text-[0.8rem]" />
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Rôles" text="La première règle qui correspond l’emporte ; sinon, le rôle par défaut s’applique.">
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Attribut de rôle ou de groupe" htmlFor="role-attr">
                          <Input id="role-attr" spellCheck={false} value={draft.roleAttribute} onChange={(event) => change({ roleAttribute: event.target.value })} className="font-mono text-[0.85rem]" />
                        </Field>
                        <Field label="Rôle par défaut" htmlFor="role-default">
                          <Select id="role-default" value={draft.defaultRole} onValueChange={(value) => change({ defaultRole: value as Role })} options={ROLE_OPTIONS} />
                        </Field>
                      </div>
                      <div className="rounded-2xl ring-1 ring-line ring-inset">
                        <div className="grid grid-cols-[minmax(0,1fr)_11rem_2rem] gap-3 border-b border-line px-4 py-2 text-[0.75rem] text-muted">
                          <span>Si la valeur contient</span>
                          <span>Rôle Edualis</span>
                          <span />
                        </div>
                        {draft.roleRules.map((rule) => (
                          <div key={rule.id} className="grid grid-cols-[minmax(0,1fr)_11rem_2rem] items-center gap-3 border-b border-line px-4 py-2.5">
                            <Input aria-label="Valeur reçue" spellCheck={false} placeholder="Enseignants" value={rule.value} onChange={(event) => change({ roleRules: draft.roleRules.map((item) => (item.id === rule.id ? { ...item, value: event.target.value } : item)) })} className="h-10 font-mono text-[0.8rem]" />
                            <Select aria-label="Rôle Edualis" value={rule.role} onValueChange={(value) => change({ roleRules: draft.roleRules.map((item) => (item.id === rule.id ? { ...item, role: value as Role } : item)) })} options={ROLE_OPTIONS} size="sm" />
                            <Button size="icon-sm" variant="ghost" aria-label="Supprimer la règle" onClick={() => change({ roleRules: draft.roleRules.filter((item) => item.id !== rule.id) })}>
                              <Trash2 />
                            </Button>
                          </div>
                        ))}
                        <div className="px-2 py-2">
                          <Button variant="ghost" onClick={() => change({ roleRules: [...draft.roleRules, { id: Math.random().toString(36).slice(2, 9), value: '', role: 'teacher' }] })}>
                            <Plus /> Ajouter une règle
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Comptes">
                    <label className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 ring-1 ring-line ring-inset">
                      <span>
                        <span className="block text-[0.9rem] font-medium">Créer les comptes à la première connexion</span>
                        <span className="block text-[0.8rem] text-muted">Sinon, seuls les membres déjà invités peuvent se connecter.</span>
                      </span>
                      <Switch checked={draft.jit} onCheckedChange={(value) => change({ jit: value })} />
                    </label>
                  </Section>
                </div>
              )}

              {step === 'domains' && (
                <div className="space-y-5">
                  {draft.domains.length === 0 && <p className="rounded-2xl bg-bg-alt p-4 text-[0.85rem] text-muted">Ajoutez le domaine des adresses e-mail de vos membres.</p>}
                  <ul className="space-y-3">
                    {draft.domains.map((domain) => (
                      <li key={domain.name} className="rounded-2xl ring-1 ring-line ring-inset">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="min-w-0 flex-1 truncate font-mono text-[0.9rem]">@{domain.name}</span>
                          {domain.verified ? <Badge tone="success">Vérifié</Badge> : <Badge tone="warning">En attente</Badge>}
                          {!domain.verified && (
                            <Button variant="secondary" disabled={checking !== null} onClick={() => verifyDomain(domain.name)}>
                              {checking === domain.name && <Loader2 className="animate-spin" />} Vérifier
                            </Button>
                          )}
                          <Button size="icon-sm" variant="ghost" aria-label={`Retirer ${domain.name}`} onClick={() => setDraft((prev) => ({ ...prev, domains: prev.domains.filter((item) => item.name !== domain.name) }))}>
                            <Trash2 />
                          </Button>
                        </div>
                        {!domain.verified && (
                          <div className="border-t border-line px-4 py-3">
                            <p className="mb-2 text-[0.8rem] text-muted">Ajoutez cet enregistrement dans la zone DNS de {domain.name}, puis cliquez sur Vérifier.</p>
                            <div className="divide-y divide-line rounded-xl bg-bg-alt">
                              <CopyValue label="Type et nom" value={`TXT  _edualis.${domain.name}`} />
                              <CopyValue label="Valeur" value={domain.token} />
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      addDomain()
                    }}
                    className="flex gap-2"
                  >
                    <Input aria-label="Nouveau domaine" spellCheck={false} placeholder="ac-rennes.fr" value={newDomainName} onChange={(event) => setNewDomainName(event.target.value)} className="font-mono text-[0.85rem]" />
                    <Button type="submit" variant="secondary" disabled={!newDomainName.trim()} className="h-11 shrink-0">
                      <Plus /> Ajouter
                    </Button>
                  </form>
                </div>
              )}

              {step === 'test' && (
                <div className="space-y-6">
                  {testing ? (
                    <div className="flex flex-col items-center gap-3 py-14 text-center">
                      <Loader2 className="size-7 animate-spin text-accent" />
                      <p className="font-medium">Connexion à {info.name}…</p>
                      <p className="max-w-sm text-[0.85rem] text-muted">{info.protocol === 'CAS' ? 'Redirection vers le serveur CAS, puis validation du ticket.' : info.protocol === 'SAML 2.0' ? 'Envoi d’une requête SAML, puis vérification de la signature de l’assertion.' : 'Échange du code d’autorisation, puis vérification du jeton d’identité.'}</p>
                    </div>
                  ) : draft.testedAt ? (
                    <>
                      <div className="flex items-start gap-3 rounded-2xl bg-success-soft p-4 text-success">
                        <CircleCheck className="mt-0.5 size-5 shrink-0" />
                        <div className="flex-1 text-[0.88rem]">
                          <p className="font-semibold">Connexion réussie</p>
                          <p className="opacity-90">
                            Testée le {formatDateShort(draft.testedAt)} · {info.protocol} · {info.protocol === 'SAML 2.0' ? 'assertion signée' : info.protocol === 'CAS' ? 'ticket validé' : 'jeton vérifié'}
                          </p>
                        </div>
                        <Button variant="ghost" onClick={runTest} className="-my-1 text-success hover:bg-success/10">
                          Relancer
                        </Button>
                      </div>
                      <div className="divide-y divide-line rounded-2xl text-[0.82rem] ring-1 ring-line ring-inset">
                        {MAPPING_LABELS.map((item) => (
                          <div key={item.key} className="grid grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2.5">
                            <span className="text-muted">{item.label}</span>
                            <span className="truncate font-mono text-[0.75rem] text-muted">{draft.mapping[item.key]}</span>
                            <span className="flex items-center gap-1.5 truncate font-medium">
                              <Check className="size-3.5 shrink-0 text-success" /> {sample[item.key]}
                            </span>
                          </div>
                        ))}
                        <div className="grid grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2.5">
                          <span className="text-muted">Rôle</span>
                          <span className="truncate font-mono text-[0.75rem] text-muted">
                            {draft.roleAttribute} = {sampleGroup}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <Check className="size-3.5 shrink-0 text-success" /> {ROLES[sampleRole].label}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl bg-bg-alt p-5 text-[0.85rem]">
                      <p className="font-medium">Connexion d’essai</p>
                      <p className="mt-1 text-muted">Edualis se connecte à {info.name}, vérifie la réponse et lit les attributs. Rien n’est encore actif pour vos membres.</p>
                      <Button className="mt-4" disabled={missing.length > 0 || verified.length === 0} onClick={runTest}>
                        Lancer le test
                      </Button>
                    </div>
                  )}

                  {!testing && (
                    <label className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 ring-1 ring-line ring-inset">
                      <span>
                        <span className="block text-[0.9rem] font-medium">Imposer le SSO</span>
                        <span className="block text-[0.8rem] text-muted">Les membres {verified.map((item) => `@${item.name}`).join(', ') || 'des domaines vérifiés'} ne pourront plus se connecter par mot de passe.</span>
                      </span>
                      <Switch checked={draft.enforced} onCheckedChange={(value) => setDraft((prev) => ({ ...prev, enforced: value }))} />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-card-alt/60 px-7 py-4">
              {index > 0 && (
                <Button variant="ghost" disabled={busy} onClick={() => setStep(STEPS[index - 1].id)}>
                  <ArrowLeft /> Retour
                </Button>
              )}
              {existing?.status === 'active' && (
                <Button
                  variant="danger-ghost"
                  disabled={busy}
                  onClick={() => {
                    updateWorkspace({ sso: { ...existing, status: 'disabled', enforced: false } })
                    toast('SSO désactivé', { text: 'Les membres se connectent de nouveau par e-mail et mot de passe.' })
                    onOpenChange(false)
                  }}
                >
                  Désactiver
                </Button>
              )}
              <span className="flex-1" />
              {step === 'connection' && missing.length > 0 && <p className="text-[0.8rem] text-muted">{missing.length === 1 ? `À renseigner : ${missing[0].label}` : `${missing.length} champs à renseigner`}</p>}
              {step === 'domains' && verified.length === 0 && <p className="text-[0.8rem] text-muted">Vérifiez au moins un domaine.</p>}
              {step === 'test' && !testing && blockers.length > 0 && <p className="text-[0.8rem] text-muted">{blockers[0]}</p>}
              {nextStep ? (
                <Button disabled={busy || !reachable(nextStep.id)} onClick={() => setStep(nextStep.id)}>
                  Continuer <ArrowRight />
                </Button>
              ) : existing?.status === 'active' ? (
                <Button disabled={busy || blockers.length > 0} onClick={() => save('active')}>
                  Enregistrer
                </Button>
              ) : (
                <>
                  <Button variant="secondary" disabled={busy} onClick={() => save('disabled')}>
                    Enregistrer le brouillon
                  </Button>
                  <Button variant="accent" disabled={busy || blockers.length > 0} onClick={() => save('active')}>
                    <ShieldCheck /> Activer le SSO
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

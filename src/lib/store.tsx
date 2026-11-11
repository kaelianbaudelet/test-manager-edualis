'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { appMonthly, periodAmount, productBySlug, type Billing, type Role } from './catalog'
import { createDemoState, findInvite, TODAY, tokenFrom, type DemoState, type Member, type User, type Workspace } from './demo-data'
import { blankSso, newDomain, type SsoConfig } from './sso'

// Store de démonstration : un état React gardé dans le navigateur (localStorage). Aucune requête réseau.
const STORAGE_KEY = 'edualis-manager-demo-v2'

type Cart = { slug: string; seats: number }[]
/** Achat validé sur la page Souscrire : logiciels et places, rythme, montant facturé. */
/** `method` : moyen de paiement saisi au checkout ; il devient celui de l'espace (sinon on garde l'actuel). */
export type Purchase = { cart: Cart; billing: Billing; total?: number; method?: Workspace['payment'] }

type Store = {
  ready: boolean
  state: DemoState
  workspace: Workspace
  isOrg: boolean
  canManage: boolean
  /** Logiciels accessibles à l'utilisateur dans l'espace courant (Pro attribué). */
  myApps: string[]
  signIn: (invite?: string) => void
  signOut: () => void
  /** Inscription. « Pour mon établissement » : l'organisation est créée en même temps, avec son premier abonnement payé. */
  signUp: (input: { user: Partial<User>; invite?: string; organization?: { name: string; type: string; purchase: Purchase } }) => void
  switchWorkspace: (id: string) => void
  setTheme: (theme: DemoState['theme']) => void
  updateUser: (patch: Partial<User>) => void
  updateWorkspace: (patch: Partial<Workspace>) => void
  subscribe: (cart: Cart, billing: Billing, total?: number) => void
  setSeats: (slug: string, seats: number) => void
  setBilling: (slug: string, billing: Billing) => void
  cancel: (slug: string) => void
  invite: (people: { name: string; email: string }[], role: Role, group: string, apps: string[]) => void
  updateMember: (id: string, patch: Partial<Member>) => void
  removeMembers: (ids: string[]) => void
  toggleMemberApp: (ids: string[], slug: string, on: boolean) => void
  /** Une organisation n'existe qu'avec un premier abonnement au tarif équipe : on la crée au moment du paiement. */
  createOrganization: (name: string, orgType: string, purchase: Purchase) => string
  joinOrganization: (token: string) => string | null
  declineInvite: (token: string) => void
  leaveWorkspace: (id: string) => void
  resetDemo: () => void
}

const StoreContext = createContext<Store | null>(null)

const uid = () => Math.random().toString(36).slice(2, 9)
const addMonths = (iso: string, months: number) => {
  const date = new Date(iso)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

function applyTheme(theme: DemoState['theme']) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * Un état sauvegardé par une version précédente de la démo peut manquer de champs ajoutés depuis :
 * on complète avec les valeurs par défaut au lieu de planter.
 */
/**
 * Anciens états enregistrés : `sso` / `ent` étaient de simples interrupteurs, puis une première configuration
 * (fournisseur « ent », domaines en texte). On les convertit au format actuel ; l'ENT, qui passait par CAS, devient CAS.
 */
function migrateSso(workspace: Workspace): SsoConfig | null {
  const legacy = workspace as Workspace & { sso: unknown; ent?: boolean }
  const raw = legacy.sso as (Omit<Partial<SsoConfig>, 'provider' | 'domains'> & { provider?: string; domains?: unknown[] }) | boolean | null | undefined
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.domains) && raw.domains.every((item) => typeof item === 'object') && raw.provider !== 'ent' && raw.roleRules) return raw as SsoConfig
    const provider = raw.provider === 'ent' || !raw.provider ? 'cas' : (raw.provider as SsoConfig['provider'])
    const base = blankSso(provider)
    const names = (raw.domains ?? []).map((item) => (typeof item === 'string' ? item : (item as { name: string }).name))
    return {
      ...base,
      settings: provider === 'cas' ? { casUrl: raw.settings?.casUrl ?? '', version: 'CAS 3.0' } : { ...base.settings, ...raw.settings },
      domains: names.map((name) => ({ ...newDomain(name), verified: true })),
      jit: raw.jit ?? true,
      enforced: raw.enforced ?? false,
      status: raw.status ?? 'disabled',
      testedAt: raw.testedAt ?? null,
    }
  }
  if (!legacy.ent && raw !== true) return null
  const config = blankSso(legacy.ent ? 'cas' : 'saml', workspace.domain)
  return { ...config, domains: config.domains.map((item) => ({ ...item, verified: true })), status: 'disabled' }
}

function withDefaults(saved: Partial<DemoState>): DemoState {
  const defaults = createDemoState()
  const workspaces = Array.isArray(saved.workspaces) && saved.workspaces.length ? saved.workspaces : defaults.workspaces
  return {
    ...defaults,
    ...saved,
    user: { ...defaults.user, ...saved.user },
    pendingInvites: Array.isArray(saved.pendingInvites) ? saved.pendingInvites : [],
    workspaces: workspaces.map((workspace) => ({ ...workspace, sso: migrateSso(workspace), groups: workspace.groups ?? [], members: workspace.members ?? [], invoices: workspace.invoices ?? [], subscriptions: workspace.subscriptions ?? [] })),
    currentId: workspaces.some((workspace) => workspace.id === saved.currentId) ? saved.currentId! : workspaces[0].id,
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(createDemoState)
  const [ready, setReady] = useState(false)

  // Lecture de l'état sauvegardé après le montage (le rendu serveur part toujours des données de démo).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation unique depuis le stockage local
      if (saved) setState(withDefaults(JSON.parse(saved) as Partial<DemoState>))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state, ready])

  useEffect(() => {
    applyTheme(state.theme)
    if (state.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [state.theme])

  const workspace = state.workspaces.find((item) => item.id === state.currentId) ?? state.workspaces[0]
  const isOrg = workspace.kind === 'organization'
  const canManage = workspace.role === 'owner' || workspace.role === 'admin'
  const me = workspace.members.find((member) => member.email.startsWith('c.martin') || member.id === 'm-me')
  const myApps = isOrg ? (canManage ? workspace.subscriptions.map((sub) => sub.slug) : (me?.apps ?? [])) : workspace.subscriptions.map((sub) => sub.slug)

  const patchWorkspace = useCallback((id: string, update: (workspace: Workspace) => Workspace) => {
    setState((prev) => ({ ...prev, workspaces: prev.workspaces.map((item) => (item.id === id ? update(item) : item)) }))
  }, [])

  const current = workspace.id

  const store = useMemo<Store>(
    () => ({
      ready,
      state,
      workspace,
      isOrg,
      canManage,
      myApps,
      signIn: (invite) =>
        setState((prev) => {
          const org = invite ? joinedOrg(invite, `${prev.user.firstName} ${prev.user.lastName}`, prev.user.email) : null
          if (!org || prev.workspaces.some((item) => item.name === org.name)) return { ...prev, signedIn: true }
          return { ...prev, signedIn: true, workspaces: [...prev.workspaces, org], currentId: org.id, pendingInvites: prev.pendingInvites.filter((token) => token !== tokenFrom(invite!)) }
        }),
      signOut: () => setState((prev) => ({ ...prev, signedIn: false })),
      signUp: ({ user, invite, organization }) => {
        const fresh = createDemoState()
        const personal: Workspace = { ...fresh.workspaces[0], subscriptions: [], invoices: [], payment: null }
        const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Nouveau compte'
        personal.billingAddress = { name, line: '', city: '' }
        const next: DemoState = { ...fresh, signedIn: true, user: { ...fresh.user, school: '', ...user }, workspaces: [personal], currentId: personal.id, pendingInvites: [] }
        if (organization) {
          const org = applyPurchase(blankOrg(organization.name, organization.type, name, user.email ?? ''), organization.purchase)
          next.workspaces.push(org)
          next.currentId = org.id
        }
        if (invite) {
          const org = joinedOrg(invite, name, user.email ?? '')
          if (org) {
            next.workspaces.push(org)
            next.currentId = org.id
          }
        }
        setState(next)
      },
      switchWorkspace: (id) => setState((prev) => ({ ...prev, currentId: id })),
      setTheme: (theme) => setState((prev) => ({ ...prev, theme })),
      updateUser: (patch) => setState((prev) => ({ ...prev, user: { ...prev.user, ...patch } })),
      updateWorkspace: (patch) => patchWorkspace(current, (item) => ({ ...item, ...patch })),
      subscribe: (cart, billing, total) => patchWorkspace(current, (item) => applyPurchase(item, { cart, billing, total })),
      setSeats: (slug, seats) => patchWorkspace(current, (item) => ({ ...item, subscriptions: item.subscriptions.map((sub) => (sub.slug === slug ? { ...sub, seats } : sub)) })),
      setBilling: (slug, billing) => patchWorkspace(current, (item) => ({ ...item, subscriptions: item.subscriptions.map((sub) => (sub.slug === slug ? { ...sub, billing } : sub)) })),
      cancel: (slug) =>
        patchWorkspace(current, (item) => ({
          ...item,
          subscriptions: item.subscriptions.filter((sub) => sub.slug !== slug),
          members: item.members.map((member) => ({ ...member, apps: member.apps.filter((app) => app !== slug) })),
        })),
      invite: (people, role, group, apps) =>
        patchWorkspace(current, (item) => {
          // Les places manquent ? Les premiers reçoivent l'accès, les suivants sont ajoutés sans accès Pro.
          const left = Object.fromEntries(apps.map((slug) => [slug, (item.subscriptions.find((sub) => sub.slug === slug)?.seats ?? 0) - seatsUsed(item, slug)]))
          const added = people.map((person) => {
            const granted = apps.filter((slug) => left[slug]-- > 0)
            return { id: uid(), name: person.name, email: person.email, role, group, status: 'invited' as const, apps: granted, lastSeen: null }
          })
          return { ...item, groups: group && !item.groups.includes(group) ? [...item.groups, group] : item.groups, members: [...added, ...item.members] }
        }),
      updateMember: (id, patch) => patchWorkspace(current, (item) => ({ ...item, members: item.members.map((member) => (member.id === id ? { ...member, ...patch } : member)) })),
      removeMembers: (ids) => patchWorkspace(current, (item) => ({ ...item, members: item.members.filter((member) => !ids.includes(member.id)) })),
      toggleMemberApp: (ids, slug, on) =>
        patchWorkspace(current, (item) => ({
          ...item,
          members: item.members.map((member) =>
            ids.includes(member.id) ? { ...member, apps: on ? [...new Set([...member.apps, slug])] : member.apps.filter((app) => app !== slug) } : member,
          ),
        })),
      createOrganization: (name, orgType, purchase) => {
        const org = applyPurchase(blankOrg(name, orgType, `${state.user.firstName} ${state.user.lastName}`, state.user.email), purchase)
        // On ne bascule pas tout de suite : l'écran de succès de la fenêtre de création doit rester affiché.
        setState((prev) => ({ ...prev, workspaces: [...prev.workspaces, org] }))
        return org.id
      },
      joinOrganization: (token) => {
        const org = joinedOrg(token, `${state.user.firstName} ${state.user.lastName}`, state.user.email)
        if (!org) return null
        const existing = state.workspaces.find((item) => item.name === org.name)
        const id = existing?.id ?? org.id
        setState((prev) => ({
          ...prev,
          workspaces: existing ? prev.workspaces : [...prev.workspaces, org],
          currentId: id,
          pendingInvites: prev.pendingInvites.filter((item) => item !== tokenFrom(token)),
        }))
        return id
      },
      declineInvite: (token) => setState((prev) => ({ ...prev, pendingInvites: prev.pendingInvites.filter((item) => item !== token) })),
      leaveWorkspace: (id) => setState((prev) => ({ ...prev, workspaces: prev.workspaces.filter((item) => item.id !== id), currentId: prev.currentId === id ? 'personal' : prev.currentId })),
      resetDemo: () => setState({ ...createDemoState(), signedIn: true }),
    }),
    [ready, state, workspace, isOrg, canManage, myApps, patchWorkspace, current],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

/** Ajoute les abonnements achetés à un espace, avec leur facture. Partagé par Souscrire et la création d'organisation. */
function applyPurchase(item: Workspace, { cart, billing, total, method }: Purchase): Workspace {
  const payment = method ?? item.payment ?? { kind: 'card' as const, brand: 'Visa', last4: '4242', exp: '08/28' }
  const team = item.kind === 'organization'
  const subscriptions = [...item.subscriptions]
  for (const line of cart) {
    const existing = subscriptions.findIndex((sub) => sub.slug === line.slug)
    const sub = { slug: line.slug, plan: 'pro' as const, seats: team ? line.seats : 1, billing, since: TODAY, renews: addMonths(TODAY, billing === 'annual' ? 12 : 1) }
    if (existing >= 0) subscriptions[existing] = { ...subscriptions[existing], seats: sub.seats, billing }
    else subscriptions.push(sub)
  }
  const amount = cart.reduce((sum, line) => sum + periodAmount(appMonthly(line.slug, team, line.seats), billing), 0)
  const names = cart.map((line) => productBySlug(line.slug)?.name).join(', ')
  const invoice = {
    id: uid(),
    number: `ED-2026-11-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    date: TODAY,
    amount: Math.round((total ?? amount) * 100) / 100,
    status: (payment.kind === 'order' ? 'due' : 'paid') as 'due' | 'paid',
    label: `${names} · ${billing === 'annual' ? 'annuel' : 'mensuel'}`,
  }
  // L'administrateur reçoit d'office une place sur les nouveaux logiciels de son organisation.
  const members = team
    ? item.members.map((member) => (member.id === 'm-me' ? { ...member, apps: [...new Set([...member.apps, ...cart.map((line) => line.slug)])] } : member))
    : item.members
  return { ...item, subscriptions, members, invoices: [invoice, ...item.invoices], payment }
}

function blankOrg(name: string, orgType: string, owner: string, email: string): Workspace {
  return {
    id: `org-${uid()}`,
    kind: 'organization',
    name,
    role: 'owner',
    orgType,
    color: '#0e7490',
    invite: { token: newToken(), expiry: '7d', enabled: true },
    subscriptions: [],
    members: [{ id: 'm-me', name: owner, email, role: 'admin', group: 'Direction', status: 'active', apps: [], lastSeen: TODAY }],
    invoices: [],
    groups: ['Direction', 'Enseignants'],
    sso: null,
    domainJoin: false,
    payment: null,
    billingAddress: { name, line: '', city: '' },
  }
}

/** Jeton aléatoire long : un lien ne se devine pas, contrairement à un code court. */
export const newToken = () => `${uid()}${uid()}`.slice(0, 12)

function joinedOrg(link: string, name: string, email: string): Workspace | null {
  const found = findInvite(link)
  if (!found) return null
  return {
    id: `org-${uid()}`,
    kind: 'organization',
    name: found.name,
    role: 'student',
    orgType: found.orgType,
    city: found.city,
    color: found.color,
    subscriptions: [
      { slug: 'cerise', plan: 'pro', seats: 240, billing: 'annual', since: '2026-09-01', renews: '2027-09-01' },
      { slug: 'citron', plan: 'pro', seats: 240, billing: 'annual', since: '2026-09-01', renews: '2027-09-01' },
    ],
    members: [{ id: 'm-me', name, email, role: 'student', group: found.group, status: 'active', apps: found.apps, lastSeen: TODAY }],
    invoices: [],
    groups: [found.group],
    // L'établissement qui invite a son CAS universitaire actif (démo).
    sso: { ...blankSso('cas'), settings: { casUrl: `https://cas.${found.name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.fr/cas`, version: 'CAS 3.0' }, status: 'active', testedAt: '2026-09-01' },
    domainJoin: false,
    payment: null,
    billingAddress: { name: found.name, line: '', city: found.city },
  }
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return store
}

/** Places occupées sur un logiciel d'une organisation (membres actifs ou invités qui y ont accès). */
export const seatsUsed = (workspace: Workspace, slug: string) => workspace.members.filter((member) => member.apps.includes(slug)).length

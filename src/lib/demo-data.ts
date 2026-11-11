// Données de démonstration : tout est simulé, rien n'est envoyé nulle part.
import type { SsoConfig } from './sso'
import { appMonthly, periodAmount, type Billing, type Role } from './catalog'

export type Subscription = { slug: string; plan: 'pro'; seats: number; billing: Billing; since: string; renews: string }

export type Member = {
  id: string
  name: string
  email: string
  role: Role
  group: string
  status: 'active' | 'invited'
  apps: string[]
  lastSeen: string | null
}

export type Invoice = {
  id: string
  number: string
  date: string
  amount: number
  status: 'paid' | 'due' | 'refunded'
  label: string
}

export type Workspace = {
  id: string
  kind: 'personal' | 'organization'
  name: string
  /** Rôle de l'utilisateur connecté dans cet espace. */
  role: 'owner' | Role
  orgType?: string
  uai?: string
  domain?: string
  city?: string
  /** Lien d'invitation : jeton secret, durée de validité, actif ou non. Pas de code court, pour des raisons de sécurité. */
  invite?: { token: string; expiry: InviteExpiry; enabled: boolean }
  color: string
  subscriptions: Subscription[]
  members: Member[]
  invoices: Invoice[]
  groups: string[]
  /** Authentification unique de l'organisation (ENT, CAS, SAML, OIDC…), ou rien. */
  sso: SsoConfig | null
  domainJoin: boolean
  payment: { kind: 'card'; brand: string; last4: string; exp: string } | { kind: 'sepa'; iban: string } | { kind: 'order' } | null
  billingAddress: { name: string; line: string; city: string; vat?: string }
}

/** Un authentificateur ou une clé d'accès, renommable. */
export type Credential = { id: string; name: string; createdAt: string }

export type User = {
  firstName: string
  lastName: string
  email: string
  status: 'Étudiant' | 'Enseignant' | 'Indépendant' | 'Personnel administratif'
  school: string
  /** Applications d'authentification (TOTP) de la vérification en 2 étapes : deux au plus. */
  authenticators: Credential[]
  /** Clés d'accès (WebAuthn) : Face ID, Touch ID, Windows Hello, clé physique… */
  passkeys: Credential[]
  /** Codes de secours, générés avec le premier authentificateur. Vides tant que la 2FA n'est pas activée. */
  backupCodes: string[]
  newsletter: boolean
  productNews: boolean
}

export type DemoState = {
  signedIn: boolean
  user: User
  workspaces: Workspace[]
  currentId: string
  /** Invitations reçues par e-mail, pas encore acceptées (jetons des liens). */
  pendingInvites: string[]
  theme: 'light' | 'dark' | 'system'
}

export const TODAY = '2026-11-10'

const FIRST = ['Inès', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Lucas', 'Manon', 'Yanis', 'Jade', 'Théo', 'Camille', 'Adam', 'Zoé', 'Noah', 'Louise', 'Ethan', 'Sarah', 'Gabriel', 'Lina', 'Raphaël', 'Emma', 'Malo', 'Rose', 'Sacha', 'Anna', 'Arthur', 'Mila', 'Jules', 'Alice', 'Tom', 'Nina', 'Paul', 'Eva', 'Léon', 'Romane', 'Axel', 'Lou', 'Mathis', 'Clara', 'Enzo', 'Maëlys', 'Victor', 'Juliette', 'Liam']
const LAST = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefèvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefebvre', 'Faure', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'François', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clément', 'Morin']

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')

function seedMembers(domain: string): Member[] {
  const members: Member[] = [
    { id: 'm-me', name: 'Camille Martin', email: `c.martin@${domain}`, role: 'admin', group: 'Direction', status: 'active', apps: ['cerise', 'myrtille', 'figue'], lastSeen: TODAY },
    { id: 'm-t1', name: 'Julien Garnier', email: `j.garnier@${domain}`, role: 'teacher', group: 'Enseignants', status: 'active', apps: ['cerise', 'myrtille', 'figue'], lastSeen: '2026-11-09' },
    { id: 'm-t2', name: 'Sophie Lambert', email: `s.lambert@${domain}`, role: 'teacher', group: 'Enseignants', status: 'active', apps: ['cerise', 'figue'], lastSeen: '2026-11-10' },
    { id: 'm-t3', name: 'Karim Benali', email: `k.benali@${domain}`, role: 'teacher', group: 'Enseignants', status: 'active', apps: ['myrtille', 'figue'], lastSeen: '2026-11-06' },
    { id: 'm-t4', name: 'Hélène Roussel', email: `h.roussel@${domain}`, role: 'teacher', group: 'Enseignants', status: 'invited', apps: ['figue'], lastSeen: null },
  ]
  for (let index = 0; index < 40; index += 1) {
    const first = FIRST[index % FIRST.length]
    const last = LAST[(index * 7) % LAST.length]
    const group = index < 22 ? 'BTS SIO 1' : 'BTS SIO 2'
    const apps = ['cerise']
    if (index >= 22 || index % 3 === 0) apps.push('myrtille')
    const invited = index % 13 === 5
    const day = 10 - (index % 9)
    members.push({
      id: `m-s${index}`,
      name: `${first} ${last}`,
      email: `${slugify(first)}.${slugify(last)}@${domain}`,
      role: 'student',
      group,
      status: invited ? 'invited' : 'active',
      apps,
      lastSeen: invited ? null : `2026-11-${String(day).padStart(2, '0')}`,
    })
  }
  return members
}

function monthlyInvoices(prefix: string, amount: number, label: string, count: number): Invoice[] {
  return Array.from({ length: count }, (_, index) => {
    const month = 11 - index
    const year = month > 0 ? 2026 : 2025
    const m = ((month - 1 + 12) % 12) + 1
    return {
      id: `${prefix}-${index}`,
      number: `ED-${year}-${String(m).padStart(2, '0')}${String(140 + index * 3).padStart(4, '0')}`,
      date: `${year}-${String(m).padStart(2, '0')}-01`,
      amount,
      status: 'paid' as const,
      label,
    }
  })
}

const ORG_SUBS: Subscription[] = [
  { slug: 'cerise', plan: 'pro', seats: 60, billing: 'annual', since: '2025-09-01', renews: '2027-09-01' },
  { slug: 'myrtille', plan: 'pro', seats: 30, billing: 'annual', since: '2025-09-01', renews: '2027-09-01' },
  { slug: 'figue', plan: 'pro', seats: 10, billing: 'annual', since: '2026-01-12', renews: '2027-09-01' },
]

const annualOf = (slugs: string[]) =>
  Math.round(ORG_SUBS.filter((sub) => slugs.includes(sub.slug)).reduce((sum, sub) => sum + periodAmount(appMonthly(sub.slug, true, sub.seats), 'annual'), 0) * 100) / 100

export function createDemoState(): DemoState {
  const domain = 'lycee-jeanmoulin.fr'
  return {
    signedIn: false,
    theme: 'system',
    user: {
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille.martin@exemple.fr',
      status: 'Enseignant',
      school: 'Lycée Jean-Moulin',
      authenticators: [],
      passkeys: [{ id: 'pk-macbook', name: 'MacBook Air', createdAt: '2026-09-03' }],
      backupCodes: [],
      newsletter: false,
      productNews: true,
    },
    currentId: 'personal',
    pendingInvites: ['iutl-7f3k9q2m'],
    workspaces: [
      {
        id: 'personal',
        kind: 'personal',
        name: 'Personnel',
        role: 'owner',
        color: '#1a1a19',
        subscriptions: [{ slug: 'cerise', plan: 'pro', seats: 1, billing: 'monthly', since: '2026-03-01', renews: '2026-12-01' }],
        members: [],
        invoices: monthlyInvoices('p', 3.98, 'Cerise Pro · mensuel', 9),
        groups: [],
        sso: null,
        domainJoin: false,
        payment: { kind: 'card', brand: 'Visa', last4: '4242', exp: '08/28' },
        billingAddress: { name: 'Camille Martin', line: '12 rue des Lilas', city: '35000 Rennes' },
      },
      {
        id: 'org-jm',
        kind: 'organization',
        name: 'Lycée Jean-Moulin',
        role: 'owner',
        orgType: 'Lycée',
        uai: '0350029K',
        domain,
        city: 'Rennes',
        invite: { token: 'jm-8f3k9q2mx7', expiry: '7d', enabled: true },
        color: '#0e7490',
        subscriptions: ORG_SUBS,
        members: seedMembers(domain),
        invoices: [
          { id: 'o-2', number: 'ED-2026-01-0311', date: '2026-01-12', amount: 199.2, status: 'paid', label: 'Figue Pro · 10 places · prorata' },
          { id: 'o-1', number: 'ED-2025-09-0187', date: '2025-09-01', amount: annualOf(['cerise', 'myrtille']), status: 'paid', label: 'Cerise, Myrtille · annuel' },
          { id: 'o-0', number: 'ED-2025-08-0112', date: '2025-08-20', amount: 0, status: 'refunded', label: 'Essai 30 jours · 3 logiciels' },
        ],
        groups: ['Direction', 'Enseignants', 'BTS SIO 1', 'BTS SIO 2'],
        // SSO Microsoft Entra ID (Microsoft 365 Éducation du lycée), actif pour le domaine vérifié.
        sso: {
          provider: 'entra',
          settings: { tenant: '3f1c2a9e-5b7d-4e21-9c8a-1d2e3f4a5b6c', clientId: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d', clientSecret: 'demo-secret' },
          mapping: { email: 'preferred_username', firstName: 'given_name', lastName: 'family_name' },
          roleAttribute: 'groups',
          roleRules: [
            { id: 'r1', value: 'Direction', role: 'admin' },
            { id: 'r2', value: 'Enseignants', role: 'teacher' },
            { id: 'r3', value: 'Élèves', role: 'student' },
          ],
          defaultRole: 'student',
          domains: [{ name: domain, verified: true, token: 'edualis-verification=7k2m9q4x8p3n' }],
          jit: true,
          enforced: false,
          status: 'active',
          testedAt: '2026-11-02',
        },
        domainJoin: true,
        payment: { kind: 'order' },
        billingAddress: { name: 'Lycée Jean-Moulin · Service intendance', line: '23 boulevard de Strasbourg', city: '35000 Rennes', vat: 'FR 41 193 500 290' },
      },
    ],
  }
}

export type InviteExpiry = '24h' | '7d' | '30d'
export const EXPIRY_LABELS: Record<InviteExpiry, string> = { '24h': '24 heures', '7d': '7 jours', '30d': '30 jours' }

/** Adresse complète d'un lien d'invitation. */
export const inviteUrl = (token: string) => `https://manager.edualis.fr/invitation/${token}`

/** Jeton d'un lien collé (ou du jeton seul). */
export const tokenFrom = (input: string) => input.trim().split(/[/?#]/).filter(Boolean).pop()?.toLowerCase() ?? ''

/** Invitations valides de la démo, par jeton (simulation : dans la vraie app, le serveur vérifie le lien). */
export type Invitation = { name: string; orgType: string; city: string; color: string; invitedBy: string; group: string; apps: string[]; expires: string }
export const JOINABLE: Record<string, Invitation> = {
  'iutl-7f3k9q2m': { name: 'IUT de Lannion', orgType: 'IUT', city: 'Lannion', color: '#5f9e1f', invitedBy: 'Marc Le Goff', group: 'BUT Info 2', apps: ['cerise', 'citron'], expires: '2026-11-17' },
  'insa-if-4h8w2c': { name: 'INSA Lyon · Département IF', orgType: 'École d’ingénieurs', city: 'Villeurbanne', color: '#7c4dcc', invitedBy: 'Claire Dumas', group: '3IF', apps: ['cerise', 'citron'], expires: '2026-11-15' },
}
export const DEMO_INVITES = Object.keys(JOINABLE).map(inviteUrl)

export const findInvite = (input: string) => JOINABLE[tokenFrom(input)]

/**
 * Établissement dont le SSO est actif pour un domaine d'e-mail (simulation de l'annuaire côté serveur).
 * On cherche dans les organisations connues du navigateur, puis dans celles de la démo : la détection ne dépend donc
 * pas de l'état enregistré (une inscription repart d'un état vide).
 */
export function findSsoOrganization(email: string, known: Workspace[] = []) {
  const domain = email.trim().toLowerCase().split('@')[1]
  if (!domain) return undefined
  return [...known, ...createDemoState().workspaces].find((item) => item.kind === 'organization' && item.sso?.status === 'active' && item.sso.domains.some((entry) => entry.verified && entry.name === domain))
}

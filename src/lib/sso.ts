// Authentification unique (SSO) d'une organisation : fournisseurs et protocoles pris en charge, paramètres, guide de
// configuration, correspondance des attributs et des rôles, domaines vérifiés. Simulation : rien n'est contacté.
import type { Role } from './catalog'

export type SsoProvider = 'entra' | 'google' | 'okta' | 'keycloak' | 'saml' | 'oidc' | 'cas'
export type SsoProtocol = 'SAML 2.0' | 'OpenID Connect' | 'CAS'

export type SsoMapping = { email: string; firstName: string; lastName: string }
/** Règle de rôle : si l'attribut de rôle contient `value`, le membre reçoit `role`. */
export type SsoRoleRule = { id: string; value: string; role: Role }
export type SsoDomain = { name: string; verified: boolean; token: string }

export type SsoConfig = {
  provider: SsoProvider
  /** Valeurs des champs du fournisseur (voir `SSO_PROVIDERS[provider].fields`). */
  settings: Record<string, string>
  mapping: SsoMapping
  /** Attribut qui porte le rôle ou les groupes, et les règles qui en déduisent le rôle Edualis. */
  roleAttribute: string
  roleRules: SsoRoleRule[]
  defaultRole: Role
  /** Domaines d'e-mail redirigés vers le fournisseur ; seuls les domaines vérifiés (DNS) sont pris en compte. */
  domains: SsoDomain[]
  /** Création du compte à la première connexion (sinon, il faut une invitation). */
  jit: boolean
  /** Les membres des domaines vérifiés ne peuvent plus se connecter par mot de passe. */
  enforced: boolean
  status: 'active' | 'disabled'
  /** Dernier test réussi (date ISO), exigé avant l'activation. */
  testedAt: string | null
}

export type SsoField = {
  key: string
  label: string
  placeholder?: string
  hint?: string
  type?: 'text' | 'url' | 'secret' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  optional?: boolean
  /** N'apparaît que si `settings[key] === value` (ex. mode d'import SAML). */
  when?: { key: string; value: string }
  mono?: boolean
}

export type SsoProviderInfo = {
  id: SsoProvider
  name: string
  protocol: SsoProtocol
  /** Fournisseur nommé, ou protocole générique (ADFS, Shibboleth, Authentik…). */
  kind: 'provider' | 'protocol'
  text: string
  /** Étapes à suivre chez le fournisseur (les valeurs Edualis à copier s'affichent à côté). */
  guide: string[]
  fields: SsoField[]
  mapping: SsoMapping
  roleAttribute: string
}

const SECRET: SsoField = { key: 'clientSecret', label: 'Secret client', type: 'secret', placeholder: '••••••••••••••••' }
const OIDC_MAPPING: SsoMapping = { email: 'email', firstName: 'given_name', lastName: 'family_name' }

export const SSO_PROVIDERS: SsoProviderInfo[] = [
  {
    id: 'entra',
    name: 'Microsoft Entra ID',
    protocol: 'OpenID Connect',
    kind: 'provider',
    text: 'Microsoft 365 Éducation, anciennement Azure AD.',
    guide: [
      'Dans le centre d’administration Microsoft Entra, ouvrez Inscriptions d’applications, puis Nouvelle inscription.',
      'Choisissez « Comptes dans cet annuaire uniquement » et ajoutez l’URI de redirection Edualis (type Web).',
      'Dans Certificats et secrets, créez un secret client et copiez sa valeur tout de suite.',
      'Dans Configuration du jeton, ajoutez la revendication facultative « groups » pour transmettre les rôles.',
    ],
    fields: [
      { key: 'tenant', label: 'ID de l’annuaire (locataire)', placeholder: '72f988bf-86f1-41af-91ab-2d7cd011db47', mono: true },
      { key: 'clientId', label: 'ID d’application (client)', placeholder: '6731de76-14a6-49ae-97bc-6eba6914391e', mono: true },
      SECRET,
    ],
    mapping: { email: 'preferred_username', firstName: 'given_name', lastName: 'family_name' },
    roleAttribute: 'groups',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    protocol: 'OpenID Connect',
    kind: 'provider',
    text: 'Google Workspace for Education.',
    guide: [
      'Dans la console Google Cloud, ouvrez API et services, puis Identifiants.',
      'Créez un ID client OAuth de type « Application Web » et ajoutez l’URI de redirection Edualis.',
      'Sur l’écran de consentement, choisissez le type d’utilisateur « Interne ».',
      'Copiez l’ID client et le code secret.',
    ],
    fields: [
      { key: 'clientId', label: 'ID client', placeholder: '1234567890-abc.apps.googleusercontent.com', mono: true },
      SECRET,
      { key: 'hd', label: 'Domaine autorisé', placeholder: 'mon-lycee.fr', hint: 'Seuls les comptes de ce domaine Google sont acceptés.', mono: true },
    ],
    mapping: OIDC_MAPPING,
    roleAttribute: 'hd',
  },
  {
    id: 'okta',
    name: 'Okta',
    protocol: 'OpenID Connect',
    kind: 'provider',
    text: 'Intégration OIDC dans votre organisation Okta.',
    guide: [
      'Dans l’administration Okta, ouvrez Applications, puis Create App Integration.',
      'Choisissez « OIDC - OpenID Connect » et « Web Application ».',
      'Ajoutez l’URI de redirection et l’URL de déconnexion Edualis.',
      'Assignez les groupes concernés, puis copiez le Client ID et le Client secret.',
    ],
    fields: [
      { key: 'domain', label: 'Domaine Okta', placeholder: 'mon-ecole.okta.com', mono: true },
      { key: 'clientId', label: 'Client ID', placeholder: '0oa1b2c3d4e5f6g7h8i9', mono: true },
      SECRET,
    ],
    mapping: OIDC_MAPPING,
    roleAttribute: 'groups',
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    protocol: 'OpenID Connect',
    kind: 'provider',
    text: 'Serveur Keycloak hébergé par votre établissement.',
    guide: [
      'Dans votre realm, ouvrez Clients, puis Create client (type OpenID Connect).',
      'Activez Client authentication et le flux Standard.',
      'Ajoutez l’URI de redirection Edualis dans Valid redirect URIs.',
      'Copiez le secret depuis l’onglet Credentials.',
    ],
    fields: [
      { key: 'baseUrl', label: 'URL du serveur', type: 'url', placeholder: 'https://sso.mon-ecole.fr', mono: true },
      { key: 'realm', label: 'Realm', placeholder: 'etablissement', mono: true },
      { key: 'clientId', label: 'Client ID', placeholder: 'edualis', mono: true },
      SECRET,
    ],
    mapping: OIDC_MAPPING,
    roleAttribute: 'realm_access.roles',
  },
  {
    id: 'saml',
    name: 'SAML 2.0',
    protocol: 'SAML 2.0',
    kind: 'protocol',
    text: 'ADFS, Shibboleth, RENATER, PingFederate, ou tout fournisseur SAML.',
    guide: [
      'Chez votre fournisseur, créez une application SAML 2.0 (relying party, service provider).',
      'Renseignez l’Entity ID et l’URL ACS Edualis, en liaison HTTP-POST.',
      'Choisissez l’adresse e-mail comme NameID et libérez les attributs prénom, nom et groupes.',
      'Récupérez l’URL de ses métadonnées, ou exportez-les en fichier XML.',
    ],
    fields: [
      {
        key: 'source',
        label: 'Configuration du fournisseur',
        type: 'select',
        options: [
          { value: 'url', label: 'URL des métadonnées' },
          { value: 'xml', label: 'Fichier de métadonnées XML' },
          { value: 'manual', label: 'Saisie manuelle' },
        ],
      },
      { key: 'metadataUrl', label: 'URL des métadonnées', type: 'url', placeholder: 'https://idp.mon-ecole.fr/idp/shibboleth', hint: 'Edualis relit les métadonnées chaque jour : les certificats se renouvellent seuls.', when: { key: 'source', value: 'url' }, mono: true },
      { key: 'metadataXml', label: 'Métadonnées XML', type: 'textarea', placeholder: '<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="…">', when: { key: 'source', value: 'xml' }, mono: true },
      { key: 'entityId', label: 'Entity ID du fournisseur', placeholder: 'https://idp.mon-ecole.fr/idp/shibboleth', when: { key: 'source', value: 'manual' }, mono: true },
      { key: 'ssoUrl', label: 'URL de connexion (SSO)', type: 'url', placeholder: 'https://idp.mon-ecole.fr/idp/profile/SAML2/Redirect/SSO', when: { key: 'source', value: 'manual' }, mono: true },
      { key: 'certificate', label: 'Certificat de signature X.509', type: 'textarea', placeholder: '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIE…\n-----END CERTIFICATE-----', when: { key: 'source', value: 'manual' }, mono: true },
      {
        key: 'nameId',
        label: 'Format du NameID',
        type: 'select',
        options: [
          { value: 'email', label: 'Adresse e-mail' },
          { value: 'persistent', label: 'Persistant' },
          { value: 'unspecified', label: 'Non spécifié' },
        ],
      },
      {
        key: 'signRequests',
        label: 'Requêtes d’authentification',
        type: 'select',
        options: [
          { value: 'signed', label: 'Signées (recommandé)' },
          { value: 'unsigned', label: 'Non signées' },
        ],
      },
    ],
    mapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    },
    roleAttribute: 'eduPersonAffiliation',
  },
  {
    id: 'oidc',
    name: 'OpenID Connect',
    protocol: 'OpenID Connect',
    kind: 'protocol',
    text: 'OAuth 2.0 avec OpenID Connect : Authentik, Auth0, Zitadel, Authelia…',
    guide: [
      'Chez votre fournisseur, créez un client confidentiel avec le flux « authorization code ».',
      'Ajoutez l’URI de redirection Edualis.',
      'Autorisez les scopes openid, email et profile (et groups si vous transmettez les rôles).',
      'Copiez l’issuer, le client ID et le secret.',
    ],
    fields: [
      { key: 'issuer', label: 'Issuer', type: 'url', placeholder: 'https://auth.mon-ecole.fr', hint: 'Edualis lit la configuration à {issuer}/.well-known/openid-configuration.', mono: true },
      { key: 'clientId', label: 'Client ID', placeholder: 'edualis', mono: true },
      SECRET,
      {
        key: 'authMethod',
        label: 'Authentification du client',
        type: 'select',
        options: [
          { value: 'client_secret_basic', label: 'client_secret_basic' },
          { value: 'client_secret_post', label: 'client_secret_post' },
          { value: 'private_key_jwt', label: 'private_key_jwt' },
        ],
      },
      { key: 'scopes', label: 'Scopes', placeholder: 'openid email profile groups', mono: true },
      {
        key: 'pkce',
        label: 'PKCE',
        type: 'select',
        options: [
          { value: 'S256', label: 'Activé (S256, recommandé)' },
          { value: 'off', label: 'Désactivé' },
        ],
      },
    ],
    mapping: OIDC_MAPPING,
    roleAttribute: 'groups',
  },
  {
    id: 'cas',
    name: 'CAS',
    protocol: 'CAS',
    kind: 'protocol',
    text: 'Apereo CAS, courant dans les universités.',
    guide: [
      'Déclarez Edualis dans le registre des services de votre serveur CAS, avec l’URL de service ci-contre.',
      'Autorisez la libération des attributs mail, givenName, sn et eduPersonAffiliation.',
      'Indiquez l’URL de base du serveur et la version du protocole.',
    ],
    fields: [
      { key: 'casUrl', label: 'URL du serveur CAS', type: 'url', placeholder: 'https://cas.univ-rennes.fr/cas', mono: true },
      {
        key: 'version',
        label: 'Version du protocole',
        type: 'select',
        options: [
          { value: 'CAS 3.0', label: 'CAS 3.0' },
          { value: 'CAS 2.0', label: 'CAS 2.0' },
          { value: 'SAML 1.1', label: 'SAML 1.1' },
        ],
      },
    ],
    mapping: { email: 'mail', firstName: 'givenName', lastName: 'sn' },
    roleAttribute: 'eduPersonAffiliation',
  },
]

export const ssoProvider = (id: SsoProvider) => SSO_PROVIDERS.find((item) => item.id === id) ?? SSO_PROVIDERS[0]

/** Ce qu'Edualis expose, à renseigner chez le fournisseur. */
export function serviceProvider(orgId: string, protocol: SsoProtocol) {
  const base = `https://manager.edualis.fr/sso/${orgId}`
  if (protocol === 'CAS') return [{ label: 'URL de service', value: `${base}/cas` }]
  if (protocol === 'SAML 2.0')
    return [
      { label: 'Entity ID (Audience)', value: base },
      { label: 'URL ACS (Assertion Consumer Service)', value: `${base}/acs` },
      { label: 'Métadonnées Edualis', value: `${base}/metadata.xml` },
    ]
  return [
    { label: 'URI de redirection', value: `${base}/callback` },
    { label: 'URL de déconnexion', value: `${base}/logout` },
  ]
}

const token = () => `edualis-verification=${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
export const newDomain = (name: string, verified = false): SsoDomain => ({ name, verified, token: token() })
const ruleId = () => Math.random().toString(36).slice(2, 9)

/** Règles de rôle proposées par défaut, selon l'attribut habituel du fournisseur. */
function defaultRules(attribute: string): SsoRoleRule[] {
  if (attribute === 'eduPersonAffiliation')
    return [
      { id: ruleId(), value: 'staff', role: 'admin' },
      { id: ruleId(), value: 'faculty', role: 'teacher' },
      { id: ruleId(), value: 'student', role: 'student' },
    ]
  if (attribute === 'hd') return []
  return [
    { id: ruleId(), value: 'Enseignants', role: 'teacher' },
    { id: ruleId(), value: 'Élèves', role: 'student' },
  ]
}

export function blankSso(provider: SsoProvider, domain?: string): SsoConfig {
  const info = ssoProvider(provider)
  const settings: Record<string, string> = {}
  for (const field of info.fields) if (field.type === 'select' && field.options) settings[field.key] = field.options[0].value
  if (provider === 'oidc') settings.scopes = 'openid email profile groups'
  if (provider === 'google' && domain) settings.hd = domain
  return {
    provider,
    settings,
    mapping: { ...info.mapping },
    roleAttribute: info.roleAttribute,
    roleRules: defaultRules(info.roleAttribute),
    defaultRole: 'student',
    domains: domain ? [newDomain(domain)] : [],
    jit: true,
    enforced: false,
    status: 'disabled',
    testedAt: null,
  }
}

/** Champs visibles (selon le mode choisi, ex. import SAML). */
export const visibleFields = (config: SsoConfig) => ssoProvider(config.provider).fields.filter((field) => !field.when || config.settings[field.when.key] === field.when.value)

/** Champs obligatoires encore vides (le test et l'activation restent bloqués tant qu'il en manque). */
export const missingFields = (config: SsoConfig) => visibleFields(config).filter((field) => !field.optional && !config.settings[field.key]?.trim())

/** Garde-fous à l'activation : un test réussi et au moins un domaine vérifié. */
export function activationBlockers(config: SsoConfig) {
  const blockers: string[] = []
  if (missingFields(config).length) blockers.push('Renseignez tous les champs de connexion.')
  if (!config.domains.some((item) => item.verified)) blockers.push('Vérifiez au moins un domaine.')
  if (!config.testedAt) blockers.push('Testez la connexion.')
  return blockers
}

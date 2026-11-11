'use client'

import { Building2, ChevronDown, ChevronRight, CircleHelp, LogOut, Moon, RotateCcw, ShieldCheck, Sun, SunMoon, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Avatar, WorkspaceBadge } from '@/components/ui/avatar'
import { Menu, MenuContent, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import type { DemoState } from '@/lib/demo-data'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

import { roleLabel } from './workspace-switcher'

const THEMES = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Auto', icon: SunMoon },
] as const satisfies readonly { value: DemoState['theme']; label: string; icon: unknown }[]

/** Menu du compte : identité, espace actif, raccourcis, thème et déconnexion. */
export function UserMenu() {
  const { state, workspace, isOrg, canManage, signOut, setTheme, resetDemo } = useStore()
  const router = useRouter()
  const toast = useToast()
  const { user } = state
  const fullName = `${user.firstName} ${user.lastName}`
  const secured = user.authenticators.length > 0 || user.passkeys.length > 0

  return (
    <Menu>
      <MenuTrigger
        aria-label={`Mon compte : ${fullName}`}
        className="group flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-fg/[0.06] data-[state=open]:bg-fg/[0.06] sm:pr-2.5"
      >
        <Avatar name={fullName} className="size-8 ring-2 ring-bg" />
        <span className="hidden max-w-32 truncate text-[0.85rem] font-medium sm:block">{user.firstName}</span>
        <ChevronDown className="hidden size-3.5 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
      </MenuTrigger>

      <MenuContent className="w-[18.5rem] p-1.5">
        {/* Carte d'identité : mène au profil. */}
        <MenuItem asChild className="gap-3 rounded-xl p-2.5">
          <Link href="/profil" className="group/id">
            <Avatar name={fullName} className="size-10 text-[0.8rem]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.9rem] leading-snug font-semibold">{fullName}</span>
              <span className="block truncate text-[0.78rem] leading-snug text-muted">{user.email}</span>
            </span>
            <ChevronRight className="transition-transform group-data-[highlighted]/id:translate-x-0.5" />
          </Link>
        </MenuItem>

        {/* Espace actif : rappelle dans quel contexte on agit. */}
        <div className="mx-1 mt-1 mb-1.5 flex items-center gap-2.5 rounded-xl bg-fg/[0.035] px-2.5 py-2">
          {isOrg ? <WorkspaceBadge name={workspace.name} color={workspace.color} className="size-6 rounded-[7px] text-[0.6rem]" /> : <UserRound className="size-4 text-muted" />}
          <span className="min-w-0 flex-1 truncate text-[0.8rem]">
            <span className="font-medium">{isOrg ? workspace.name : 'Espace personnel'}</span>
            <span className="text-muted"> · {isOrg ? roleLabel(workspace) : user.status}</span>
          </span>
        </div>

        <MenuSeparator />

        <MenuGroup>
          <MenuItem asChild>
            <Link href="/profil">
              <UserRound /> Profil et préférences
            </Link>
          </MenuItem>
          <MenuItem asChild>
            <Link href="/profil">
              <ShieldCheck /> Sécurité
              <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[0.68rem] font-medium', secured ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>{secured ? 'Protégé' : 'À renforcer'}</span>
            </Link>
          </MenuItem>
          {isOrg && canManage && (
            <MenuItem asChild>
              <Link href="/organisation">
                <Building2 /> Paramètres de l’organisation
              </Link>
            </MenuItem>
          )}
          <MenuItem onSelect={() => toast('Centre d’aide', { tone: 'info', text: 'Lien vers edualis.fr/help.' })}>
            <CircleHelp /> Aide et support
          </MenuItem>
        </MenuGroup>

        <MenuSeparator />

        {/* Thème : vrais éléments radio du menu, donc navigables aux flèches ; le menu reste ouvert au choix. */}
        <div className="flex items-center justify-between gap-3 py-1 pr-1 pl-2.5">
          <span className="text-[0.88rem]">Thème</span>
          <MenuRadioGroup value={state.theme} onValueChange={(value) => setTheme(value as DemoState['theme'])} className="flex rounded-full bg-fg/[0.06] p-0.5">
            {THEMES.map((option) => (
              <MenuRadioItem
                key={option.value}
                value={option.value}
                aria-label={option.label}
                title={option.label}
                onSelect={(event) => event.preventDefault()}
                className="grid size-7 cursor-pointer place-items-center rounded-full text-muted outline-none transition-colors data-[highlighted]:text-fg data-[state=checked]:bg-card data-[state=checked]:text-fg data-[state=checked]:shadow-[0_1px_3px_rgb(0_0_0/0.12)] data-[highlighted]:ring-2 data-[highlighted]:ring-accent/40"
              >
                <option.icon className="size-3.5" />
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </div>

        <MenuSeparator />

        <MenuItem
          onSelect={() => {
            resetDemo()
            router.push('/')
            toast('Démo réinitialisée')
          }}
          className="text-muted"
        >
          <RotateCcw /> Réinitialiser la démo
        </MenuItem>
        <MenuItem
          danger
          onSelect={() => {
            signOut()
            router.push('/connexion')
          }}
        >
          <LogOut /> Se déconnecter
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

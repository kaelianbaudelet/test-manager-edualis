'use client'

import { Check, ChevronsUpDown, Inbox, Plus, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Avatar, WorkspaceBadge } from '@/components/ui/avatar'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { ROLES } from '@/lib/catalog'
import type { Workspace } from '@/lib/demo-data'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

import { CreateOrgDialog, InvitationsDialog } from '../org-dialogs'

export const roleLabel = (workspace: Workspace) => (workspace.kind === 'personal' ? 'Compte personnel' : workspace.role === 'owner' ? 'Propriétaire' : ROLES[workspace.role].label)

function WorkspaceIcon({ workspace, name, className }: { workspace: Workspace; name: string; className?: string }) {
  return workspace.kind === 'personal' ? <Avatar name={name} color="#1a1a19" className={cn('rounded-[9px] dark:bg-white! dark:text-black', className)} /> : <WorkspaceBadge name={workspace.name} color={workspace.color} className={className} />
}

/** Sélecteur d'espace façon Linear : compte personnel et organisations, plus créer ou rejoindre. */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { state, workspace, switchWorkspace } = useStore()
  const router = useRouter()
  const [dialog, setDialog] = useState<'create' | 'join' | null>(null)
  const fullName = `${state.user.firstName} ${state.user.lastName}`

  const go = (id: string) => {
    switchWorkspace(id)
    router.push('/')
    onNavigate?.()
  }

  return (
    <>
      <Menu>
        <MenuTrigger className="group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-fg/[0.05] data-[state=open]:bg-fg/[0.05]">
          <WorkspaceIcon workspace={workspace} name={fullName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.88rem] leading-tight font-semibold">{workspace.kind === 'personal' ? fullName : workspace.name}</span>
            <span className="block truncate text-[0.75rem] leading-tight text-muted">{roleLabel(workspace)}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" />
        </MenuTrigger>
        <MenuContent align="start" className="w-72">
          <MenuLabel>Vos espaces</MenuLabel>
          {state.workspaces.map((item) => (
            <MenuItem key={item.id} onSelect={() => go(item.id)} className="py-1.5">
              <WorkspaceIcon workspace={item} name={fullName} className="size-7 text-[0.65rem]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.kind === 'personal' ? 'Personnel' : item.name}</span>
                <span className="block truncate text-[0.75rem] text-muted">{item.kind === 'personal' ? state.user.email : `${roleLabel(item)} · ${item.members.length} membre${item.members.length > 1 ? 's' : ''}`}</span>
              </span>
              {item.id === workspace.id && <Check className="text-fg!" />}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem onSelect={() => setDialog('create')}>
            <Plus /> Créer une organisation
          </MenuItem>
          <MenuItem onSelect={() => setDialog('join')}>
            <Inbox /> Invitations reçues
            {state.pendingInvites.length > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-accent text-[0.7rem] font-semibold text-accent-fg">{state.pendingInvites.length}</span>}
          </MenuItem>
          {workspace.kind !== 'personal' && (
            <MenuItem onSelect={() => go('personal')}>
              <User /> Revenir à mon compte personnel
            </MenuItem>
          )}
        </MenuContent>
      </Menu>
      <CreateOrgDialog open={dialog === 'create'} onOpenChange={(open) => setDialog(open ? 'create' : null)} onDone={onNavigate} />
      <InvitationsDialog open={dialog === 'join'} onOpenChange={(open) => setDialog(open ? 'join' : null)} onDone={onNavigate} />
    </>
  )
}

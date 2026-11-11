'use client'

import { Copy, Link2, RefreshCw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { EXPIRY_LABELS, inviteUrl, type InviteExpiry } from '@/lib/demo-data'
import { newToken, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Lien d'invitation de l'organisation : copier, choisir sa durée, le régénérer ou le désactiver. Pas de code court. */
export function InviteLinkPanel() {
  const { workspace, updateWorkspace } = useStore()
  const toast = useToast()
  const invite = workspace.invite ?? { token: newToken(), expiry: '7d' as InviteExpiry, enabled: false }
  const url = inviteUrl(invite.token)

  const copy = () => {
    navigator.clipboard?.writeText(url).catch(() => {})
    toast('Lien copié', { text: `Valable ${EXPIRY_LABELS[invite.expiry]}.` })
  }

  return (
    <div className="space-y-4">
      <div className={cn('rounded-2xl ring-1 ring-line-strong transition-opacity ring-inset', !invite.enabled && 'opacity-50')}>
        <div className="flex items-center gap-3 p-3 pl-4">
          <Link2 className="size-4 shrink-0 text-accent" />
          <p className="min-w-0 flex-1 truncate font-mono text-[0.82rem]" title={url}>
            {url}
          </p>
          <Button disabled={!invite.enabled} onClick={copy}>
            <Copy /> Copier
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-2.5 text-[0.8rem] text-muted">
          <span className="flex items-center gap-2">
            Expire après
            <Select
              size="sm"
              aria-label="Durée de validité"
              value={invite.expiry}
              disabled={!invite.enabled}
              onValueChange={(value) => updateWorkspace({ invite: { ...invite, expiry: value as InviteExpiry } })}
              className="h-7 w-auto min-w-0 pr-2 pl-3 text-[0.8rem]"
              options={(Object.keys(EXPIRY_LABELS) as InviteExpiry[]).map((key) => ({ value: key, label: EXPIRY_LABELS[key] }))}
            />
          </span>
          <button
            type="button"
            disabled={!invite.enabled}
            onClick={() => {
              updateWorkspace({ invite: { ...invite, token: newToken() } })
              toast('Nouveau lien généré', { text: 'L’ancien lien ne fonctionne plus.' })
            }}
            className="ml-auto inline-flex items-center gap-1.5 font-medium text-fg/80 hover:text-fg disabled:opacity-40"
          >
            <RefreshCw className="size-3.5" /> Régénérer
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-[0.9rem] font-medium">Lien actif</span>
          <span className="block text-[0.8rem] text-muted">Désactivez-le dès que tout le monde a rejoint.</span>
        </span>
        <Switch
          checked={invite.enabled}
          onCheckedChange={(enabled) => {
            updateWorkspace({ invite: { ...invite, enabled } })
            toast(enabled ? 'Lien d’invitation activé' : 'Lien d’invitation désactivé')
          }}
        />
      </label>

      <div className="flex gap-3 rounded-2xl bg-bg-alt p-4 text-[0.8rem] text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>Le lien contient une clé secrète impossible à deviner et expire automatiquement. Chaque personne qui l’utilise rejoint en tant qu’élève, et vous pouvez la retirer à tout moment.</p>
      </div>
    </div>
  )
}

import { CalendarClock, Users } from 'lucide-react'

import { AppIcon } from '@/components/app-icon'
import { productBySlug } from '@/lib/catalog'
import type { Invitation } from '@/lib/demo-data'
import { cn, formatDate, initials } from '@/lib/utils'

/** Résumé d'une invitation : qui invite, dans quelle organisation, avec quels logiciels. */
export function InvitationCard({ invitation, className, children }: { invitation: Invitation; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl bg-card ring-1 ring-line ring-inset', className)}>
      <div className="flex items-center gap-3.5 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[0.8rem] font-semibold text-white" style={{ backgroundColor: invitation.color }}>
          {initials(invitation.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{invitation.name}</p>
          <p className="truncate text-[0.82rem] text-muted">
            Invitation de {invitation.invitedBy} · {invitation.orgType}, {invitation.city}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-[0.8rem] text-muted">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {invitation.group}
        </span>
        <span className="flex items-center gap-1.5">
          {invitation.apps.map((slug) => (
            <span key={slug} className="size-4" title={productBySlug(slug)?.name}>
              <AppIcon product={productBySlug(slug)!} />
            </span>
          ))}
          {invitation.apps.map((slug) => productBySlug(slug)?.name).join(', ')}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" /> Expire le {formatDate(invitation.expires)}
        </span>
      </div>
      {children && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-3">{children}</div>}
    </div>
  )
}

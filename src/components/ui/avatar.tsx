import { cn, initials } from '@/lib/utils'

const PALETTE = ['#0e7490', '#4f5bd5', '#7c4dcc', '#5f9e1f', '#c2410c', '#be185d', '#64645f', '#0f766e']

export function Avatar({ name, className, color }: { name: string; className?: string; color?: string }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[0.72rem] font-semibold text-white', className)} style={{ backgroundColor: color ?? PALETTE[hash % PALETTE.length] }}>
      {initials(name)}
    </span>
  )
}

/** Pastille d'un espace : carré arrondi aux initiales (organisation) ou silhouette (compte personnel). */
export function WorkspaceBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-[9px] text-[0.7rem] font-semibold text-white', className)} style={{ backgroundColor: color }}>
      {initials(name)}
    </span>
  )
}

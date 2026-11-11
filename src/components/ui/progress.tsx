import { cn } from '@/lib/utils'

/** Jauge des places : passe en orange au-delà de 90 %, en rouge si c'est plein. */
export function SeatBar({ used, total, className, color }: { used: number; total: number; className?: string; color?: string }) {
  const ratio = total > 0 ? Math.min(1, used / total) : 0
  const tone = ratio >= 1 ? 'bg-danger' : ratio >= 0.9 ? 'bg-warning' : ''
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-fg/[0.07]', className)} role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used} aria-label="Places occupées">
      <div className={cn('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${ratio * 100}%`, backgroundColor: tone ? undefined : (color ?? 'var(--accent)') }} />
    </div>
  )
}

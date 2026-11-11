'use client'

import { Minus, Plus } from 'lucide-react'

import { clampSeats, MAX_SEATS, MIN_ORG_SEATS } from '@/lib/catalog'
import { cn } from '@/lib/utils'

/** Nombre de places : boutons − / + et champ éditable (repris du configurateur du site vitrine). */
export function SeatStepper({ value, onChange, size = 'md', min = MIN_ORG_SEATS, label = 'Nombre de places' }: { value: number; onChange: (value: number) => void; size?: 'sm' | 'md'; min?: number; label?: string }) {
  const small = size === 'sm'
  const clamp = (next: number) => Math.max(min, clampSeats(next))
  const button = cn('grid place-items-center rounded-full text-muted transition-colors hover:text-fg disabled:opacity-30', small ? 'size-8' : 'size-10')
  return (
    <div className="inline-flex items-center rounded-full bg-card ring-1 ring-line-strong transition-shadow ring-inset focus-within:ring-2 focus-within:ring-accent">
      <button type="button" aria-label="Retirer une place" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} className={button}>
        <Minus aria-hidden className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={MAX_SEATS}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(clamp(event.target.valueAsNumber))}
        className={cn('no-spin bg-transparent text-center font-semibold tabular-nums outline-none', small ? 'w-12 text-[0.92rem]' : 'w-16 text-lg')}
      />
      <button type="button" aria-label="Ajouter une place" onClick={() => onChange(clamp(value + 1))} disabled={value >= MAX_SEATS} className={button}>
        <Plus aria-hidden className="size-3.5" />
      </button>
    </div>
  )
}

'use client'

import { Check } from 'lucide-react'
import { useId } from 'react'

import type { DemoState } from '@/lib/demo-data'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type Theme = DemoState['theme']

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
]

/** Choix du thème façon StudentSphere : une maquette schématique du tableau de bord par option, « Système » coupé en deux. */
export function ThemeSelector({ className }: { className?: string }) {
  const { state, setTheme } = useStore()
  const name = useId()

  return (
    <div role="radiogroup" aria-label="Thème de l’interface" className={cn('grid max-w-2xl grid-cols-3 gap-3 sm:gap-4', className)}>
      {OPTIONS.map((option) => {
        const selected = state.theme === option.value
        return (
          <label key={option.value} className="group cursor-pointer">
            <input type="radio" name={name} value={option.value} checked={selected} onChange={() => setTheme(option.value)} className="peer sr-only" />
            <span className="relative block aspect-[4/3] overflow-hidden rounded-xl transition-[box-shadow,translate] duration-300 ease-soft group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_-12px_rgb(0_0_0/0.3)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
              {option.value === 'system' ? (
                <>
                  <Mockup mode="light" />
                  {/* Même maquette en sombre, découpée pour n'en garder que la moitié droite. */}
                  <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                    <Mockup mode="dark" />
                  </span>
                </>
              ) : (
                <Mockup mode={option.value} />
              )}
              <span aria-hidden className={cn('pointer-events-none absolute inset-0 rounded-xl ring-inset', selected ? 'ring-2 ring-accent' : 'ring-1 ring-line-strong')} />
            </span>
            <span className={cn('mt-2.5 flex items-center gap-2 text-[0.85rem] transition-colors', selected ? 'font-medium text-fg' : 'text-muted group-hover:text-fg')}>
              <span className={cn('grid size-4 shrink-0 place-items-center rounded-full transition-colors', selected ? 'bg-accent text-accent-fg' : 'ring-1 ring-line-strong ring-inset')}>
                {selected && <Check className="size-2.5" strokeWidth={3.5} />}
              </span>
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/** Trait de texte schématique. */
function Bar({ className }: { className?: string }) {
  return <span className={cn('block h-[3px] rounded-full bg-fg/10', className)} />
}

/**
 * Maquette du tableau de bord : une fenêtre neutre, sans couleur, posée en décalé qui déborde en bas à droite (comme StudentSphere),
 * avec la barre latérale, la barre du haut, le titre, les chiffres clés et les logiciels. Les jetons viennent
 * du thème demandé (`.dark` ou `.theme-light`), jamais du thème actif de la page.
 */
function Mockup({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <span aria-hidden className={cn('absolute inset-0 block bg-bg-alt', mode === 'dark' ? 'dark' : 'theme-light')}>
      <span className="absolute top-[12%] -right-[10%] -bottom-[10%] left-[9%] flex overflow-hidden rounded-tl-[10px] bg-bg shadow-[inset_0_0_0_1px_var(--line),-6px_-6px_20px_-8px_rgb(0_0_0/0.18)]">
        {/* Barre latérale */}
        <span className="flex w-[27%] shrink-0 flex-col gap-[5px] px-[4%] pt-[5%]">
          <span className="mb-[3px] flex items-center gap-[3px]">
            <span className="size-[9px] shrink-0 rounded-[2.5px] bg-fg/25" />
            <Bar className="w-3/5 bg-fg/25" />
          </span>
          <span className="flex h-[10px] items-center gap-[3px] rounded-[3px] bg-card px-[3px] shadow-[0_0_0_0.5px_var(--line),0_1px_1px_rgb(0_0_0/0.05)]">
            <span className="size-[4px] shrink-0 rounded-[1px] bg-fg/30" />
            <Bar className="w-3/4 bg-fg/30" />
          </span>
          {['w-2/3', 'w-4/5', 'w-1/2', 'w-3/5'].map((width) => (
            <span key={width} className="flex h-[10px] items-center gap-[3px] px-[3px]">
              <span className="size-[4px] shrink-0 rounded-[1px] bg-fg/15" />
              <Bar className={width} />
            </span>
          ))}
        </span>

        {/* Contenu */}
        <span className="flex min-w-0 flex-1 flex-col gap-[6px] pt-[4%] pr-[6%]">
          {/* Barre du haut : recherche, notification, avatar */}
          <span className="flex items-center justify-end gap-[4px]">
            <span className="h-[8px] w-[34%] rounded-full bg-card shadow-[inset_0_0_0_0.5px_var(--line-strong)]" />
            <span className="size-[5px] rounded-full bg-fg/15" />
            <span className="size-[8px] rounded-full bg-fg/20" />
          </span>

          {/* Titre de page */}
          <span className="mt-[3px] flex flex-col gap-[3px]">
            <Bar className="h-[5px] w-[45%] bg-fg/30" />
            <Bar className="w-[62%]" />
          </span>

          {/* Chiffres clés */}
          <span className="grid grid-cols-3 gap-[4px]">
            {['w-3/5', 'w-1/2', 'w-2/3'].map((width) => (
              <span key={width} className="flex flex-col gap-[3px] rounded-[4px] bg-card p-[4px] shadow-[inset_0_0_0_0.5px_var(--line)]">
                <Bar className={cn('h-[2px]', width)} />
                <Bar className="h-[4px] w-2/5 bg-fg/30" />
              </span>
            ))}
          </span>

          {/* Logiciels */}
          <span className="grid grid-cols-3 gap-[4px]">
            {[0, 1, 2].map((index) => (
              <span key={index} className="flex items-center gap-[3px] rounded-[4px] bg-card p-[4px] shadow-[inset_0_0_0_0.5px_var(--line)]">
                <span className="size-[8px] shrink-0 rounded-[2.5px] bg-fg/15" />
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <Bar className="h-[2.5px] w-4/5 bg-fg/25" />
                  <Bar className="h-[2px] w-3/5" />
                </span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  )
}

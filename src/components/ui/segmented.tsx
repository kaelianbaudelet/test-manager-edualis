'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Sélecteur segmenté façon iOS (mensuel / annuel, filtres), avec une capsule qui glisse d'une option à l'autre.
 * La capsule est placée par rapport au sélecteur (offsetLeft), jamais par rapport à la page : défiler ne la fait
 * pas sauter. Au premier affichage elle se pose sans animation, puis glisse à chaque changement.
 */
export function Segmented<T extends string>({ value, onChange, options, className, size = 'md', label }: { value: T; onChange: (value: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string; size?: 'sm' | 'md'; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const [animate, setAnimate] = useState(false)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-checked="true"]')
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    // Les largeurs changent si la police arrive après coup ou si le conteneur est redimensionné.
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    for (const child of root.querySelectorAll('[role="radio"]')) observer.observe(child)
    return () => observer.disconnect()
  }, [value, options.length])

  // Active l'animation seulement après la première mesure : pas de glissement depuis la gauche au chargement.
  useLayoutEffect(() => {
    if (!pill || animate) return
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(frame)
  }, [pill, animate])

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={cn('relative inline-flex rounded-full bg-fg/[0.06] p-1', className)}>
      {pill && (
        <span
          aria-hidden
          className={cn('absolute top-1 bottom-1 left-0 rounded-full bg-card shadow-[0_1px_3px_rgb(0_0_0/0.1)] motion-reduce:transition-none', animate && 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]')}
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap text-muted transition-colors duration-200 hover:text-fg aria-checked:text-fg',
            // Avant la première mesure, l'option active garde son fond pour ne jamais apparaître vide.
            !pill && 'aria-checked:bg-card aria-checked:shadow-[0_1px_3px_rgb(0_0_0/0.1)]',
            size === 'sm' ? 'h-7 px-3 text-[0.8rem]' : 'h-8 px-4 text-[0.85rem]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

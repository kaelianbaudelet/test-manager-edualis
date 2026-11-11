import { Sparkles } from 'lucide-react'

import type { Product } from '@/lib/catalog'
import { cn } from '@/lib/utils'

import { CeriseMark } from './logo'

// Logos des logiciels, un fruit chacun, en blanc sur la couleur de l'app (`cut` = couleur de l'app, pour les découpes).
// Logos provisoires dessinés à la main.
type Glyph = (props: { cut: string; className?: string }) => React.ReactElement

export const FRUITS: Record<string, Glyph> = {
  cerise: ({ className }) => <CeriseMark className={className} />,
  myrtille: ({ cut, className }) => (
    <svg viewBox="4 5 24 24" aria-hidden className={className}>
      <circle cx="16" cy="17.5" r="10.5" fill="currentColor" />
      <path d="M12.6 10.6l1.9 1.2.9-2.1h1.2l.9 2.1 1.9-1.2.8.9-1.2 1.9 2.1.9" fill="none" stroke={cut} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="21" r="1.4" fill={cut} opacity="0.35" />
    </svg>
  ),
  citron: ({ cut, className }) => (
    <svg viewBox="2 2 28 28" aria-hidden className={className}>
      <g transform="rotate(-25 16 16)">
        <path d="M3.5 16c0-1.4 1-2 2.2-2.4C7.3 9.6 11.4 7.4 16 7.4s8.7 2.2 10.3 6.2c1.2.4 2.2 1 2.2 2.4s-1 2-2.2 2.4c-1.6 4-5.7 6.2-10.3 6.2s-8.7-2.2-10.3-6.2C4.5 18 3.5 17.4 3.5 16z" fill="currentColor" />
        <path d="M10 12.6c1.6-1.4 3.6-2.1 6-2.1" fill="none" stroke={cut} strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  ),
  kiwi: ({ cut, className }) => (
    <svg viewBox="3.5 3.5 25 25" aria-hidden className={className}>
      <circle cx="16" cy="16" r="11.5" fill="currentColor" />
      <circle cx="16" cy="16" r="8" fill={cut} opacity="0.28" />
      <ellipse cx="16" cy="16" rx="2.6" ry="3.6" fill="currentColor" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return <ellipse key={i} cx={16 + Math.cos(a) * 5.4} cy={16 + Math.sin(a) * 5.4} rx="0.7" ry="1.2" fill={cut} transform={`rotate(${(a * 180) / Math.PI + 90} ${16 + Math.cos(a) * 5.4} ${16 + Math.sin(a) * 5.4})`} />
      })}
    </svg>
  ),
  figue: ({ cut, className }) => (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <path d="M16 6.5c1.2 3.6 8.5 7.4 8.5 14a8.5 8.5 0 0 1-17 0c0-6.6 7.3-10.4 8.5-14z" fill="currentColor" />
      <path d="M16 6.5V3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 21.5c.6 2 2 3.2 3.5 3.2" fill="none" stroke={cut} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  ),
  mangue: ({ cut, className }) => (
    <svg viewBox="5 2.5 23 25" aria-hidden className={className}>
      <path d="M9.2 11.2C13.6 6.4 24.5 7 26 15.2c1.3 7.4-5.2 12.6-12.2 11-6.6-1.5-9.4-10.4-4.6-15z" fill="currentColor" />
      <path d="M17.5 8.2c.4-2.8 2.6-4.6 6-4.6-.6 3.2-2.8 5-6 4.6z" fill="currentColor" />
      <path d="M12 15.5c-.8 2.6.2 5.4 2.6 6.8" fill="none" stroke={cut} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  ),
}

/** Icône d'app façon iOS, en aplat et sans effet : remplit son conteneur, qui fixe la taille. */
export function AppIcon({ product, className }: { product: Pick<Product, 'icon' | 'color' | 'name'>; className?: string }) {
  const color = product.color ?? '#64645f'
  const Fruit = product.icon ? FRUITS[product.icon] : undefined
  return (
    <span aria-hidden className={cn('grid size-full place-items-center rounded-[22.5%] text-white', className)} style={{ backgroundColor: color }}>
      {Fruit ? <Fruit cut={color} className="size-[62%]" /> : <Sparkles strokeWidth={1.9} className="size-[52%]" />}
    </span>
  )
}

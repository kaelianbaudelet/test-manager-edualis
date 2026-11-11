import { cn } from '@/lib/utils'

// Monogramme Edualis : un « e » dessiné au trait dans une pastille de l'accent.
export function EdualisMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M10 16.5h12a6 6 0 1 0-1.8 4.3" fill="none" stroke="var(--accent-fg)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function EdualisLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[1.15rem] leading-none font-semibold tracking-[-0.02em] text-fg', className)}>
      <EdualisMark />
      edualis
    </span>
  )
}

// Logo Cerise : deux cerises au trait, couleur de l'univers Cerise.
export function CeriseMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className}>
      <path d="M17 4c-1 6-4 10-7.5 13.5M17 4c1.5 5 4 9 6 11.5M17 4c3-1 6 0 8 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9.5" cy="21.5" r="5.5" fill="currentColor" />
      <circle cx="23" cy="20" r="5.5" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

// Pastille Cerise : même carré arrondi que le monogramme Edualis, cerises en blanc sur l'accent.
export function CeriseBadge({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <g transform="translate(4 4.75) scale(0.75)" className="text-(--accent-fg)">
        <CeriseMark />
      </g>
    </svg>
  )
}

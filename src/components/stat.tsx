import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Stat({ label, value, detail, icon, href }: { label: string; value: React.ReactNode; detail?: React.ReactNode; icon?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 text-[0.82rem] text-muted">
        {label}
        {icon && <span className="text-muted/70 [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-1.5 text-[1.55rem] leading-tight font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      {detail && <div className="mt-1 text-[0.8rem] text-muted">{detail}</div>}
    </>
  )
  const className = cn('bento block p-5', href && 'transition-shadow hover:shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow)]')
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

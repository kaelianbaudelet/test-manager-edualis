import { cn } from '@/lib/utils'

const tones = {
  neutral: 'bg-fg/[0.06] text-fg/80',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  outline: 'ring-1 ring-inset ring-line-strong text-muted',
}

export function Badge({ tone = 'neutral', className, dot, ...props }: React.ComponentProps<'span'> & { tone?: keyof typeof tones; dot?: boolean }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-medium whitespace-nowrap', tones[tone], className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {props.children}
    </span>
  )
}

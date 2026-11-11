import { cn } from '@/lib/utils'

const field =
  'w-full rounded-xl bg-card px-3.5 text-[0.95rem] text-fg ring-1 ring-inset ring-line-strong outline-none transition-shadow placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent aria-invalid:ring-2 aria-invalid:ring-danger disabled:opacity-60'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(field, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(field, 'min-h-28 resize-y py-2.5', className)} {...props} />
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('mb-1.5 block text-[0.85rem] font-medium text-fg', className)} {...props} />
}

export function Field({ label, hint, error, htmlFor, children, className }: { label: string; hint?: React.ReactNode; error?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="mt-1.5 text-[0.8rem] text-danger">{error}</p> : hint ? <p className="mt-1.5 text-[0.8rem] text-muted">{hint}</p> : null}
    </div>
  )
}

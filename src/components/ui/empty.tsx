import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, text, action, note, className }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode; note?: string; className?: string }) {
  return (
    <div className={cn('relative flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent [&_svg]:size-5">{icon}</div>
      <h3 className="mt-4 text-[1.02rem] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[0.88rem] text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
      {note && <p className="hand mt-4 -rotate-2 text-[1.35rem]">{note}</p>}
    </div>
  )
}

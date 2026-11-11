'use client'

import { ChevronRight } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import { cn } from '@/lib/utils'

export const Menu = DropdownMenu.Root
export const MenuTrigger = DropdownMenu.Trigger

export function MenuContent({ className, align = 'end', ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className={cn('menu-content z-50 min-w-52 rounded-2xl bg-card p-1.5 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.25)] ring-1 ring-line', className)}
        {...props}
      />
    </DropdownMenu.Portal>
  )
}

export function MenuItem({ className, danger, ...props }: React.ComponentProps<typeof DropdownMenu.Item> & { danger?: boolean }) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.88rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-fg/[0.05] [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted',
        danger && 'text-danger [&>svg]:text-danger data-[highlighted]:bg-danger-soft',
        className,
      )}
      {...props}
    />
  )
}

export function MenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn('px-2.5 pt-2 pb-1 text-[0.72rem] font-medium tracking-wide text-muted uppercase', className)} {...props} />
}

export const MenuGroup = DropdownMenu.Group
export const MenuRadioGroup = DropdownMenu.RadioGroup
export const MenuRadioItem = DropdownMenu.RadioItem

export const MenuSub = DropdownMenu.Sub

/** Ligne qui ouvre un sous-menu : même style qu'un MenuItem, chevron à droite, reste surlignée tant que le sous-menu est ouvert. */
export function MenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof DropdownMenu.SubTrigger>) {
  return (
    <DropdownMenu.SubTrigger
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.88rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-fg/[0.05] data-[state=open]:bg-fg/[0.05] [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenu.SubTrigger>
  )
}

export function MenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        sideOffset={8}
        alignOffset={-6}
        className={cn('menu-content z-50 min-w-56 rounded-2xl bg-card p-1.5 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.25)] ring-1 ring-line', className)}
        {...props}
      />
    </DropdownMenu.Portal>
  )
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1.5 h-px bg-line" />
}

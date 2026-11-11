'use client'

import { Switch as SwitchPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn('relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-fg/15 transition-colors data-[state=checked]:bg-accent disabled:opacity-50', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[1.125rem]" />
    </SwitchPrimitive.Root>
  )
}

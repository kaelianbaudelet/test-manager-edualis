'use client'

import { Check, Minus } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn('grid size-[1.1rem] shrink-0 place-items-center rounded-[5px] bg-card ring-1 ring-line-strong ring-inset transition-colors data-[state=checked]:bg-fg data-[state=checked]:ring-fg data-[state=indeterminate]:bg-fg data-[state=indeterminate]:ring-fg', className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-bg">{props.checked === 'indeterminate' ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}</CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

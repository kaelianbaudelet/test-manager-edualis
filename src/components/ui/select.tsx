'use client'

import { Check, ChevronDown, Plus } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string; description?: string; icon?: React.ReactNode }

const ACTION = '__action'

type Props = {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  id?: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  /** Dernière ligne du menu qui déclenche une action (ex. « Nouveau groupe… ») au lieu de choisir une valeur. */
  action?: { label: string; onSelect: () => void }
}

/** Liste déroulante façon shadcn (Radix Select) : remplace les <select> natifs. */
export function Select({ value, onValueChange, options, id, placeholder = 'Choisir…', disabled, size = 'md', className, action, ...aria }: Props) {
  const small = size === 'sm'
  return (
    <SelectPrimitive.Root
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === ACTION) action?.onSelect()
        else onValueChange(next)
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={aria['aria-label']}
        aria-invalid={aria['aria-invalid']}
        className={cn(
          'flex w-full items-center justify-between gap-2 bg-card text-left text-fg ring-1 ring-line-strong outline-none ring-inset transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-muted/70 data-[state=open]:ring-2 data-[state=open]:ring-accent aria-invalid:ring-2 aria-invalid:ring-danger [&>span]:truncate',
          small ? 'h-9 rounded-full pr-3 pl-3.5 text-[0.85rem]' : 'h-11 rounded-xl px-3.5 text-[0.95rem]',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="menu-content z-[70] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[max(var(--radix-select-trigger-width),12rem)] overflow-hidden rounded-2xl bg-card shadow-[0_16px_48px_-12px_rgb(0_0_0/0.25)] ring-1 ring-line"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer items-center gap-2.5 rounded-xl py-2 pr-9 pl-2.5 text-[0.88rem] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-fg/[0.05] data-[state=checked]:font-medium"
              >
                {option.icon && <span className="shrink-0 text-muted [&_svg]:size-4">{option.icon}</span>}
                <span className="min-w-0">
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  {option.description && <span className="block text-[0.75rem] font-normal text-muted">{option.description}</span>}
                </span>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 text-accent">
                  <Check className="size-4" strokeWidth={2.5} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
            {action && (
              <>
                <SelectPrimitive.Separator className="my-1.5 h-px bg-line" />
                <SelectPrimitive.Item
                  value={ACTION}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.88rem] font-medium text-accent outline-none select-none data-[highlighted]:bg-accent-soft"
                >
                  <Plus className="size-4" />
                  <SelectPrimitive.ItemText>{action.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              </>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

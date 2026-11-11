import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

// Bouton du site vitrine : pilule façon Apple, noir par défaut, accent cyan pour l'action principale.
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-fg text-bg hover:opacity-85',
        accent: 'bg-accent text-accent-fg hover:brightness-110',
        secondary: 'bg-card text-fg ring-1 ring-inset ring-line-strong hover:bg-bg-alt',
        ghost: 'text-fg hover:bg-fg/[0.05]',
        outline: 'text-accent ring-1 ring-inset ring-accent/40 hover:bg-accent-soft',
        danger: 'bg-danger text-white hover:brightness-110 dark:text-black',
        'danger-ghost': 'text-danger hover:bg-danger-soft',
        link: 'text-accent hover:underline underline-offset-4 px-0! h-auto!',
      },
      size: {
        xs: 'h-7 px-3 text-[0.8rem] [&_svg]:size-3.5',
        sm: 'h-8 px-3.5 text-[0.85rem]',
        md: 'h-10 px-5 text-[0.9rem]',
        lg: 'h-11 px-6 text-[0.95rem]',
        icon: 'size-9 [&_svg]:size-[1.05rem]',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild, type = 'button', ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

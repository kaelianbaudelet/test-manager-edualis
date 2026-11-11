'use client'

import { Bell, CheckCheck, Menu as MenuIcon, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

import { MobileNav } from './sidebar'
import { UserMenu } from './user-menu'

const NOTIFICATIONS = [
  { title: 'Myrtille est presque complet', text: '29 places sur 30 attribuées.', when: 'Il y a 2 h', unread: true },
  { title: 'Sophie Lambert a rejoint Figue', text: 'Invitation acceptée.', when: 'Hier', unread: true },
  { title: 'Facture disponible', text: 'ED-2026-11-0140 · 3,98 €', when: '1 nov.', unread: false },
]

const iconButton = 'relative grid size-10 place-items-center rounded-full text-fg/70 transition-colors hover:bg-fg/[0.06] hover:text-fg data-[state=open]:bg-fg/[0.06]'

/** Barre du haut : recherche, notifications et compte. Sur mobile, elle porte aussi le logo et le menu. */
export function Topbar() {
  const { workspace } = useStore()
  const toast = useToast()
  const [navOpen, setNavOpen] = useState(false)
  const [read, setRead] = useState(false)
  // Dès qu'on défile, la barre prend un fond en verre et un filet : le contenu ne se voit plus derrière elle.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const unread = read ? 0 : NOTIFICATIONS.filter((item) => item.unread).length

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'glass border-line' : 'border-transparent bg-bg/0',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-8">
        <button type="button" aria-label="Ouvrir le menu" onClick={() => setNavOpen(true)} className={cn(iconButton, '-ml-2 lg:hidden')}>
          <MenuIcon className="size-5" />
        </button>
        <p className="truncate text-[0.9rem] font-medium lg:hidden">{workspace.kind === 'personal' ? 'Personnel' : workspace.name}</p>

        <button
          type="button"
          onClick={() => toast('Recherche', { tone: 'info', text: 'Membres, logiciels et factures, en un seul champ.' })}
          className="ml-auto hidden h-10 w-72 items-center gap-2.5 rounded-full bg-card px-4 text-[0.88rem] text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-line transition-shadow ring-inset hover:ring-line-strong md:flex"
        >
          <Search className="size-4" />
          Rechercher…
          <kbd className="ml-auto rounded-md bg-fg/[0.06] px-1.5 py-0.5 font-sans text-[0.7rem] text-muted">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Menu>
            <MenuTrigger aria-label="Notifications" className={iconButton}>
              <Bell className="size-[1.15rem]" />
              {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#e63950] ring-2 ring-bg" />}
            </MenuTrigger>
            <MenuContent className="w-80 p-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <p className="text-[0.9rem] font-semibold">Notifications</p>
                {unread > 0 && (
                  <button type="button" onClick={() => setRead(true)} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem] font-medium text-accent transition-colors hover:bg-accent-soft">
                    <CheckCheck className="size-3.5" /> Tout marquer comme lu
                  </button>
                )}
              </div>
              {NOTIFICATIONS.map((item) => (
                <MenuItem key={item.title} className="items-start py-2.5">
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.unread && !read ? 'bg-accent' : 'bg-transparent')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-medium">{item.title}</span>
                    <span className="block text-[0.78rem] text-muted">{item.text}</span>
                  </span>
                  <span className="text-[0.72rem] whitespace-nowrap text-muted">{item.when}</span>
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>

          <span aria-hidden className="mx-1.5 hidden h-6 w-px bg-line sm:block" />
          <UserMenu />
        </div>
      </div>
      <MobileNav open={navOpen} onOpenChange={setNavOpen} />
    </header>
  )
}

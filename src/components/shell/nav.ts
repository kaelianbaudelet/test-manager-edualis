import { Building2, CreditCard, Home, LayoutGrid, ReceiptText, ShoppingBag, Users, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon }

/** Le menu change selon l'espace : compte personnel, organisation (admin) ou organisation (membre). */
export function navFor({ isOrg, canManage }: { isOrg: boolean; canManage: boolean }): NavItem[] {
  if (!isOrg)
    return [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/logiciels', label: 'Mes logiciels', icon: LayoutGrid },
      { href: '/souscrire', label: 'Souscrire', icon: ShoppingBag },
      { href: '/factures', label: 'Factures', icon: ReceiptText },
      { href: '/organisation', label: 'Organisations', icon: Building2 },
    ]
  if (!canManage)
    return [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/logiciels', label: 'Mes logiciels', icon: LayoutGrid },
      { href: '/organisation', label: 'Mon organisation', icon: Building2 },
    ]
  return [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/logiciels', label: 'Logiciels et places', icon: LayoutGrid },
    { href: '/membres', label: 'Membres', icon: Users },
    { href: '/souscrire', label: 'Souscrire', icon: ShoppingBag },
    { href: '/factures', label: 'Facturation', icon: CreditCard },
    { href: '/organisation', label: 'Organisation', icon: Building2 },
  ]
}

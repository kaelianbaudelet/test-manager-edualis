import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
export const formatEuro = (value: number) => euro.format(value)

const dateLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const dateShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
export const formatDate = (iso: string) => dateLong.format(new Date(iso))
export const formatDateShort = (iso: string) => dateShort.format(new Date(iso))

export const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    // « IUT de Lannion » → IL : on saute les petits mots de liaison.
    .filter((word) => word && !/^(de|du|des|la|le|les|et|d’|d'|l’|l')$/i.test(word))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** « 2 places libres » : chaque mot prend un s au pluriel, sauf ceux qui finissent déjà par s ou x. */
const pluralize = (words: string) => words.split(' ').map((word) => (/[sx]$/.test(word) ? word : `${word}s`)).join(' ')
export const plural = (count: number, one: string, many = pluralize(one)) => `${count.toLocaleString('fr-FR')} ${count > 1 ? many : one}`

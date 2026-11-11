'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Sidebar } from '@/components/shell/sidebar'
import { Topbar } from '@/components/shell/topbar'
import { useStore } from '@/lib/store'

// Espace connecté : tant qu'on n'est pas « connecté » (simulation), on renvoie vers la page de connexion.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, state } = useStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (ready && !state.signedIn) router.replace('/connexion')
  }, [ready, state.signedIn, router])

  if (!ready || !state.signedIn) return <div className="min-h-dvh bg-bg" />

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main key={`${state.currentId}-${pathname}`} className="page-in mx-auto w-full max-w-6xl px-4 pt-4 pb-20 sm:px-8 sm:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}

import type { Metadata, Viewport } from 'next'

import { ToastProvider } from '@/components/ui/toast'
import { StoreProvider } from '@/lib/store'

import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Edualis Manager', template: '%s · Edualis Manager' },
  description: 'Gérez vos logiciels Edualis, vos licences, vos factures et votre organisation.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f7' },
    { media: '(prefers-color-scheme: dark)', color: '#111110' },
  ],
}

// Pose le thème avant le premier rendu pour éviter un flash clair en mode sombre.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('edualis-manager-demo-v2')||'{}').theme||'system';if(s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans text-fg">
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  )
}

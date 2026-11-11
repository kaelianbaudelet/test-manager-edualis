import Link from 'next/link'

import { DashboardPreview } from '@/components/auth/dashboard-preview'
import { DeviceIPad } from '@/components/device-ipad'
import { EdualisLogo } from '@/components/logo'

// Mise en page reprise de StudentSphere : panneau d'ambiance avec un iPad à gauche, formulaire centré à droite.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Sur grand écran, le panneau reste fixe : seule la colonne du formulaire défile.
  return (
    <div className="grid min-h-dvh w-full xl:h-dvh xl:grid-cols-[clamp(24rem,26vw,30rem)_minmax(0,1fr)] xl:overflow-hidden">
      <div className="relative isolate hidden overflow-hidden bg-black text-white xl:block">
        {/* Fond d'écran du MacBook de la landing, net et plein cadre (essai sans flou ni dégradé). */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: 'url(/devices/wallpaper-fanal.jpg)' }} />
        {/* Ombre sur tout le haut, sans bord visible : un dégradé à paliers doux qui s'éteint avant l'iPad. Le texte
            reste lisible sur le ciel clair, le bas de la photo garde ses couleurs. */}
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[66%] bg-[linear-gradient(to_bottom,rgb(0_0_0/0.55)_0%,rgb(0_0_0/0.5)_25%,rgb(0_0_0/0.44)_42%,rgb(0_0_0/0.3)_58%,rgb(0_0_0/0.13)_76%,rgb(0_0_0/0.03)_90%,transparent_100%)]" />
        <div className="relative z-10 flex h-full flex-col px-8 pt-8 pb-6">
          <div className="relative [text-shadow:0_1px_12px_rgb(0_0_0/0.3)]">
            <Link href="/" aria-label="Edualis Manager" className="flex items-center gap-2">
              <EdualisLogo className="text-white" />
            </Link>
            <h2 className="mt-8 max-w-xs font-serif text-[1.65rem] leading-[1.15] font-semibold tracking-[-0.025em] text-white">Des logiciels pensés pour la salle de classe.</h2>
            <p className="mt-3 max-w-xs text-[0.9rem] text-white/85">Edualis édite des outils clairs pour apprendre et enseigner, de Cerise à Mangue. Un seul compte pour tous, seul ou avec tout votre établissement.</p>
            <p className="hand mt-4 -rotate-2 text-white">conçu en France</p>
          </div>
        </div>
        <DeviceIPad className="absolute top-[50%] left-[14%] w-[220%]">
          <DashboardPreview />
        </DeviceIPad>
        {/* Bordure en ombre intérieure : un liseré clair d'un pixel et une ombre douce sur tout le contour, au-dessus de
            la photo et de l'iPad, comme une vitre encadrée. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.05),inset_0_0_24px_rgb(0_0_0/0.1)]" />
      </div>

      <div className="flex min-h-dvh flex-col xl:min-h-0 xl:overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8">
          <div className="mx-auto flex w-full max-w-[420px] flex-col">
            <Link href="/" className="mb-8 block xl:hidden" aria-label="Edualis Manager">
              <EdualisLogo />
            </Link>
            {children}
          </div>
        </div>
        <p className="px-5 pb-6 text-center text-[0.75rem] text-muted">© {new Date().getFullYear()} Edualis · Conçu et hébergé en France</p>
      </div>
    </div>
  )
}

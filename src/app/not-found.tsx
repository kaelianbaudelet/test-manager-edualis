import { ButtonLink } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="hand -rotate-2">oups…</p>
        <h1 className="title-lg mt-3">Page introuvable.</h1>
        <p className="mt-2 text-muted">Cette page n’existe pas ou a été déplacée.</p>
        <ButtonLink href="/" className="mt-6">
          Retour à l’accueil
        </ButtonLink>
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'

import { ScaledScreen } from './scaled-screen'

// Cadre d'iPad du site vitrine (repris de StudentSphere) : PNG de 2710 × 2080, dalle à 85 px du bord.
const FRAME = { w: 2710, h: 2080 }
const DISPLAY = { x: 85, y: 85, w: 2540, h: 1910 }
export const IPAD_SCREEN = { w: 1180, h: 887 }

const pct = (value: number, total: number) => `${(value / total) * 100}%`

export function DeviceIPad({ children, label = 'iPad affichant le manager Edualis', className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={cn('relative select-none', className)} style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}`, filter: 'drop-shadow(0 30px 40px rgb(0 0 0 / 0.2))' }}>
      <div
        aria-hidden
        className="absolute overflow-hidden rounded-[2.2%/2.9%] bg-[#f5f5f7]"
        style={{ left: pct(DISPLAY.x, FRAME.w), top: pct(DISPLAY.y, FRAME.h), width: pct(DISPLAY.w, FRAME.w), height: pct(DISPLAY.h, FRAME.h) }}
      >
        <ScaledScreen width={IPAD_SCREEN.w} height={IPAD_SCREEN.h}>
          {children}
        </ScaledScreen>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.12)_0%,rgb(255_255_255/0)_40%)]" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- cadre décoratif superposé, dimensions fixes */}
      <img aria-hidden alt="" src="/devices/ipad/ipad-frame.png" width={FRAME.w} height={FRAME.h} className="pointer-events-none absolute inset-0 size-full" />
    </div>
  )
}

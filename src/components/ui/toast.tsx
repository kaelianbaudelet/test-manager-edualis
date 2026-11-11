'use client'

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'success' | 'info' | 'warning' | 'error'
type ToastOptions = { text?: string; tone?: Tone; action?: { label: string; onClick: () => void }; duration?: number }
type Toast = { id: number; title: string; text?: string; tone: Tone; action?: ToastOptions['action']; duration: number }

const ToastContext = createContext<(title: string, options?: ToastOptions) => void>(() => {})

const TONES: Record<Tone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'bg-success-soft text-success' },
  info: { icon: Info, className: 'bg-accent-soft text-accent' },
  warning: { icon: AlertTriangle, className: 'bg-warning-soft text-warning' },
  error: { icon: XCircle, className: 'bg-danger-soft text-danger' },
}

const VISIBLE = 3
const GAP = 10

/**
 * Notifications façon Sonner : cartes empilées en bas à droite, dépliées au survol. Elles se ferment seules après
 * quelques secondes, sauf tant que la souris est dessus. Elles confirment chaque action simulée du manager.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [expanded, setExpanded] = useState(false)
  const [heights, setHeights] = useState<Record<number, number>>({})
  const reduceMotion = useReducedMotion()
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((toast) => toast.id !== id)), [])

  const push = useCallback((title: string, options?: ToastOptions) => {
    counter.current += 1
    const id = counter.current
    setToasts((prev) => [...prev.slice(-(VISIBLE + 1)), { id, title, text: options?.text, tone: options?.tone ?? 'success', action: options?.action, duration: options?.duration ?? 4000 }])
  }, [])

  // Le plus récent en premier : index 0 = au premier plan.
  const ordered = [...toasts].reverse()
  // Repliées, les cartes du dessous prennent la hauteur de celle du dessus : seuls leurs bords dépassent.
  const frontHeight = ordered[0] ? heights[ordered[0].id] : undefined

  return (
    <ToastContext.Provider value={push}>
      {children}
      <section
        aria-label="Notifications"
        aria-live="polite"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[22rem]"
      >
        <ol className="pointer-events-auto relative">
          <AnimatePresence initial={false}>
            {ordered.map((toast, index) => {
              // Déplié : chaque carte au-dessus de la précédente. Replié : un léger décalage et une réduction.
              const offset = expanded ? ordered.slice(0, index).reduce((sum, item) => sum + (heights[item.id] ?? 72) + GAP, 0) : index * 12
              const hidden = index >= VISIBLE
              return (
                <motion.li
                  key={toast.id}
                  layout={false}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: hidden ? 0 : 1, y: -offset, scale: expanded || reduceMotion ? 1 : 1 - index * 0.05 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  style={{ zIndex: VISIBLE - index, transformOrigin: 'bottom center', pointerEvents: hidden ? 'none' : 'auto' }}
                  className="absolute right-0 bottom-0 left-0"
                >
                  <ToastCard
                    toast={toast}
                    height={!expanded && index > 0 ? frontHeight : undefined}
                    paused={expanded}
                    muted={!expanded && index > 0}
                    onDismiss={() => dismiss(toast.id)}
                    onHeight={(height) => setHeights((prev) => (prev[toast.id] === height ? prev : { ...prev, [toast.id]: height }))}
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      </section>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, height, paused, muted, onDismiss, onHeight }: { toast: Toast; height?: number; paused: boolean; muted: boolean; onDismiss: () => void; onHeight: (height: number) => void }) {
  const tone = TONES[toast.tone]
  const Icon = tone.icon
  // Minuteur invisible : il se fige tant que la souris survole la pile, puis reprend là où il en était.
  const remaining = useRef(toast.duration)
  useEffect(() => {
    if (paused) return
    const started = Date.now()
    const timer = window.setTimeout(onDismiss, remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(800, remaining.current - (Date.now() - started))
    }
  }, [paused, onDismiss])
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      style={{ height }}
      className="group relative overflow-hidden rounded-2xl transition-[height] duration-300 bg-card shadow-[0_12px_32px_-12px_rgb(0_0_0/0.22),0_2px_6px_-2px_rgb(0_0_0/0.08)] ring-1 ring-line"
    >
      {/* Les cartes du dessous ne montrent que leur bord, comme une pile de feuilles. */}
      <div
        ref={(node) => {
          // Hauteur naturelle du contenu (et non celle imposée en pile) : sert à déplier la pile au survol.
          if (node) onHeight(node.offsetHeight)
        }}
        className={cn('flex items-start gap-3 py-3.5 pr-10 pl-3.5 transition-opacity duration-200', muted && 'opacity-0')}
      >
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone.className)}>
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[0.88rem] leading-snug font-semibold">{toast.title}</p>
          {toast.text && <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">{toast.text}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick()
                onDismiss()
              }}
              className="mt-2 inline-flex h-7 items-center rounded-full bg-fg px-3 text-[0.78rem] font-medium text-bg transition-opacity hover:opacity-85"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Fermer la notification"
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-fg/[0.06] hover:text-fg focus-visible:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export const useToast = () => useContext(ToastContext)

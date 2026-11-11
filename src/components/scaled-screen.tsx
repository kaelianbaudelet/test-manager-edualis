'use client'

import { useEffect, useRef, useState } from 'react'

// L'interface est dessinée à une taille d'écran réelle (en px CSS), puis réduite d'un bloc pour remplir la dalle :
// le texte garde ses vraies proportions, comme sur une capture. Masquée tant que l'échelle n'est pas mesurée.
export function ScaledScreen({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [width])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div
        className="absolute top-0 left-0 origin-top-left transition-opacity duration-300"
        style={{ width, height, transform: `scale(${scale ?? 1})`, opacity: scale === null ? 0 : 1 }}
      >
        {children}
      </div>
    </div>
  )
}

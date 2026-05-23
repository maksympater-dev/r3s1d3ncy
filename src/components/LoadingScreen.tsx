'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ResidentCard from '@/components/ResidentCard'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const CODE_LINES: { label: string; target: string }[] = [
  { label: 'BIOMETRIC', target: 'VERIFIED' },
  { label: 'CLEARANCE', target: 'RESIDENT' },
  { label: 'SESSION',   target: 'R3S1D3NCY' },
  { label: 'STATUS',    target: 'GRANTED' },
]

type Phase = 'idle' | 'booting' | 'exiting'

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)]
const scrambled = (len: number) =>
  Array.from({ length: len }, randomChar).join('')

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleWrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const codeWrapRef = useRef<HTMLDivElement>(null)
  const lockedTextRefs = useRef<HTMLSpanElement[]>([])
  const randomTextRefs = useRef<HTMLSpanElement[]>([])

  const [phase, setPhase] = useState<Phase>('idle')

  // Phase 1: initial logo + button reveal
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.from(titleWrapRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    })
    tl.from(
      buttonRef.current,
      { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' },
      '-=0.3',
    )
  }, { scope: containerRef })

  // Phase 2: scramble/lock code
  useGSAP(
    () => {
      if (phase !== 'booting') return

      // Dim logo
      gsap.to(titleWrapRef.current, {
        opacity: 0.9,
        scale: 0.9,
        duration: 0.5,
        ease: 'power2.out',
      })

      // Fade in code block
      gsap.from(codeWrapRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'power2.out',
      })

      const lockDuration = 1600
      const staggerDelay = 220
      const totalDuration = staggerDelay * (CODE_LINES.length - 1) + lockDuration

      const startTime = performance.now()
      let completionTimer: number | undefined
      let lastDomWrite = 0

      const updateCodeLines = (elapsed: number) => {
        CODE_LINES.forEach((line, idx) => {
          const lineElapsed = Math.max(0, elapsed - idx * staggerDelay)
          const progress = Math.min(1, lineElapsed / lockDuration)
          const lockedCount = Math.floor(progress * line.target.length)
          const lockedText = lockedTextRefs.current[idx]
          const randomText = randomTextRefs.current[idx]
          const remaining = line.target.length - lockedCount

          if (lockedText) lockedText.textContent = line.target.slice(0, lockedCount)
          if (randomText) randomText.textContent = scrambled(remaining)
        })
      }

      const tick = () => {
        const elapsed = performance.now() - startTime

        if (elapsed - lastDomWrite >= 42 || elapsed >= totalDuration + 200) {
          updateCodeLines(elapsed)
          lastDomWrite = elapsed
        }

        if (elapsed >= totalDuration + 200) {
          gsap.ticker.remove(tick)
          completionTimer = window.setTimeout(() => {
            setPhase('exiting')
          }, 600)
        }
      }

      updateCodeLines(0)
      gsap.ticker.add(tick)

      return () => {
        gsap.ticker.remove(tick)
        if (completionTimer) window.clearTimeout(completionTimer)
      }
    },
    { dependencies: [phase], scope: containerRef },
  )

  // Phase 3: exit slide-up
  useGSAP(
    () => {
      if (phase !== 'exiting') return
      gsap.to(containerRef.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        onComplete,
      })
    },
    { dependencies: [phase], scope: containerRef },
  )

  const handleEnter = () => {
    if (!buttonRef.current) return
    gsap.to(buttonRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setPhase('booting'),
    })
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black text-foreground flex flex-col items-center justify-center px-6"
    >
      <div className="r3-loading-atmosphere" aria-hidden="true">
        <span className="r3-loading-grid" />
        <span className="r3-loading-wave" />
        <span className="r3-loading-scan" />
        <span className="r3-loading-corner r3-loading-corner-tl" />
        <span className="r3-loading-corner r3-loading-corner-tr" />
        <span className="r3-loading-corner r3-loading-corner-bl" />
        <span className="r3-loading-corner r3-loading-corner-br" />
      </div>

      <div
        ref={titleWrapRef}
        className="relative z-10 mb-8 flex flex-col items-center overflow-visible sm:mb-10"
      >
        <ResidentCard granted={phase !== 'idle'} />
      </div>

      {/* Slot: button OR code-scramble */}
      <div className="relative z-10 w-full max-w-md min-h-[180px] flex flex-col items-center justify-start">
        {phase === 'idle' && (
          <button
            ref={buttonRef}
            onClick={handleEnter}
            className="group relative overflow-hidden border border-border px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:border-primary sm:px-10 sm:tracking-[0.4em]"
          >
            <span className="absolute inset-0 bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 group-hover:text-primary-foreground transition-colors duration-500">
              Enter now
            </span>
          </button>
        )}

        {(phase === 'booting' || phase === 'exiting') && (
          <div
            ref={codeWrapRef}
            className="font-mono text-sm md:text-base w-full space-y-2"
          >
            {CODE_LINES.map((line, i) => (
              <div key={line.label} className="flex items-baseline gap-4">
                <span className="text-muted-foreground uppercase tracking-widest text-xs w-28 shrink-0">
                  {line.label}
                </span>
                <span className="tabular-nums">
                  <span
                    ref={(el) => {
                      if (el) lockedTextRefs.current[i] = el
                    }}
                    className="text-primary"
                  />
                  <span
                    ref={(el) => {
                      if (el) randomTextRefs.current[i] = el
                    }}
                    className="text-muted-foreground/50"
                  >
                    {scrambled(line.target.length)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

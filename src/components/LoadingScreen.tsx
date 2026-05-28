'use client'

import { useCallback, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import LandingAccessMap from '@/components/LandingAccessMap'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const CODE_LINES: { label: string; target: string }[] = [
  { label: 'CITY GRID', target: 'ONLINE' },
  { label: 'MARKET',    target: 'UK-01' },
  { label: 'SESSION',   target: 'R3S1D3NCY' },
  { label: 'STATUS',    target: 'GRANTED' },
]

type Phase = 'idle' | 'booting' | 'exiting'

const landingCopyStyle: CSSProperties = {
  position: 'absolute',
  left: 'clamp(1.25rem, 5vw, 5rem)',
  top: 'clamp(1.6rem, 5.6dvh, 4.5rem)',
  zIndex: 10,
  width: 'min(54rem, calc(100vw - 2.5rem))',
  pointerEvents: 'none',
  textShadow: '0 0 30px rgba(0, 0, 0, 0.9)',
}

const landingLogoStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-heading), Arial Black, sans-serif',
  fontSize: 'clamp(2.35rem, 8.6vw, 7rem)',
  fontWeight: 800,
  lineHeight: 0.82,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color: 'rgba(244, 241, 234, 0.96)',
  whiteSpace: 'nowrap',
  textShadow: '0 0 28px rgba(0, 0, 0, 0.9), 0 0 46px rgba(183, 255, 90, 0.1)',
}

const landingTaglineStyle: CSSProperties = {
  display: 'block',
  marginTop: 'clamp(0.62rem, 1.4vw, 1rem)',
  fontFamily: 'var(--font-mono), Consolas, monospace',
  fontSize: 'clamp(0.62rem, 1vw, 0.82rem)',
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'rgba(183, 255, 90, 0.86)',
  textShadow: '0 0 18px rgba(183, 255, 90, 0.36)',
}

const landingBodyStyle: CSSProperties = {
  maxWidth: '29rem',
  marginTop: 'clamp(0.62rem, 1.4vw, 1rem)',
  fontSize: 'clamp(0.82rem, 1.16vw, 1rem)',
  lineHeight: 1.5,
  color: 'rgba(244, 241, 234, 0.72)',
}

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)]
const scrambled = (len: number) =>
  Array.from({ length: len }, randomChar).join('')

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleWrapRef = useRef<HTMLDivElement>(null)
  const enterLinkRef = useRef<HTMLAnchorElement>(null)
  const codeWrapRef = useRef<HTMLDivElement>(null)
  const lockedTextRefs = useRef<HTMLSpanElement[]>([])
  const randomTextRefs = useRef<HTMLSpanElement[]>([])
  const bootStartedRef = useRef(false)
  const completionStartedRef = useRef(false)

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
      enterLinkRef.current,
      { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' },
      '-=0.3',
    )
  }, { scope: containerRef })

  const completeLoading = useCallback(() => {
    if (completionStartedRef.current) return
    completionStartedRef.current = true
    onComplete()
  }, [onComplete])

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
      let lastDomWrite = 0
      const exitTimer = window.setTimeout(() => {
        updateCodeLines(totalDuration + 200)
        setPhase('exiting')
      }, totalDuration + 800)

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
        }
      }

      updateCodeLines(0)
      gsap.ticker.add(tick)

      return () => {
        gsap.ticker.remove(tick)
        window.clearTimeout(exitTimer)
      }
    },
    { dependencies: [phase, completeLoading], scope: containerRef },
  )

  // Phase 3: exit slide-up
  useGSAP(
    () => {
      if (phase !== 'exiting') return

      const fallbackTimer = window.setTimeout(completeLoading, 1400)

      if (!containerRef.current) {
        window.clearTimeout(fallbackTimer)
        completeLoading()
        return undefined
      }

      gsap.to(containerRef.current, {
        yPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        onComplete: () => {
          window.clearTimeout(fallbackTimer)
          completeLoading()
        },
      })

      return () => {
        window.clearTimeout(fallbackTimer)
      }
    },
    { dependencies: [phase, completeLoading], scope: containerRef },
  )

  const handleEnter = () => {
    if (bootStartedRef.current) return

    bootStartedRef.current = true
    setPhase('booting')

    if (!enterLinkRef.current) return
    gsap.killTweensOf(enterLinkRef.current)
    gsap.to(enterLinkRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      ease: 'power2.in',
    })
  }

  const handleRootPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (bootStartedRef.current || !enterLinkRef.current) return

    const rect = enterLinkRef.current.getBoundingClientRect()
    const isInsideButton =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom

    if (isInsideButton) {
      handleEnter()
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black px-6 py-[clamp(2rem,6dvh,4.5rem)] text-foreground flex flex-col items-center justify-end"
      onPointerUpCapture={handleRootPointerUp}
    >
      <div className="r3-loading-atmosphere" aria-hidden="true">
        <span className="r3-loading-grid" />
        <span className="r3-loading-wave" />
        <span className="r3-loading-corner r3-loading-corner-tl" />
        <span className="r3-loading-corner r3-loading-corner-tr" />
        <span className="r3-loading-corner r3-loading-corner-bl" />
        <span className="r3-loading-corner r3-loading-corner-br" />
      </div>

      <div
        ref={titleWrapRef}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <LandingAccessMap active={phase !== 'idle'} />
      </div>

      <div
        className={`r3-landing-copy${phase !== 'idle' ? ' is-unlocking' : ''}`}
        style={{
          ...landingCopyStyle,
          opacity: phase === 'idle' ? 1 : 0.34,
          transform: phase === 'idle'
            ? 'translate3d(0, 0, 0)'
            : 'translate3d(0, -0.5rem, 0) scale(0.98)',
        }}
      >
        <h1 style={landingLogoStyle}>R3S1D3NCY</h1>
        <span style={landingTaglineStyle}>Private UK retail access network</span>
        <p style={landingBodyStyle}>
          Unlock city missions, hidden store signals, and resident rewards
          across selected UK retail nodes.
        </p>
      </div>

      {/* Slot: button OR code-scramble */}
      <div className="relative z-10 flex min-h-[8.5rem] w-full max-w-md flex-col items-center justify-start">
        {phase === 'idle' && (
          <Link
            ref={enterLinkRef}
            href="/?skipIntro=1"
            data-r3-enter="true"
            onClick={(event) => {
              event.preventDefault()
              handleEnter()
            }}
            className="group relative overflow-hidden border border-border px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:border-primary sm:px-10 sm:tracking-[0.4em]"
          >
            <span className="absolute inset-0 bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 group-hover:text-primary-foreground transition-colors duration-500">
              Unlock UK access
            </span>
          </Link>
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

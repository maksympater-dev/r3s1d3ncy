'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

const TITLE = 'R3S1D3NCY'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const CODE_LINES: { label: string; target: string }[] = [
  { label: 'BIOMETRIC', target: 'VERIFIED' },
  { label: 'CLEARANCE', target: 'RESIDENT' },
  { label: 'SESSION',   target: 'R3S1D3NCY' },
  { label: 'STATUS',    target: 'GRANTED' },
]

type Phase = 'idle' | 'booting' | 'exiting'
type LineState = { locked: string; random: string }

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)]
const scrambled = (len: number) =>
  Array.from({ length: len }, randomChar).join('')

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleWrapRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<HTMLSpanElement[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const codeWrapRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [lineStates, setLineStates] = useState<LineState[]>(
    CODE_LINES.map((l) => ({ locked: '', random: scrambled(l.target.length) })),
  )

  // Phase 1: initial logo + button reveal
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.from(lettersRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
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
      let cancelled = false

      const timer = window.setInterval(() => {
        const elapsed = performance.now() - startTime

        const states: LineState[] = CODE_LINES.map((line, idx) => {
          const lineElapsed = Math.max(0, elapsed - idx * staggerDelay)
          const progress = Math.min(1, lineElapsed / lockDuration)
          const lockedCount = Math.floor(progress * line.target.length)
          const locked = line.target.slice(0, lockedCount)
          const remaining = line.target.length - lockedCount
          return { locked, random: scrambled(remaining) }
        })

        setLineStates(states)

        if (elapsed >= totalDuration + 200) {
          clearInterval(timer)
          window.setTimeout(() => {
            if (!cancelled) setPhase('exiting')
          }, 600)
        }
      }, 45)

      return () => {
        cancelled = true
        clearInterval(timer)
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
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-center px-6"
    >
      {/* Logo */}
      <div
        ref={titleWrapRef}
        className={`flex items-center overflow-visible mb-10 ${
          phase === 'idle' ? '' : 'loading-logo-glow'
        }`}
      >
        {TITLE.split('').map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) lettersRef.current[i] = el
            }}
            className="text-foreground font-heading font-extrabold text-3xl md:text-5xl uppercase"
            style={{
              display: char === ' ' ? 'block' : 'inline-block',
              width: char === ' ' ? '0.5em' : undefined,
              letterSpacing: '0.12em',
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Slot: button OR code-scramble */}
      <div className="w-full max-w-md min-h-[180px] flex flex-col items-center justify-start">
        {phase === 'idle' && (
          <button
            ref={buttonRef}
            onClick={handleEnter}
            className="group relative px-10 py-3 border border-border text-foreground font-bold text-xs tracking-[0.4em] uppercase overflow-hidden hover:border-primary"
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
            {lineStates.map((line, i) => (
              <div key={i} className="flex items-baseline gap-4">
                <span className="text-muted-foreground uppercase tracking-widest text-xs w-28 shrink-0">
                  {CODE_LINES[i].label}
                </span>
                <span className="tabular-nums">
                  <span className="text-primary">{line.locked}</span>
                  <span className="text-muted-foreground/50">{line.random}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

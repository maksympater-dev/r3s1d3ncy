'use client'

import { useRef, useEffect } from 'react'

interface ResidentCardProps {
  granted?: boolean
}

export default function ResidentCard({ granted = false }: ResidentCardProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const hoveringRef = useRef(false)
  const target = useRef({ rx: 0, ry: 0, mx: 50, my: 30, lift: 0 })
  const current = useRef({ rx: 0, ry: 0, mx: 50, my: 30, lift: 0, holoAngle: 120 })
  const velocity = useRef({ rx: 0, ry: 0, mx: 0, my: 0, lift: 0, holoAngle: 0 })

  useEffect(() => {
    const stage = stageRef.current
    const card = cardRef.current
    if (!stage || !card) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect()
      const cx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const cy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

      hoveringRef.current = true
      target.current.rx = (cx - 0.5) * 32
      target.current.ry = (cy - 0.5) * -22
      target.current.mx = cx * 100
      target.current.my = cy * 100
      target.current.lift = 1
    }

    const onPointerLeave = () => {
      hoveringRef.current = false
      target.current = { rx: 0, ry: 0, mx: 50, my: 30, lift: 0 }
    }

    let lastFrame = performance.now()

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const dt = Math.min((now - lastFrame) / 16.67, 2)
      lastFrame = now

      const c = current.current
      const t = target.current
      const v = velocity.current

      // Idle breathing when no pointer
      if (!hoveringRef.current) {
        const time = now * 0.001
        t.rx = Math.sin(time * 0.4) * 3
        t.ry = Math.cos(time * 0.25) * 2
        t.mx = 50 + Math.sin(time * 0.35) * 16
        t.my = 30 + Math.cos(time * 0.5) * 10
        t.lift = 0.18
      }

      v.rx = (v.rx + (t.rx - c.rx) * 0.24 * dt) * Math.pow(0.66, dt)
      v.ry = (v.ry + (t.ry - c.ry) * 0.24 * dt) * Math.pow(0.66, dt)
      v.mx = (v.mx + (t.mx - c.mx) * 0.32 * dt) * Math.pow(0.6, dt)
      v.my = (v.my + (t.my - c.my) * 0.32 * dt) * Math.pow(0.6, dt)
      v.lift = (v.lift + (t.lift - c.lift) * 0.26 * dt) * Math.pow(0.64, dt)

      c.rx += v.rx * dt
      c.ry += v.ry * dt
      c.mx += v.mx * dt
      c.my += v.my * dt
      c.lift += v.lift * dt

      // Holo angle from horizontal position
      const targetAngle = 90 + (c.mx - 50) * 2.2
      v.holoAngle = (v.holoAngle + (targetAngle - c.holoAngle) * 0.2 * dt) * Math.pow(0.68, dt)
      c.holoAngle += v.holoAngle * dt

      const style = card.style
      style.transform =
        `translate3d(0, ${(-c.lift * 5).toFixed(2)}px, 0) rotateY(${c.rx.toFixed(2)}deg) rotateX(${c.ry.toFixed(2)}deg) scale(${(1 + c.lift * 0.012).toFixed(4)})`
      style.setProperty('--mx', `${c.mx.toFixed(1)}%`)
      style.setProperty('--my', `${c.my.toFixed(1)}%`)
      style.setProperty('--holo-angle', `${c.holoAngle.toFixed(1)}deg`)
    }

    stage.addEventListener('pointermove', onPointerMove)
    stage.addEventListener('pointerleave', onPointerLeave)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerleave', onPointerLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={stageRef}
      className="r3-card-stage"
      aria-label="R3S1D3NCY resident access card"
    >
      <div ref={cardRef} className={`r3-card${granted ? ' is-granted' : ''}`}>
        {/* Holographic diffraction */}
        <div className="r3-card-holo" />
        <div className="r3-card-spectrum" />
        <div className="r3-card-micrograin" />
        {/* Gloss sheen sweep */}
        <div className="r3-card-sheen" />
        <div className="r3-card-edge-light" />

        {/* Text overlay */}
        <div className="r3-card-content">
          <div className="r3-card-header">
            <span className="r3-card-kicker">Resident ID</span>
            <span className="r3-card-chip">R3</span>
          </div>

          <div className="r3-card-title">
            <span>R3S1D3NCY</span>
            <span className="r3-card-number">UK-01 / PRIVATE ACCESS</span>
          </div>

          <div className="r3-card-status">
            <div>
              <span>City node</span>
              <strong>{granted ? 'LONDON READY' : 'DETECTING'}</strong>
            </div>
            <div>
              <span>Tier</span>
              <strong>{granted ? 'RESIDENT' : 'PENDING'}</strong>
            </div>
            <div>
              <span>Retail signal</span>
              <strong>{granted ? 'SYNCED' : 'LOCKED'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{granted ? 'GRANTED' : 'STANDBY'}</strong>
            </div>
          </div>

          <div className="r3-card-footer">
            <span className="r3-card-scanline" />
            <span>{granted ? 'ACCESS CONFIRMED' : 'AWAITING ENTRY'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

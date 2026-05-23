'use client'

import { useEffect, useRef } from 'react'

const GLYPHS = ' .:-=+*#%@'
const TARGET_FRAME_MS = 1000 / 12

export default function GpuAsciiBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    let lastDrawTime = 0

    const resize = () => {
      dpr = 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (timestamp = 0) => {
      raf = window.requestAnimationFrame(draw)
      if (document.hidden || timestamp - lastDrawTime < TARGET_FRAME_MS) return

      lastDrawTime = timestamp
      frame += 1
      ctx.clearRect(0, 0, width, height)

      const cell = width < 760 ? 30 : 28
      ctx.font = `700 ${cell - 4}px var(--font-spotify-ui), monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const time = frame * 0.018
      const centerX = width * 0.52
      const centerY = height * 0.48

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const dx = (x - centerX) / width
          const dy = (y - centerY) / height
          const wave = Math.sin(dx * 28 + time) + Math.cos(dy * 24 - time * 1.2)
          const ring = Math.sin(Math.hypot(dx, dy) * 42 - time * 2.4)
          const signal = Math.max(0, wave * 0.32 + ring * 0.34 + 0.22)

          if (signal < 0.42) continue

          const charIndex = Math.min(
            GLYPHS.length - 1,
            Math.max(0, Math.floor(signal * GLYPHS.length)),
          )
          const alpha = Math.min(0.42, Math.max(0.05, signal * 0.28))
          ctx.fillStyle = `rgba(183, 255, 90, ${alpha})`
          ctx.fillText(GLYPHS[charIndex], x, y)
        }
      }

      const scanY = (height * ((time * 0.08) % 1))
      const gradient = ctx.createLinearGradient(0, scanY - 120, 0, scanY + 80)
      gradient.addColorStop(0, 'rgba(183,255,90,0)')
      gradient.addColorStop(0.5, 'rgba(183,255,90,0.18)')
      gradient.addColorStop(1, 'rgba(183,255,90,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, scanY - 120, width, 200)
    }

    resize()
    raf = window.requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] opacity-35"
    />
  )
}

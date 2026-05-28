'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type ImageVariant = 'desktop' | 'mobile'

type SourcePoint = {
  x: number
  y: number
}

type MapNode = {
  id: string
  label: string
  delay: number
  points: Record<ImageVariant, SourcePoint>
}

type PositionedNode = MapNode & {
  left: number
  top: number
}

type MapLayout = {
  width: number
  height: number
  nodes: PositionedNode[]
}

const CITY_NODES: MapNode[] = [
  {
    id: 'glasgow',
    label: 'Glasgow',
    delay: 0,
    points: {
      desktop: { x: 674, y: 236 },
      mobile: { x: 305, y: 420 },
    },
  },
  {
    id: 'newcastle',
    label: 'Newcastle',
    delay: 0.22,
    points: {
      desktop: { x: 920, y: 335 },
      mobile: { x: 525, y: 635 },
    },
  },
  {
    id: 'manchester',
    label: 'Manchester',
    delay: 0.44,
    points: {
      desktop: { x: 852, y: 465 },
      mobile: { x: 455, y: 765 },
    },
  },
  {
    id: 'birmingham',
    label: 'Birmingham',
    delay: 0.66,
    points: {
      desktop: { x: 951, y: 580 },
      mobile: { x: 530, y: 890 },
    },
  },
  {
    id: 'london',
    label: 'London',
    delay: 0.88,
    points: {
      desktop: { x: 1116, y: 653 },
      mobile: { x: 700, y: 1018 },
    },
  },
]

const ROUTES = [
  ['glasgow', 'newcastle'],
  ['newcastle', 'manchester'],
  ['manchester', 'birmingham'],
  ['birmingham', 'london'],
  ['manchester', 'london'],
] as const

const MAP_IMAGE_SIZE: Record<ImageVariant, { width: number; height: number }> = {
  desktop: { width: 1672, height: 941 },
  mobile: { width: 941, height: 1672 },
}

type LandingAccessMapProps = {
  active?: boolean
}

type NodeStyle = CSSProperties & {
  '--node-delay': string
}

type RouteStyle = CSSProperties & {
  '--route-delay': string
}

export default function LandingAccessMap({ active = false }: LandingAccessMapProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<MapLayout | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    const calculateLayout = () => {
      const rect = frame.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      if (width <= 0 || height <= 0) return

      const variant: ImageVariant = window.matchMedia('(max-width: 640px)').matches
        ? 'mobile'
        : 'desktop'
      const imageSize = MAP_IMAGE_SIZE[variant]
      const scale = Math.max(width / imageSize.width, height / imageSize.height)
      const renderedWidth = imageSize.width * scale
      const renderedHeight = imageSize.height * scale
      const offsetX = (width - renderedWidth) / 2
      const offsetY = (height - renderedHeight) / 2

      setLayout({
        width,
        height,
        nodes: CITY_NODES.map((node) => {
          const point = node.points[variant]

          return {
            ...node,
            left: offsetX + point.x * scale,
            top: offsetY + point.y * scale,
          }
        }),
      })
    }

    calculateLayout()

    const resizeObserver = new ResizeObserver(calculateLayout)
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    resizeObserver.observe(frame)
    mediaQuery.addEventListener('change', calculateLayout)
    window.addEventListener('resize', calculateLayout)

    return () => {
      resizeObserver.disconnect()
      mediaQuery.removeEventListener('change', calculateLayout)
      window.removeEventListener('resize', calculateLayout)
    }
  }, [])

  const positionedNodeById = useMemo(
    () => new Map(layout?.nodes.map((node) => [node.id, node])),
    [layout],
  )

  return (
    <section
      className={`r3-access-map${active ? ' is-active' : ''}`}
      aria-label="UK access map with five city nodes"
    >
      <div className="r3-access-map-frame" ref={frameRef}>
        <span className="r3-access-map-picture" aria-hidden="true">
          <Image
            src="/landing/uk-access-map-desktop.png"
            alt=""
            fill
            priority
            sizes="94vw"
            className="r3-access-map-image r3-access-map-image-desktop"
          />
          <Image
            src="/landing/uk-access-map-mobile.png"
            alt=""
            fill
            priority
            sizes="94vw"
            className="r3-access-map-image r3-access-map-image-mobile"
          />
        </span>

        <span className="r3-access-map-vignette" aria-hidden="true" />
        <span className="r3-access-map-watermark" aria-hidden="true">R3</span>
        <span className="r3-access-map-sweep" aria-hidden="true" />

        {layout ? (
          <>
            <svg
              className="r3-access-map-routes"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="r3-route-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {ROUTES.map(([fromId, toId], index) => {
                const from = positionedNodeById.get(fromId)
                const to = positionedNodeById.get(toId)

                if (!from || !to) return null

                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={from.left}
                    y1={from.top}
                    x2={to.left}
                    y2={to.top}
                    className="r3-access-map-route"
                    style={{ '--route-delay': `${index * 0.18}s` } as RouteStyle}
                    filter="url(#r3-route-glow)"
                  />
                )
              })}
            </svg>

            <div className="r3-access-map-nodes" aria-hidden="true">
              {layout.nodes.map((node) => (
                <span
                  key={node.id}
                  className={`r3-access-map-node r3-access-map-node-${node.id}`}
                  style={
                    {
                      left: node.left,
                      top: node.top,
                      '--node-delay': `${node.delay}s`,
                    } as NodeStyle
                  }
                >
                  <span className="r3-access-map-node-core" />
                  <span className="r3-access-map-node-ring" />
                  <span className="r3-access-map-node-label">{node.label}</span>
                </span>
              ))}
            </div>
          </>
        ) : null}

        <div className="r3-access-map-status" aria-hidden="true">
          <span>UK-01</span>
          <span>{active ? 'GRID UNLOCKING' : 'CITY GRID STANDBY'}</span>
        </div>
      </div>
    </section>
  )
}

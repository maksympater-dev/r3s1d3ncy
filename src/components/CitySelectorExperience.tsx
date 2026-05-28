'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import AuthActions from './AuthActions'
import CityMapExperience, { type CityMapData } from './CityMapExperience'
import { DEMO_MISSION_STORE } from './demoMissionStore'
import StoreMissionModal from './StoreMissionModal'

const CITY_MAPS: CityMapData[] = [
  {
    name: 'London',
    center: [-0.1276, 51.5072],
    zoom: 11.25,
    stores: [
      {
        name: 'Selfridges London',
        partner: 'Selfridges',
        address: '400 Oxford Street, London W1A 1AB',
        coordinates: [-0.1527, 51.5144],
        tier: 'Legendary',
        missions: [
          'Verify the Oxford Street discount radius.',
          'Scan the luxury floor for a hidden markdown signal.',
          'Unlock the Legendary discount path preview.',
        ],
      },
      {
        name: 'Flannels Oxford Street',
        partner: 'Flannels',
        address: '161-167 Oxford Street, London W1D 2JP',
        coordinates: [-0.1354, 51.5148],
        tier: 'Rare',
        missions: [
          'Scan featured rails for the hidden Flannels clue.',
          'Collect the Rare discount signal.',
          'Progress toward Rare member status.',
        ],
      },
    ],
  },
  {
    name: 'Birmingham',
    center: [-1.8904, 52.4862],
    zoom: 11.6,
    stores: [
      {
        name: 'Selfridges Birmingham',
        partner: 'Selfridges',
        address: 'The Bullring, Birmingham B5 4BP',
        coordinates: [-1.8936, 52.4776],
        tier: 'Legendary',
        missions: [
          'Enter the Bullring discount radius.',
          'Scan the floor for a timed markdown clue.',
          'Claim the city discount signal.',
        ],
      },
      {
        name: 'Flannels Birmingham',
        partner: 'Flannels',
        address: 'Birmingham retail node',
        coordinates: [-1.8974, 52.4798],
        tier: 'Rare',
        missions: [
          'Find the partner sale activation point.',
          'Scan the in-store access marker.',
          'Unlock a Rare discount prompt.',
        ],
      },
    ],
  },
  {
    name: 'Manchester',
    center: [-2.2426, 53.4808],
    zoom: 11.45,
    stores: [
      {
        name: 'Selfridges Exchange Square',
        partner: 'Selfridges',
        address: '1 Exchange Square, Manchester M3 1BD',
        coordinates: [-2.2447, 53.4848],
        tier: 'Legendary',
        missions: [
          'Verify the Exchange Square discount radius.',
          'Scan the flagship department node.',
          'Open Legendary markdown access.',
        ],
      },
      {
        name: 'END. Manchester',
        partner: 'END.',
        address: 'Manchester retail node',
        coordinates: [-2.2391, 53.4822],
        tier: 'Common',
        missions: [
          'Check in near the END. discount node.',
          'Scan a seasonal product tag.',
          'Claim a Common markdown signal.',
        ],
      },
    ],
  },
  {
    name: 'Newcastle',
    center: [-1.6178, 54.9783],
    zoom: 11.55,
    stores: [
      {
        name: 'END. Newcastle',
        partner: 'END.',
        address: '133-137 Grainger Street, Newcastle upon Tyne NE1 5AE',
        coordinates: [-1.6149, 54.9727],
        tier: 'Common',
        missions: [
          'Enter the Grainger Street discount radius.',
          'Scan an END. product signal.',
          'Claim the founding discount badge.',
        ],
      },
      {
        name: 'Fenwick Newcastle',
        partner: 'Fenwick',
        address: '39 Northumberland Street, Newcastle upon Tyne NE1 7AS',
        coordinates: [-1.6129, 54.9779],
        tier: 'Rare',
        missions: [
          'Check in near Fenwick Newcastle.',
          'Find the heritage markdown marker.',
          'Unlock a resident discount prompt.',
        ],
      },
    ],
  },
  {
    name: 'Glasgow',
    center: [-4.2518, 55.8642],
    zoom: 11.45,
    stores: [
      {
        name: 'Flannels Glasgow',
        partner: 'Flannels',
        address: 'Glasgow city retail node',
        coordinates: [-4.2553, 55.8609],
        tier: 'Rare',
        missions: [
          'Enter the Glasgow discount radius.',
          'Scan the Flannels access marker.',
          'Progress toward Rare discount status.',
        ],
      },
      {
        name: 'Fenwick Glasgow',
        partner: 'Fenwick',
        address: 'Glasgow partner signal',
        coordinates: [-4.2491, 55.8617],
        tier: 'Common',
        missions: [
          'Complete partner discount verification.',
          'Scan the local access point.',
          'Claim a Common discount badge.',
        ],
      },
    ],
  },
]

const CITIES = CITY_MAPS.map((city) => city.name)

const CITY_SIGNAL_POINTS: Record<string, { x: number; y: number }> = {
  Glasgow: { x: 18, y: 18 },
  Newcastle: { x: 35, y: 34 },
  Manchester: { x: 44, y: 52 },
  Birmingham: { x: 56, y: 68 },
  London: { x: 73, y: 82 },
}

const CITY_SIGNAL_ROUTES = [
  ['Glasgow', 'Newcastle'],
  ['Newcastle', 'Manchester'],
  ['Manchester', 'Birmingham'],
  ['Birmingham', 'London'],
  ['Manchester', 'London'],
] as const

const getRelativePosition = (index: number, activeIndex: number) => {
  const total = CITIES.length
  let offset = index - activeIndex

  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total

  return offset
}

type CityTrackingStyle = CSSProperties & {
  '--city-tilt-x': string
  '--city-tilt-y': string
  '--city-shift-x': string
  '--city-shift-y': string
  '--city-shadow-x': string
  '--city-shadow-y': string
  '--city-depth-x': string
  '--city-depth-y': string
  '--city-glare-x': string
  '--city-glare-y': string
}

const neutralCityTracking: CityTrackingStyle = {
  '--city-tilt-x': '0deg',
  '--city-tilt-y': '0deg',
  '--city-shift-x': '0px',
  '--city-shift-y': '0px',
  '--city-shadow-x': '0px',
  '--city-shadow-y': '0px',
  '--city-depth-x': '0px',
  '--city-depth-y': '0px',
  '--city-glare-x': '50%',
  '--city-glare-y': '50%',
}

const setCityTrackingProperties = (
  element: HTMLElement,
  style: CityTrackingStyle,
) => {
  Object.entries(style).forEach(([property, value]) => {
    element.style.setProperty(property, String(value))
  })
}

export default function CitySelectorExperience() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mapCity, setMapCity] = useState<CityMapData | null>(null)
  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const wheelLockedRef = useRef(false)
  const wheelUnlockTimerRef = useRef<number | null>(null)
  const pointerFrameRef = useRef<number | null>(null)
  const pointerTargetRef = useRef<HTMLElement | null>(null)
  const pointerStyleRef = useRef<CityTrackingStyle>(neutralCityTracking)

  const cityStack = useMemo(
    () =>
      CITIES.map((city, index) => ({
        city,
        index,
        offset: getRelativePosition(index, activeIndex),
      })),
    [activeIndex],
  )

  const activeCity = CITY_MAPS[activeIndex]
  const activeMissionCount = activeCity.stores.reduce(
    (total, store) => total + store.missions.length,
    0,
  )
  const activePartners = activeCity.stores.map((store) => store.partner).join(' / ')
  const activeTierSignal = activeCity.stores
    .map((store) => store.tier)
    .filter((tier, index, tiers) => tiers.indexOf(tier) === index)
    .join(' + ')

  useEffect(() => {
    return () => {
      if (wheelUnlockTimerRef.current) {
        window.clearTimeout(wheelUnlockTimerRef.current)
      }
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current)
      }
    }
  }, [])

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return

    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5
    const tiltY = normalizedX * 28
    const tiltX = normalizedY * -18
    const shiftX = normalizedX * 24
    const shiftY = normalizedY * 16
    const glareX = Math.max(8, Math.min(92, 50 + normalizedX * 86))
    const glareY = Math.max(8, Math.min(92, 50 + normalizedY * 76))

    pointerTargetRef.current = event.currentTarget
    pointerStyleRef.current = {
      '--city-tilt-x': `${tiltX.toFixed(2)}deg`,
      '--city-tilt-y': `${tiltY.toFixed(2)}deg`,
      '--city-shift-x': `${shiftX.toFixed(2)}px`,
      '--city-shift-y': `${shiftY.toFixed(2)}px`,
      '--city-shadow-x': `${(-shiftX * 0.8).toFixed(2)}px`,
      '--city-shadow-y': `${(-shiftY * 0.9).toFixed(2)}px`,
      '--city-depth-x': `${(-shiftX * 0.42).toFixed(2)}px`,
      '--city-depth-y': `${(10 - shiftY * 0.32).toFixed(2)}px`,
      '--city-glare-x': `${glareX.toFixed(2)}%`,
      '--city-glare-y': `${glareY.toFixed(2)}%`,
    }

    if (pointerFrameRef.current) return

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null
      if (!pointerTargetRef.current) return
      setCityTrackingProperties(pointerTargetRef.current, pointerStyleRef.current)
    })
  }

  const resetPointerTracking = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerFrameRef.current) {
      window.cancelAnimationFrame(pointerFrameRef.current)
      pointerFrameRef.current = null
    }
    pointerTargetRef.current = null
    pointerStyleRef.current = neutralCityTracking
    setCityTrackingProperties(event.currentTarget, neutralCityTracking)
  }

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    event.preventDefault()
    if (wheelLockedRef.current || Math.abs(event.deltaY) < 10) return

    wheelLockedRef.current = true
    setActiveIndex((current) => {
      if (event.deltaY > 0) return (current + 1) % CITIES.length
      return (current - 1 + CITIES.length) % CITIES.length
    })

    if (wheelUnlockTimerRef.current) {
      window.clearTimeout(wheelUnlockTimerRef.current)
    }

    wheelUnlockTimerRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false
      wheelUnlockTimerRef.current = null
    }, 420)
  }

  const openActiveCity = () => {
    setMapCity(activeCity)
  }

  if (mapCity) {
    return (
      <CityMapExperience
        key={mapCity.name}
        city={mapCity}
        onBack={() => setMapCity(null)}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/92 px-[var(--page-gutter)] py-3 sm:py-4">
        <nav className="flex w-full flex-nowrap items-center justify-between gap-2">
          <div className="min-w-0 shrink font-heading text-xs font-extrabold uppercase tracking-[0.12em] text-foreground sm:text-sm sm:tracking-[0.18em]">
            R3S1D3NCY
          </div>
          <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsMissionOpen(true)}
              className="border border-primary/70 bg-primary/10 px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary transition hover:bg-primary hover:text-primary-foreground min-[380px]:px-3 min-[430px]:text-[11px] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              <span className="hidden min-[380px]:inline">Signal </span>Bypass
            </button>
            <AuthActions />
          </div>
        </nav>
      </header>

      <section
        className="relative flex min-h-dvh items-center overflow-x-hidden px-[var(--page-gutter)] pb-6 pt-20"
        style={neutralCityTracking}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerTracking}
        onWheel={handleWheel}
        onKeyDown={(event) => {
          if (event.key === 'Enter') openActiveCity()
        }}
        tabIndex={0}
      >
        <div className="city-selector-backdrop" aria-hidden="true">
          <span className="city-selector-map-glow city-selector-map-glow-primary" />
          <span className="city-selector-map-glow city-selector-map-glow-secondary" />
          <span className="city-selector-grid-field" />
          <span className="city-selector-scan-corridor" />

          <svg
            className="city-selector-route-map"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CITY_SIGNAL_ROUTES.map(([fromCity, toCity], index) => {
              const from = CITY_SIGNAL_POINTS[fromCity]
              const to = CITY_SIGNAL_POINTS[toCity]

              return (
                <line
                  key={`${fromCity}-${toCity}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="city-selector-route"
                  style={{ animationDelay: `${index * 0.16}s` }}
                />
              )
            })}
          </svg>
        </div>

        <div className="relative min-h-[calc(100dvh-5rem)] w-full">
          <div className="relative h-[calc(100dvh-5rem)] min-h-[clamp(24rem,74dvh,48rem)] overflow-visible">
            <div className="pointer-events-none absolute left-0 top-0 z-30 max-w-[min(22rem,76vw)] lg:-top-3">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-primary sm:text-xs sm:tracking-[0.36em]">
                Select city
              </p>
              <p className="hidden max-w-md text-sm leading-6 text-muted-foreground sm:block">
                Rotate the city stack with your mouse wheel. Choose the market
                where your discount hunt begins.
              </p>
              <div
                className="city-selector-summary"
                aria-label={`${activeCity.name} city signal summary`}
              >
                <span>{activeCity.stores.length} retail nodes</span>
                <span>{activeMissionCount} missions</span>
                <span>{activeTierSignal}</span>
              </div>
            </div>

            <div className="city-stack-stage absolute inset-0 z-10 flex items-center justify-center">
              {cityStack.map(({ city, index, offset }) => {
                const isActive = offset === 0
                const distance = Math.abs(offset)
                const opacity = isActive ? 1 : Math.max(0.07, 0.16 - distance * 0.035)
                const scale = isActive ? 1 : 0.92 - distance * 0.035
                const x =
                  distance === 0
                    ? '0px'
                    : `calc(${distance} * clamp(-1.5rem, -1.6vw, -0.5rem))`
                const y = `calc(${offset} * clamp(5.2rem, 16dvh, 10.75rem))`

                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      index === activeIndex
                        ? openActiveCity()
                        : setActiveIndex(index)
                    }
                    className={`city-stack-item absolute left-1/2 w-[min(100%,calc(100vw-(var(--page-gutter)*2)))] text-center font-heading font-extrabold uppercase tracking-normal transition-[transform,opacity,color] duration-500 ${
                      isActive
                        ? 'is-active z-20 text-foreground'
                        : 'z-10 text-muted-foreground'
                    }`}
                    style={{
                      opacity,
                      transform: `translate3d(calc(-50% + ${x}), ${y}, 0) scale(${scale})`,
                    }}
                  >
                    <span
                      className={`city-stack-label relative inline-block ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                      style={{
                        animationDelay: `${Math.abs(offset) * 0.18}s`,
                      }}
                    >
                      <span className="city-stack-tilt relative inline-block">
                        <span className="city-stack-word relative z-10" data-text={city}>
                          {city}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <aside
            className="city-intel-panel"
            aria-label={`${activeCity.name} access intelligence`}
          >
            <span className="city-intel-panel-glow" aria-hidden="true" />

            <div className="city-intel-panel-header">
              <p>Active city signal</p>
              <h2>{activeCity.name}</h2>
              <span>{activePartners}</span>
            </div>

            <div className="city-intel-metrics">
              <div>
                <span>Retail nodes</span>
                <strong>{String(activeCity.stores.length).padStart(2, '0')}</strong>
              </div>
              <div>
                <span>Mission queue</span>
                <strong>{String(activeMissionCount).padStart(2, '0')}</strong>
              </div>
              <div>
                <span>Tier signal</span>
                <strong>{activeTierSignal}</strong>
              </div>
            </div>

            <div className="city-intel-store-list">
              {activeCity.stores.map((store) => (
                <div key={store.name} className="city-intel-store">
                  <div>
                    <span>{store.partner}</span>
                    <strong>{store.name}</strong>
                  </div>
                  <em>{store.tier}</em>
                </div>
              ))}
            </div>

            <div className="city-intel-mission">
              <span>First scan</span>
              <p>{activeCity.stores[0]?.missions[0]}</p>
            </div>
          </aside>

          <div
            className="city-mobile-intel"
            aria-label={`${activeCity.name} city access preview`}
          >
            <span>{activeCity.name}</span>
            <strong>{activeCity.stores.length} nodes</strong>
            <em>{activeMissionCount} missions queued</em>
          </div>
        </div>
      </section>
      {isMissionOpen && (
        <StoreMissionModal
          isOpen={isMissionOpen}
          onClose={() => setIsMissionOpen(false)}
          store={DEMO_MISSION_STORE}
        />
      )}
    </main>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import AuthActions from './AuthActions'
import CityMapExperience, { type CityMapData } from './CityMapExperience'

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
    setMapCity(CITY_MAPS[activeIndex])
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
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/92 px-[var(--page-gutter)] py-4">
        <nav className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="font-heading text-sm font-extrabold uppercase tracking-[0.14em] text-foreground sm:tracking-[0.18em]">
            R3S1D3NCY
          </div>
          <AuthActions />
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
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[min(74vw,620px)] w-[min(74vw,620px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(183,255,90,0.09)_0%,transparent_68%)] opacity-80" />
          <div className="absolute bottom-0 right-0 h-[min(68vw,520px)] w-[min(68vw,520px)] bg-[radial-gradient(circle,rgba(110,168,255,0.09)_0%,transparent_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-gradient-to-b from-transparent via-border to-transparent" />
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
                    className={`city-stack-item absolute left-1/2 w-max max-w-[calc(100vw-(var(--page-gutter)*2))] text-center font-heading text-[clamp(3.25rem,14.5vw,9.25rem)] font-extrabold uppercase leading-[0.78] tracking-normal transition-[transform,opacity,color] duration-500 lg:text-[clamp(5rem,8.4vw,11rem)] ${
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

          <aside className="absolute right-0 top-1/2 z-30 hidden w-[min(22rem,24vw)] min-w-[20rem] max-w-[26.25rem] -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-[8px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(0,0,0,0.38)] 2xl:block 2xl:min-h-[min(68dvh,680px)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,241,234,0.14),transparent_44%)]" />
            <div className="absolute right-8 top-8 h-48 w-48 bg-[radial-gradient(circle,rgba(183,255,90,0.10)_0%,transparent_68%)] opacity-80" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                  Active node
                </p>
                <h2 className="mt-5 font-heading text-6xl font-extrabold uppercase leading-none text-foreground">
                  {CITIES[activeIndex]}
                </h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  This city becomes the first access layer for hidden discount
                  clues, retail scans, and tier progression.
                </p>
              </div>

              <div className="grid gap-3">
                {['Location check', 'Retail scan', 'Access badge'].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between border border-border bg-background/70 p-4"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {item}
                      </span>
                      <span className="font-heading text-lg font-extrabold text-primary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

'use client'

import { useMemo, useState } from 'react'
import AuthActions from './AuthActions'
import CityLogotypeMark from './CityLogotypeMark'
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
          'Complete Oxford Street location verification.',
          'Scan a luxury floor access point.',
          'Unlock the Legendary path preview.',
        ],
      },
      {
        name: 'Flannels Oxford Street',
        partner: 'Flannels',
        address: '161-167 Oxford Street, London W1D 2JP',
        coordinates: [-0.1354, 51.5148],
        tier: 'Rare',
        missions: [
          'Scan a featured product signal.',
          'Collect the Flannels retail badge.',
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
          'Enter the Bullring retail radius.',
          'Complete a location check.',
          'Claim the city resident signal.',
        ],
      },
      {
        name: 'Flannels Birmingham',
        partner: 'Flannels',
        address: 'Birmingham retail node',
        coordinates: [-1.8974, 52.4798],
        tier: 'Rare',
        missions: [
          'Find the partner activation point.',
          'Scan the in-store access marker.',
          'Unlock a Rare tier prompt.',
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
          'Verify presence at Exchange Square.',
          'Scan the flagship department node.',
          'Open Legendary assignment access.',
        ],
      },
      {
        name: 'END. Manchester',
        partner: 'END.',
        address: 'Manchester retail node',
        coordinates: [-2.2391, 53.4822],
        tier: 'Common',
        missions: [
          'Check in near the END. node.',
          'Scan a seasonal product tag.',
          'Claim a Common tier signal.',
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
          'Enter the Grainger Street access radius.',
          'Scan an END. product signal.',
          'Claim the founding resident badge.',
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
          'Find the heritage retail marker.',
          'Unlock a Resident onboarding prompt.',
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
          'Enter the Glasgow retail radius.',
          'Scan the Flannels access marker.',
          'Progress toward Rare status.',
        ],
      },
      {
        name: 'Fenwick Glasgow',
        partner: 'Fenwick',
        address: 'Glasgow partner signal',
        coordinates: [-4.2491, 55.8617],
        tier: 'Common',
        missions: [
          'Complete partner signal verification.',
          'Scan the local access point.',
          'Claim a Common tier badge.',
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

export default function CitySelectorExperience() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isWheelLocked, setIsWheelLocked] = useState(false)
  const [mapCity, setMapCity] = useState<CityMapData | null>(null)
  const activeCity = CITIES[activeIndex]

  const cityStack = useMemo(
    () =>
      CITIES.map((city, index) => ({
        city,
        index,
        offset: getRelativePosition(index, activeIndex),
      })),
    [activeIndex],
  )

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    event.preventDefault()
    if (isWheelLocked || Math.abs(event.deltaY) < 10) return

    setIsWheelLocked(true)
    setActiveIndex((current) => {
      if (event.deltaY > 0) return (current + 1) % CITIES.length
      return (current - 1 + CITIES.length) % CITIES.length
    })

    window.setTimeout(() => setIsWheelLocked(false), 420)
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
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/72 px-4 py-4 backdrop-blur-xl md:px-6">
        <nav className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4">
          <div className="font-heading text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
            R3S1D3NCY
          </div>
          <AuthActions />
        </nav>
      </header>

      <section
        className="relative flex min-h-screen items-center overflow-hidden px-4 pt-16 md:px-6"
        onWheel={handleWheel}
        onKeyDown={(event) => {
          if (event.key === 'Enter') openActiveCity()
        }}
        tabIndex={0}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1800px] items-center gap-12 md:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <div className="relative h-[76vh] min-h-[560px] overflow-visible -translate-x-2 md:-translate-x-8 xl:-translate-x-14">
            <div className="pointer-events-none absolute -left-4 top-0 z-30 max-w-sm md:-left-12 md:-top-4">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.36em] text-primary">
                Select city
              </p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Rotate the city stack with your mouse wheel. Choose the market
                where your resident journey begins.
              </p>
            </div>

            <div className="absolute inset-0 z-10 flex items-center">
              {cityStack.map(({ city, index, offset }) => {
                const isActive = offset === 0
                const y = offset * 176
                const x = Math.abs(offset) * -28
                const distance = Math.abs(offset)
                const opacity = isActive ? 1 : Math.max(0.07, 0.16 - distance * 0.035)
                const scale = isActive ? 1 : 0.92 - distance * 0.035

                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      index === activeIndex
                        ? openActiveCity()
                        : setActiveIndex(index)
                    }
                    className={`city-stack-item absolute left-0 w-full text-left font-heading text-[15vw] font-extrabold uppercase leading-[0.78] tracking-normal transition-all duration-500 md:text-[8.8vw] ${
                      isActive
                        ? 'z-20 text-foreground'
                        : 'z-10 text-muted-foreground'
                    }`}
                    style={{
                      opacity,
                      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
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
                      <CityLogotypeMark
                        cityName={city}
                        className={`z-0 left-0 top-1/2 h-[3.15em] w-full -translate-y-1/2 ${
                          isActive ? 'opacity-[0.82]' : 'opacity-[0.035]'
                        }`}
                      />
                      <span className="relative z-10">{city}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="relative hidden min-h-[68vh] translate-x-16 overflow-hidden rounded-[8px] border border-border bg-card p-6 shadow-[0_34px_130px_rgba(0,0,0,0.64)] md:block xl:translate-x-24">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,241,234,0.14),transparent_44%)]" />
            <div className="absolute right-8 top-8 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                  Active node
                </p>
                <h2 className="mt-5 font-heading text-6xl font-extrabold uppercase leading-none text-foreground">
                  {CITIES[activeIndex]}
                </h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  This city becomes the first access layer for resident
                  verification, retail missions, and tier progression.
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

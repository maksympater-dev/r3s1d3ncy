'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type Brand = {
  name: string
  src: string
  tone: string
  invitation: string
  missions: string[]
}

const BRANDS: Brand[] = [
  {
    name: 'Flannels',
    src: '/brands/flannels.png',
    tone: 'Luxury street retail node',
    invitation:
      'Activate a product scan, collect the access signal, and progress toward Rare member status.',
    missions: [
      'Scan a featured item in-store.',
      'Collect the Flannels access signal.',
      'Progress toward Rare member status.',
    ],
  },
  {
    name: 'Fenwick',
    src: '/brands/fenwick-logo.jpg',
    tone: 'Heritage department store gateway',
    invitation:
      'Visit the retail location, verify your presence, and receive a private resident onboarding prompt.',
    missions: [
      'Check in near the Fenwick entrance.',
      'Find the luxury floor activation marker.',
      'Unlock a Resident onboarding prompt.',
    ],
  },
  {
    name: 'Selfridges',
    src: '/brands/selfridges.jpg',
    tone: 'Flagship cultural retail hub',
    invitation:
      'Enter the store zone, complete a location check, and unlock the resident instruction sequence.',
    missions: [
      'Enter the flagship location zone.',
      'Complete a proximity verification.',
      'Unlock the Legendary path preview.',
    ],
  },
  {
    name: 'END.',
    src: '/brands/end.png',
    tone: 'Digital menswear access point',
    invitation:
      'Complete an in-store scan, claim your session badge, and unlock the first residency tier.',
    missions: [
      'Scan the seasonal product tag inside END.',
      'Verify store presence within the access radius.',
      'Claim a Common tier retail signal.',
    ],
  },
]

const getRelativePosition = (index: number, activeIndex: number) => {
  const total = BRANDS.length
  let offset = index - activeIndex

  if (offset > total / 2) offset -= total
  if (offset < -total / 2) offset += total

  return offset
}

export default function BrandResidencyExperience() {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.floor(Math.random() * BRANDS.length),
  )
  const [isWheelLocked, setIsWheelLocked] = useState(false)

  const deckCards = useMemo(
    () =>
      BRANDS.map((brand, index) => ({
        brand,
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
      if (event.deltaY > 0) return (current + 1) % BRANDS.length
      return (current - 1 + BRANDS.length) % BRANDS.length
    })

    window.setTimeout(() => setIsWheelLocked(false), 520)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/72 px-4 py-4 backdrop-blur-xl md:px-6">
        <nav className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4">
          <div className="font-heading text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
            R3S1D3NCY
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              Sign in
            </button>
            <button
              type="button"
              className="border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-transparent hover:text-primary"
            >
              Sign up
            </button>
          </div>
        </nav>
      </header>

      <section className="relative min-h-screen overflow-hidden px-4 pb-8 pt-24 md:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div
          className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1800px] flex-col gap-7"
          onWheel={handleWheel}
        >
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.36em] text-primary">
              Brand access layer
            </p>
            <h1 className="font-heading text-4xl font-extrabold leading-[0.95] tracking-normal text-foreground md:text-6xl">
              Choose a retail node to open your resident path.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Each brand becomes an entry point into the phygital experience:
              store visit, product scan, verification, and reward tier
              progression inside R3S1D3NCY.
            </p>
          </div>

          <div className="relative flex min-h-[58vh] flex-1 items-center justify-center overflow-visible">
            <div className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground md:block">
              Wheel to rotate
            </div>
            <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground md:block">
              Click to open
            </div>

            <div className="brand-deck relative h-[58vh] min-h-[430px] w-full max-w-[1120px]">
              {deckCards.map(({ brand, index, offset }) => {
                const isActive = offset === 0
                const depth = Math.abs(offset)
                const x = offset * 34
                const y = depth * 3
                const scale = isActive ? 1 : 0.76 - depth * 0.07
                const rotate = offset * -12
                const opacity = isActive ? 1 : 0.62 - depth * 0.12
                const blur = isActive ? 0 : 2.4 + depth * 1.2

                return (
                  <button
                    key={brand.name}
                    type="button"
                    aria-label={`Open ${brand.name} residency instructions`}
                    onClick={() =>
                      isActive ? setSelectedBrand(brand) : setActiveIndex(index)
                    }
                    className={`brand-deck-card group absolute inset-0 rounded-[8px] border bg-card p-5 text-left shadow-[0_34px_130px_rgba(0,0,0,0.64)] transition-all duration-700 ease-out ${
                      isActive
                        ? 'z-20 border-primary/70'
                        : 'z-10 border-border/80'
                    }`}
                    style={{
                      opacity,
                      filter: `blur(${blur}px)`,
                      transform: `translate3d(${x}%, ${y}%, ${
                        isActive ? 80 : -depth * 90
                      }px) rotateY(${rotate}deg) scale(${scale})`,
                    }}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,241,234,0.14),transparent_44%)] opacity-80" />
                    <span className="pointer-events-none absolute inset-x-10 top-10 h-36 rounded-full bg-primary/10 blur-3xl transition duration-500 group-hover:bg-primary/20" />

                    <span className="brand-deck-card-inner relative flex h-full flex-col justify-between gap-8">
                      <span className="brand-logo-stage flex min-h-[34vh] items-center justify-center rounded-[8px] border border-border/70 bg-background/80 p-8">
                        <Image
                          src={brand.src}
                          alt={`${brand.name} logo`}
                          width={680}
                          height={360}
                          className="brand-logo-image max-h-48 w-full object-contain md:max-h-56"
                          priority={isActive}
                        />
                      </span>

                      <span className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <span className="flex flex-col gap-3">
                          <span className="font-heading text-4xl font-extrabold text-foreground md:text-6xl">
                            {brand.name}
                          </span>
                          <span className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                            {brand.tone}
                          </span>
                        </span>
                        <span className="inline-flex w-fit border border-primary/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                          {isActive ? 'Open active node' : 'Bring forward'}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {BRANDS.map((brand, index) => (
              <button
                key={brand.name}
                type="button"
                aria-label={`Show ${brand.name}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-10 bg-primary'
                    : 'w-3 bg-muted-foreground/35 hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedBrand && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/75 px-4 pb-4 backdrop-blur-xl md:items-center md:pb-0">
          <button
            type="button"
            aria-label="Close resident instructions"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedBrand(null)}
          />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-[8px] border border-border bg-card p-6 shadow-[0_30px_120px_rgba(0,0,0,0.7)] md:p-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
            <div className="relative flex flex-col gap-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                    Resident protocol
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-extrabold text-foreground md:text-5xl">
                    {selectedBrand.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBrand(null)}
                  className="border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  Close
                </button>
              </div>

              <p className="text-base leading-7 text-muted-foreground">
                {selectedBrand.invitation}
              </p>

              <div className="grid gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
                  Active assignments
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  {selectedBrand.missions.map((mission, index) => (
                    <div
                      key={mission}
                      className="min-h-28 border border-border bg-background/70 p-4"
                    >
                      <p className="font-heading text-lg font-extrabold text-primary">
                        M{index + 1}
                      </p>
                      <p className="mt-3 text-sm leading-5 text-muted-foreground">
                        {mission}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <ol className="grid gap-3 text-sm text-foreground">
                {[
                  'Visit the selected retail location.',
                  'Open a R3S1D3NCY session and complete location verification.',
                  'Scan a product, display, or QR access point inside the space.',
                  'Claim your resident badge and progress toward Common, Rare, or Legendary tier.',
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 border border-border bg-background/70 p-4"
                  >
                    <span className="font-heading text-lg font-extrabold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

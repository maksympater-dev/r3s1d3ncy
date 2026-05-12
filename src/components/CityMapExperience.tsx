'use client'

import 'mapbox-gl/dist/mapbox-gl.css'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import AuthActions from './AuthActions'

export type StoreNode = {
  name: string
  partner: string
  address: string
  coordinates: [number, number]
  tier: 'Common' | 'Rare' | 'Legendary'
  missions: string[]
}

export type CityMapData = {
  name: string
  center: [number, number]
  zoom: number
  stores: StoreNode[]
}

type CityMapExperienceProps = {
  city: CityMapData
  onBack: () => void
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export default function CityMapExperience({
  city,
  onBack,
}: CityMapExperienceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const { isSignedIn } = useUser()
  const [selectedStore, setSelectedStore] = useState<StoreNode>(city.stores[0])
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [introPhase, setIntroPhase] = useState<'center' | 'top' | 'done'>(
    'center',
  )
  const introComplete = introPhase !== 'center'

  useEffect(() => {
    const moveTimer = window.setTimeout(() => setIntroPhase('top'), 820)
    const doneTimer = window.setTimeout(() => setIntroPhase('done'), 1700)

    return () => {
      window.clearTimeout(moveTimer)
      window.clearTimeout(doneTimer)
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxgl.accessToken) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: city.center,
      zoom: city.zoom,
      pitch: 58,
      bearing: -18,
      antialias: true,
    })

    mapRef.current = map
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'bottom-right',
    )

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [city.center, city.zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    map.flyTo({
      center: city.center,
      zoom: city.zoom,
      pitch: 58,
      bearing: -18,
      duration: 1100,
      essential: true,
    })

    city.stores.forEach((store) => {
      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.className = 'map-access-marker'
      markerElement.setAttribute('aria-label', `Open ${store.name}`)
      markerElement.innerHTML = '<span></span>'
      markerElement.addEventListener('click', () => {
        setSelectedStore(store)
        map.flyTo({
          center: store.coordinates,
          zoom: city.zoom + 1.15,
          pitch: 62,
          bearing: -28,
          duration: 900,
          essential: true,
        })
      })

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(store.coordinates)
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [city])

  const hasToken = Boolean(mapboxgl.accessToken)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/72 px-4 py-4 backdrop-blur-xl md:px-6">
        <nav className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            Back
          </button>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Access map
          </div>
          <AuthActions />
        </nav>
      </header>

      <section className="relative min-h-screen overflow-hidden px-4 pt-20 md:px-6">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,transparent_42%,rgba(5,5,5,0.62)_100%)]" />

        <div className="pointer-events-none absolute left-1/2 top-24 z-20 w-full -translate-x-1/2 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.36em] text-primary">
            City grid online
          </p>
          <h1 className="font-heading text-[13vw] font-extrabold uppercase leading-none text-foreground md:text-[7vw]">
            {city.name}
          </h1>
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1800px] gap-4 pt-[18vh] md:grid-cols-[1fr_390px] md:pt-[20vh]">
          <div
            className={`city-map-reveal relative min-h-[70vh] overflow-hidden rounded-[8px] border border-border bg-card shadow-[0_34px_130px_rgba(0,0,0,0.64)] ${
              introComplete ? 'is-ready' : ''
            }`}
          >
            {hasToken ? (
              <div ref={mapContainerRef} className="h-full min-h-[70vh] w-full" />
            ) : (
              <div className="flex h-full min-h-[70vh] items-center justify-center p-8 text-center text-muted-foreground">
                Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local.
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 z-20 border border-primary/40 bg-background/80 px-4 py-3 backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                Retail nodes active
              </p>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[8px] border border-border bg-card p-6 shadow-[0_34px_130px_rgba(0,0,0,0.64)]">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
            <div className="relative flex h-full min-h-[70vh] flex-col justify-between gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                  Retail signal
                </p>
                <h1 className="mt-4 font-heading text-4xl font-extrabold uppercase leading-none text-foreground">
                  {selectedStore.name}
                </h1>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {selectedStore.address}
                </p>
                <div className="mt-5 inline-flex border border-primary/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                  {selectedStore.tier} tier
                </div>
              </div>

              <div className="grid gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
                  Active missions
                </p>
                {selectedStore.missions.map((mission, index) => (
                  <div
                    key={mission}
                    className="flex gap-4 border border-border bg-background/70 p-4"
                  >
                    <span className="font-heading text-lg font-extrabold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-6 text-muted-foreground">
                      {mission}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isSignedIn) setAuthPromptOpen(true)
                }}
                className="border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-transparent hover:text-primary"
              >
                Start mission
              </button>
            </div>
          </aside>
        </div>
      </section>

      {authPromptOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/75 px-4 pb-4 backdrop-blur-xl md:items-center md:pb-0">
          <button
            type="button"
            aria-label="Close authentication prompt"
            className="absolute inset-0 cursor-default"
            onClick={() => setAuthPromptOpen(false)}
          />
          <section className="relative w-full max-w-xl overflow-hidden rounded-[8px] border border-border bg-card p-6 shadow-[0_30px_120px_rgba(0,0,0,0.7)] md:p-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
            <div className="relative flex flex-col gap-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                  Account required
                </p>
                <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase leading-none text-foreground md:text-5xl">
                  Become a resident
                </h2>
              </div>

              <p className="text-base leading-7 text-muted-foreground">
                Create an account or sign in to start missions, save retail
                progress, and unlock Common, Rare, and Legendary rewards.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="border border-border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-transparent hover:text-primary"
                  >
                    Create account
                  </button>
                </SignUpButton>
              </div>
            </div>
          </section>
        </div>
      )}

      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-background transition-opacity duration-700 ${
          introPhase === 'done' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className={`city-map-title-transfer absolute left-1/2 text-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            introPhase === 'center'
              ? 'top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-100'
              : introPhase === 'top'
                ? 'top-24 -translate-x-1/2 translate-y-0 opacity-100'
                : 'top-24 -translate-x-1/2 translate-y-0 opacity-0'
          }`}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.36em] text-primary">
            Loading city grid
          </p>
          <h2 className="font-heading text-[13vw] font-extrabold uppercase leading-none text-foreground md:text-[7vw]">
            {city.name}
          </h2>
        </div>
      </div>
    </main>
  )
}

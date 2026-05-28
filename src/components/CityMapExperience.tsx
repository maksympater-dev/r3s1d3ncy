'use client'

import 'mapbox-gl/dist/mapbox-gl.css'

import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import AuthActions from './AuthActions'
import { DEMO_MISSION_STORE } from './demoMissionStore'
import StoreMissionModal from './StoreMissionModal'

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
  const [selectedStore, setSelectedStore] = useState<StoreNode>(city.stores[0])
  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const [activeMissionStore, setActiveMissionStore] = useState<StoreNode | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [introPhase, setIntroPhase] = useState<'center' | 'top' | 'done'>(
    'center',
  )
  const introComplete = introPhase !== 'center'
  const hasToken = Boolean(mapboxgl.accessToken)
  const hasLiveMap = hasToken && !mapFailed

  const selectStore = useCallback((store: StoreNode) => {
    setSelectedStore(store)
    mapRef.current?.flyTo({
      center: store.coordinates,
      zoom: city.zoom + 1.15,
      pitch: 62,
      bearing: -28,
      duration: 900,
      essential: false,
    })
  }, [city.zoom])

  const localPositionForStore = (store: StoreNode) => {
    const [centerLng, centerLat] = city.center
    const [lng, lat] = store.coordinates
    const lngDelta = (lng - centerLng) * Math.cos((centerLat * Math.PI) / 180)
    const latDelta = lat - centerLat
    const scale = 1900

    return {
      left: `${Math.max(12, Math.min(88, 50 + lngDelta * scale))}%`,
      top: `${Math.max(16, Math.min(84, 50 - latDelta * scale))}%`,
    }
  }

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
      antialias: false,
      fadeDuration: 0,
    })

    mapRef.current = map
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'bottom-right',
    )
    map.on('error', () => setMapFailed(true))

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

    map.flyTo({
      center: city.center,
      zoom: city.zoom,
      pitch: 58,
      bearing: -18,
      duration: 1100,
      essential: false,
    })

  }, [city])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasLiveMap) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    city.stores.forEach((store) => {
      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.className = `map-access-marker ${
        selectedStore.name === store.name ? 'is-selected' : ''
      }`
      markerElement.setAttribute('aria-label', `Open ${store.name}`)

      const markerCore = document.createElement('span')
      markerElement.appendChild(markerCore)
      markerElement.addEventListener('click', (event) => {
        event.stopPropagation()
        selectStore(store)
      })

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(store.coordinates)
        .addTo(map)

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [city.stores, hasLiveMap, selectedStore.name, selectStore])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/92 px-[var(--page-gutter)] py-3 sm:py-4">
        <nav className="flex w-full flex-nowrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 border border-border px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition hover:border-primary hover:text-primary sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
          >
            Back
          </button>
          <div className="hidden text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:block">
            Discount map
          </div>
          <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMissionStore(DEMO_MISSION_STORE)
                setIsMissionOpen(true)
              }}
              className="border border-primary/70 bg-primary/10 px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary transition hover:bg-primary hover:text-primary-foreground min-[380px]:px-3 min-[430px]:text-[11px] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              <span className="hidden min-[380px]:inline">Signal </span>Bypass
            </button>
            <AuthActions />
          </div>
        </nav>
      </header>

      <section className="relative min-h-dvh overflow-x-hidden px-[var(--page-gutter)] pb-6 pt-20">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,transparent_42%,rgba(5,5,5,0.62)_100%)]" />

        <div className="relative z-20 w-full text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary sm:text-xs sm:tracking-[0.36em]">
            City grid online
          </p>
          <h1 className="font-heading text-[clamp(3.2rem,13vw,9rem)] font-extrabold uppercase leading-none text-foreground lg:text-[clamp(5rem,7vw,10rem)]">
            {city.name}
          </h1>
        </div>

        <div className="relative z-20 grid w-full gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]">
          <div
            className={`city-map-reveal relative h-[clamp(22rem,56dvh,42rem)] overflow-hidden rounded-[8px] border border-border bg-card shadow-[0_18px_48px_rgba(0,0,0,0.38)] lg:h-auto lg:min-h-[min(64dvh,680px)] ${
              introComplete ? 'is-ready' : ''
            }`}
          >
            {hasLiveMap ? (
              <div ref={mapContainerRef} className="h-full w-full" />
            ) : (
              <div className="local-discount-map flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                Local discount grid active.
              </div>
            )}
            <div className="pointer-events-none absolute left-5 top-5 z-20 border border-primary/40 bg-background/88 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                Discount nodes active
              </p>
            </div>
            {!hasLiveMap && (
              <div className="absolute inset-0 z-30">
                {city.stores.map((store) => {
                  const selected = selectedStore.name === store.name
                  return (
                    <button
                      key={store.name}
                      type="button"
                      aria-label={`Open ${store.name}`}
                      className={`map-access-marker map-local-store-marker ${
                        selected ? 'is-selected' : ''
                      }`}
                      style={localPositionForStore(store)}
                      onClick={() => selectStore(store)}
                    >
                      <span />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="relative overflow-x-hidden overflow-y-auto rounded-[8px] border border-border bg-card p-5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] sm:p-6 lg:max-h-[min(64dvh,680px)]">
            <div className="absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(circle,rgba(183,255,90,0.10)_0%,transparent_68%)] opacity-80" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
                  Discount signal
                </p>
                <h1 className="mt-4 font-heading text-[clamp(2rem,9vw,3rem)] font-extrabold uppercase leading-none text-foreground lg:text-4xl">
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
                  Discount clues
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
                  setActiveMissionStore(selectedStore)
                  setIsMissionOpen(true)
                }}
                className="border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-transparent hover:text-primary"
              >
                Start hunt
              </button>
            </div>
          </aside>
        </div>
      </section>

      {isMissionOpen && (
        <StoreMissionModal
          isOpen={isMissionOpen}
          onClose={() => setIsMissionOpen(false)}
          store={activeMissionStore}
        />
      )}

      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-background transition-opacity duration-700 ${
          introPhase === 'done' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="absolute left-1/2 top-0 text-center transition-[transform,opacity] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: introPhase === 'done' ? 0 : 1,
            transform:
              introPhase === 'center'
                ? 'translate3d(-50%, 50vh, 0) translateY(-50%)'
                : 'translate3d(-50%, 6rem, 0)',
          }}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.36em] text-primary">
            Loading city grid
          </p>
          <h2 className="font-heading text-[clamp(3.2rem,13vw,9rem)] font-extrabold uppercase leading-none text-foreground lg:text-[clamp(5rem,7vw,10rem)]">
            {city.name}
          </h2>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { StoreNode } from './CityMapExperience'

interface StoreMissionModalProps {
  isOpen: boolean
  onClose: () => void
  store: StoreNode | null
}

type MissionStatus = 'active' | 'success' | 'failed' | 'saving' | 'saved'
type RewardTier = 'Common' | 'Rare' | 'Legendary'

const SIGNAL_BYPASS_PROGRESS_KEY = 'r3-signal-bypass-progress'
const DEFAULT_LEVEL_ID = 'signal-bypass-01'

const normalizeRewardTier = (tier: unknown): RewardTier => {
  if (tier === 'Rare' || tier === 'Legendary') return tier
  return 'Common'
}

const persistDemoProgress = (
  store: StoreNode,
  rewardTier: RewardTier,
  traceDetect: number,
  levelId: string,
  completedLevelIds: string[] = [levelId],
) => {
  try {
    const existing = JSON.parse(
      window.localStorage.getItem(SIGNAL_BYPASS_PROGRESS_KEY) || '{}',
    ) as {
      completedLevels?: string[]
    }
    const completedLevels = Array.isArray(existing.completedLevels)
      ? existing.completedLevels
      : []
    const lastReward = {
      levelId,
      store: store.name,
      tier: rewardTier,
      traceDetect,
      completedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(
      SIGNAL_BYPASS_PROGRESS_KEY,
      JSON.stringify({
        ...existing,
        completedLevels: Array.from(
          new Set([...completedLevels, ...completedLevelIds]),
        ),
        lastReward,
      }),
    )
  } catch {
    // Demo progress is non-critical; the reward UI should still continue.
  }
}

export default function StoreMissionModal({
  isOpen,
  onClose,
  store,
}: StoreMissionModalProps) {
  const [status, setStatus] = useState<MissionStatus>('active')
  const [rewardTier, setRewardTier] = useState<'Common' | 'Rare' | 'Legendary' | null>(null)
  const [traceDetect, setTraceDetect] = useState<number | null>(null)
  const [showConfirmAbort, setShowConfirmAbort] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)

  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      // Accept the public same-origin game and the standalone dev prototype.
      if (
        event.origin !== 'http://localhost:3001' &&
        event.origin !== 'http://127.0.0.1:3001' &&
        event.origin !== window.location.origin
      ) {
        return
      }

      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === 'r3-mission-complete') {
        const nextRewardTier = normalizeRewardTier(data.rewardTier)
        const nextTraceDetect =
          typeof data.traceDetect === 'number' ? data.traceDetect : 0
        const levelId =
          typeof data.levelId === 'string' ? data.levelId : DEFAULT_LEVEL_ID
        const completedLevelIds =
          Array.isArray(data.completedLevelIds) &&
          data.completedLevelIds.every((id: unknown) => typeof id === 'string')
            ? data.completedLevelIds
            : [levelId]

        setRewardTier(nextRewardTier)
        setTraceDetect(nextTraceDetect)
        if (store) {
          persistDemoProgress(
            store,
            nextRewardTier,
            nextTraceDetect,
            levelId,
            completedLevelIds,
          )
        }
        setStatus('success')
      } else if (data.type === 'r3-mission-failed') {
        setStatus('failed')
      }
    }

    window.addEventListener('message', handleGameMessage)
    return () => {
      window.removeEventListener('message', handleGameMessage)
    }
  }, [store])

  // Handle reward saving simulation
  const triggerClaimReward = () => {
    setStatus('saving')
    setSaveProgress(0)

    const interval = setInterval(() => {
      setSaveProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setStatus('saved')
            setTimeout(() => {
              onClose()
            }, 1000)
          }, 600)
          return 100
        }
        return prev + 4
      })
    }, 50)
  }

  if (!isOpen || !store) return null

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'Legendary':
        return {
          glow: 'shadow-[0_0_40px_rgba(245,158,11,0.24)] border-amber-500/60',
          text: 'text-amber-400',
          bg: 'bg-amber-950/20',
          badge: 'border-amber-500 bg-amber-500/10 text-amber-400',
        }
      case 'Rare':
        return {
          glow: 'shadow-[0_0_40px_rgba(56,189,248,0.24)] border-sky-500/60',
          text: 'text-sky-400',
          bg: 'bg-sky-950/20',
          badge: 'border-sky-500 bg-sky-500/10 text-sky-400',
        }
      default:
        return {
          glow: 'shadow-[0_0_40px_rgba(183,255,90,0.24)] border-primary/60',
          text: 'text-primary',
          bg: 'bg-primary/5',
          badge: 'border-primary bg-primary/10 text-primary',
        }
    }
  }

  const activeTheme = getTierColor(rewardTier)
  const missionSrc = `/r3-signal-bypass/?store=${encodeURIComponent(
    store.name,
  )}&tier=${encodeURIComponent(store.tier)}`

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/92 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4 md:items-center md:py-6">
      {/* Background Cyber Grids */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(183,255,90,0.04)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative flex min-h-full w-full max-w-6xl flex-col items-center justify-start pb-3 pt-2 md:h-full md:min-h-0 md:justify-center md:py-0">
        {/* Terminal Header Info */}
        {status === 'active' && (
          <header className="mb-2 flex w-full max-w-5xl items-center justify-between gap-2 px-1 font-mono text-[8px] font-bold uppercase leading-tight tracking-[0.2em] text-muted-foreground sm:px-2 sm:text-[9px] md:mb-3 md:text-[10px] md:tracking-[0.24em]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-primary" />
              <span className="min-w-0 truncate">BYPASS LINK ACTIVE // {store.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmAbort(true)}
              className="shrink-0 border border-border/80 bg-card/40 px-2 py-1.5 text-[8px] transition hover:border-red-500/50 hover:text-red-400 sm:px-3 sm:text-[9px]"
            >
              ABORT BYPASS
            </button>
          </header>
        )}

        {/* 1. Main Active Game View */}
        {status === 'active' && (
          <div className="relative h-[clamp(20rem,calc(100dvh-5.25rem),52rem)] w-full max-w-5xl overflow-hidden rounded-[6px] border border-border bg-black shadow-[0_24px_64px_rgba(0,0,0,0.64)] sm:h-[min(74dvh,44rem)] md:h-[35rem] md:rounded-[8px] lg:h-[40rem]">
            {/* Interactive scanlines and CRT grain */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[size:100%_4px,6px_100%] opacity-42" />

            <iframe
              src={missionSrc}
              title="R3 Signal Bypass Game Frame"
              className="h-full w-full border-none bg-transparent"
              allow="autoplay"
            />
          </div>
        )}

        {/* 2. Success Screen (Decryption Successful) */}
        {(status === 'success' || status === 'saving' || status === 'saved') && (
          <section
            className={`w-full max-w-lg rounded-[12px] border bg-card p-6 text-center font-mono shadow-2xl transition-all duration-300 md:p-8 ${activeTheme.glow}`}
            aria-label="Bypass mission completion statistics and reward details"
          >
            {/* Top Indicator Accent */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
              <svg
                className="h-7 w-7 text-primary animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary md:text-xs">
              {"// BYPASS ESTABLISHED //"}
            </p>
            <h2 className="mt-3 font-heading text-2xl font-extrabold uppercase tracking-wide text-foreground md:text-3xl">
              DECRYPTION SUCCESSFUL
            </h2>

            {/* Reward Card Block */}
            <div className={`mt-6 border p-6 rounded-[8px] ${activeTheme.bg} ${activeTheme.glow} relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-sheen pointer-events-none" />

              <span className={`inline-block border px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.24em] rounded-[4px] ${activeTheme.badge}`}>
                {rewardTier} REWARD
              </span>

              <h3 className="mt-4 text-lg font-bold uppercase text-foreground">
                {store.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground font-sans">
                Access tier verified. Discount code ready for generation.
              </p>

              {/* Firewall Telemetry Info */}
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div>
                  <p>FIREWALL DETECTED</p>
                  <p className="mt-1 text-xs text-foreground font-mono font-extrabold">
                    {traceDetect}% TRACE LEVEL
                  </p>
                </div>
                <div className="text-right">
                  <p>STATUS</p>
                  <p className={`mt-1 text-xs font-mono font-extrabold ${activeTheme.text}`}>
                    COUPON RESERVED
                  </p>
                </div>
              </div>
            </div>

            {/* Active Saving / Writing Progress */}
            {status === 'saving' && (
              <div className="mt-6 text-left">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <span>WRITING DECRYPTION KEYS TO RESIDENT ID</span>
                  <span>{saveProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 border border-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-75 shadow-[0_0_10px_#b7ff5a]"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions button */}
            <div className="mt-8 flex flex-col gap-3">
              {status === 'success' && (
                <button
                  type="button"
                  onClick={triggerClaimReward}
                  className="w-full border border-primary bg-primary py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary-foreground transition hover:bg-transparent hover:text-primary shadow-[0_4px_16px_rgba(183,255,90,0.15)] hover:shadow-none"
                >
                  CLAIM REWARD & SAVE TO RESIDENT ID
                </button>
              )}
              {status === 'saving' && (
                <button
                  type="button"
                  disabled
                  className="w-full border border-border/50 bg-card/50 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground cursor-not-allowed"
                >
                  UPDATING HARDWARE WALLET...
                </button>
              )}
              {status === 'saved' && (
                <button
                  type="button"
                  disabled
                  className="w-full border border-primary/40 bg-primary/10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary cursor-default"
                >
                  ACCESS KEY GRANTED // SECURED
                </button>
              )}
            </div>
          </section>
        )}

        {/* 3. Fail Screen (Connection Blocked) */}
        {status === 'failed' && (
          <section
            className="w-full max-w-md rounded-[12px] border border-red-500/50 bg-card p-6 text-center font-mono shadow-[0_0_40px_rgba(239,68,68,0.18)] md:p-8"
            aria-label="Bypass mission failed notice"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-950/10">
              <svg
                className="h-7 w-7 text-red-500 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-red-400 md:text-xs">
              {"// LINK TERMINATED //"}
            </p>
            <h2 className="mt-3 font-heading text-2xl font-extrabold uppercase tracking-wide text-foreground md:text-3xl">
              CONNECTION BLOCKED
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted-foreground font-sans">
              Firewall trace reached 100%. Secure link has been severed by server security systems.
            </p>

            {/* Failure actions */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className="w-full border border-red-500 bg-red-500/10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-red-400 transition hover:bg-red-500 hover:text-white"
              >
                RE-INITIALIZE ENGINE
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-border bg-card py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                RETURN TO MAP
              </button>
            </div>
          </section>
        )}

        {/* 4. Abort Confirmation Dialog Overlay */}
        {showConfirmAbort && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-sm rounded-[10px] border border-border bg-card p-6 font-mono text-center shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="abort-title"
            >
              <h3 id="abort-title" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                Confirm Abort
              </h3>
              <p className="mt-4 text-xs leading-5 text-muted-foreground font-sans">
                Aborting now will disconnect the bypass link. Any trace bypass progress on this retail node will be lost.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmAbort(false)}
                  className="border border-border py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-foreground hover:text-foreground"
                >
                  RESUME BYPASS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmAbort(false)
                    onClose()
                  }}
                  className="border border-red-500 bg-red-500/10 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  DISCONNECT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

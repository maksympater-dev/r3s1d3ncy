'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function AuthActions() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <div className="h-8 w-14 shrink-0 border border-border bg-card min-[420px]:w-24 sm:h-9 sm:w-28" />
  }

  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1 sm:gap-2">
      {isSignedIn ? (
        <div className="border border-border bg-card px-1.5 py-1.5 sm:px-2 sm:py-2">
          <UserButton />
        </div>
      ) : (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="hidden border border-border px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition hover:border-primary hover:text-primary min-[430px]:inline-flex sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="border border-primary bg-primary px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-transparent hover:text-primary min-[380px]:px-3 min-[430px]:text-[11px] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              <span className="min-[380px]:hidden">Join</span>
              <span className="hidden min-[380px]:inline">Sign up</span>
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  )
}

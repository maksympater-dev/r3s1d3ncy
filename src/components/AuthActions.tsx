'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function AuthActions() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <div className="h-9 w-24 border border-border bg-card sm:w-28" />
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isSignedIn ? (
        <div className="border border-border bg-card px-2 py-2">
          <UserButton />
        </div>
      ) : (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="border border-border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary hover:text-primary sm:px-4 sm:text-xs sm:tracking-[0.16em]"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="border border-primary bg-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-transparent hover:text-primary sm:px-4 sm:text-xs sm:tracking-[0.16em]"
            >
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  )
}

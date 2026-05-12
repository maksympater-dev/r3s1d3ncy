'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function AuthActions() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <div className="h-9 w-28 border border-border bg-card" />
  }

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <div className="border border-border bg-card px-2 py-2">
          <UserButton />
        </div>
      ) : (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-transparent hover:text-primary"
            >
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  )
}

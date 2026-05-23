'use client'

import { useState } from 'react'
import CitySelectorExperience from '@/components/CitySelectorExperience'
import GpuAsciiBackdrop from '@/components/GpuAsciiBackdrop'
import LoadingScreen from '@/components/LoadingScreen'

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded ? (
        <LoadingScreen onComplete={() => setLoaded(true)} />
      ) : (
        <>
          <GpuAsciiBackdrop />
          <CitySelectorExperience />
        </>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import BrandResidencyExperience from '@/components/BrandResidencyExperience'
import LoadingScreen from '@/components/LoadingScreen'

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <BrandResidencyExperience />
    </>
  )
}

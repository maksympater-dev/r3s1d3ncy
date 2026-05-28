'use client'

import { useState } from 'react'
import CitySelectorExperience from '@/components/CitySelectorExperience'
import LoadingScreen from '@/components/LoadingScreen'

type HomeExperienceProps = {
  initialLoaded?: boolean
}

export default function HomeExperience({
  initialLoaded = false,
}: HomeExperienceProps) {
  const [loaded, setLoaded] = useState(initialLoaded)

  return (
    <>
      {!loaded ? (
        <LoadingScreen onComplete={() => setLoaded(true)} />
      ) : (
        <CitySelectorExperience />
      )}
    </>
  )
}

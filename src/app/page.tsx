import HomeExperience from '@/components/HomeExperience'

type HomeProps = {
  searchParams?: Promise<{
    skipIntro?: string | string[]
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const skipIntro = Array.isArray(params?.skipIntro)
    ? params.skipIntro[0]
    : params?.skipIntro

  return <HomeExperience initialLoaded={skipIntro === '1'} />
}

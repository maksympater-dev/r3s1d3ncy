'use client'

type CityLogotypeMarkProps = {
  cityName: string
  className?: string
}

type SkylineShape = {
  upper: string
  lower: string
  cutouts: string[]
  accents: string[]
}

const SKYLINES: Record<string, SkylineShape> = {
  London: {
    upper:
      'M44 106h92V78l44-34 44 34v28h76V72h32V40h20v32h32v34h74V54h34v52h80V72h76v34h108v34H44Z',
    lower:
      'M36 176h84v-42h50v42h72v-58h70v58h92v-36h44v36h66v-82h20V60h36v34h20v82h76v-50h62v50h90v-64h54v64h92v32H36Z',
    cutouts: ['M166 82h34v24h-34Z', 'M526 112h42v64h-42Z', 'M706 142h54v34h-54Z'],
    accents: ['M330 102h122v10H330Z', 'M126 154h112v9H126Z', 'M638 156h142v9H638Z'],
  },
  Birmingham: {
    upper:
      'M42 116h118c18-42 58-68 112-68s94 26 112 68h98V88h72v28h106c18-34 54-54 104-54s86 20 104 54h58v30H42Z',
    lower:
      'M34 178h96v-50h62v50h70v-78h106v78h94v-44h54v44h92v-70h86v70h86v-42h54v42h70v30H34Z',
    cutouts: [
      'M204 104c12-22 36-36 68-36s56 14 68 36H204Z',
      'M696 112c10-18 32-30 66-30s56 12 66 30H696Z',
      'M322 128h40v50h-40Z',
    ],
    accents: ['M118 150h132v10H118Z', 'M554 148h168v10H554Z'],
  },
  Manchester: {
    upper:
      'M42 110h84V76h48v34h52V48h58v62h62V70h50v40h94V60h56v50h80V44h62v66h98V76h50v34h64v30H42Z',
    lower:
      'M38 178h92v-64h56v64h66V86h70v92h82v-52h52v52h72v-82h74v82h88v-48h50v48h86v-68h56v68h52v30H38Z',
    cutouts: ['M102 96h230v12H102Z', 'M458 96h246v12H458Z', 'M600 126h42v52h-42Z'],
    accents: ['M84 144h158v10H84Z', 'M514 144h214v10H514Z'],
  },
  Newcastle: {
    upper:
      'M42 114h126c28-48 66-72 116-72s88 24 116 72h118V88h56V54h28v34h56v26h92c20-28 52-44 96-44s76 16 96 44h34v32H42Z',
    lower:
      'M34 178h112c24-42 62-64 114-64s90 22 114 64h82v-48h52v48h108v-92h22V50h36v36h22v92h104v-44h58v44h60v30H34Z',
    cutouts: [
      'M198 148c22-20 44-30 68-30s46 10 68 30H198Z',
      'M552 90h72v88h-72Z',
      'M652 116h42v62h-42Z',
    ],
    accents: ['M116 158h238v10H116Z', 'M526 132h126v9H526Z', 'M720 154h112v9H720Z'],
  },
  Glasgow: {
    upper:
      'M42 114h108c34-48 78-72 132-72s98 24 132 72h116c30-38 70-58 120-58s90 20 120 58h104v32H42Z',
    lower:
      'M34 178h124l42-46h158l42 46h104v-46h62v46h96l44-56h140l44 56h64v30H34Z',
    cutouts: ['M202 150h154l-22 28H224Z', 'M706 146h126l-22 32h-82Z'],
    accents: ['M132 126c42-32 88-48 140-48s98 16 140 48', 'M528 126c34-24 74-36 120-36s86 12 120 36'],
  },
}

function NewcastleSilhouette() {
  return (
    <span
      className="block h-full w-full bg-primary opacity-95 [filter:drop-shadow(0_0_12px_color-mix(in_srgb,var(--accent-access)_42%,transparent))] [mask-image:url('/newcastle-skyline-cropped.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      aria-hidden="true"
    />
  )
}

function FilledSilhouette({ cityName }: { cityName: string }) {
  if (cityName === 'Newcastle') {
    return <NewcastleSilhouette />
  }

  const skyline = SKYLINES[cityName] ?? SKYLINES.London

  return (
    <svg
      viewBox="0 0 960 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="h-full w-full"
    >
      <path d={skyline.upper} fill="currentColor" opacity="0.82" />
      <path d={skyline.lower} fill="currentColor" opacity="0.96" />
      {skyline.cutouts.map((cutout) => (
        <path key={cutout} d={cutout} fill="var(--background)" opacity="0.64" />
      ))}
      {skyline.accents.map((accent) => (
        <path
          key={accent}
          d={accent}
          fill="none"
          stroke="var(--background)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.42"
          strokeWidth="9"
        />
      ))}
      <path d="M34 208h892v18H34Z" fill="currentColor" opacity="0.96" />
    </svg>
  )
}

export default function CityLogotypeMark({
  cityName,
  className = '',
}: CityLogotypeMarkProps) {
  return (
    <span
      className={`pointer-events-none absolute text-primary transition-all duration-500 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute -inset-x-[8%] top-1/2 h-[112%] -translate-y-1/2 bg-primary/8" />
      <span className="absolute -inset-x-[10%] top-0 h-[34%]">
        <FilledSilhouette cityName={cityName} />
      </span>
      <span className="absolute -inset-x-[10%] bottom-0 h-[34%] origin-center scale-y-[-1] opacity-35">
        <FilledSilhouette cityName={cityName} />
      </span>
    </span>
  )
}

import {
  LEVELS,
  advanceToNextLevel,
  createGameState,
  edgeKey,
  getCurrentLevel,
  getSelectedModule,
  hasNextLevel,
  levelEdges,
  markCurrentLevelComplete,
  nodeMapForState,
  rotateModule,
  selectModule,
  selectModuleInDirection,
  solveAllModules,
  solvePower,
  updateTrace,
} from './game-state.mjs'

const canvas = document.getElementById('gameCanvas')
const boot = document.getElementById('boot')
const ctx = canvas.getContext('2d')

let state = createGameState(window.location.search)
let power = solvePower(state)
let pixelRatio = 1
let frame = 0
let lastComplete = false
let levelAdvanceActive = false
let levelAdvanceStart = 0
let levelAdvanceMessage = ''
let completionButtonRect = null
const LEVEL_ADVANCE_DELAY = 1200
const SIGNAL_BYPASS_PROGRESS_KEY = 'r3-signal-bypass-progress'

const floorLogo = {
  source: './assets/R3.png',
  image: new Image(),
  cutout: null,
  tint: null,
  loaded: false,
  cutoutReady: false,
  failed: false,
  aspect: 1,
}

floorLogo.image.addEventListener('load', () => {
  const assets = createFloorLogoAssets(floorLogo.image)
  floorLogo.cutout = assets?.cutout || null
  floorLogo.tint = assets?.tint || null
  floorLogo.aspect = assets?.aspect || 1
  floorLogo.cutoutReady = Boolean(floorLogo.cutout && floorLogo.tint)
  floorLogo.loaded = floorLogo.cutoutReady
})

floorLogo.image.addEventListener('error', () => {
  floorLogo.failed = true
})

floorLogo.image.src = floorLogo.source

const SUCCESS_ANIMATION_DURATION = 1800
let successAnimationStarted = false
let successAnimationStart = 0

const inputActionByKey = new Map([
  ['w', 'up'],
  ['arrowup', 'up'],
  ['a', 'left'],
  ['arrowleft', 'left'],
  ['s', 'down'],
  ['arrowdown', 'down'],
  ['d', 'right'],
  ['arrowright', 'right'],
])

function activeLevel() {
  return getCurrentLevel(state)
}

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(window.innerWidth * pixelRatio)
  canvas.height = Math.floor(window.innerHeight * pixelRatio)
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function isCompactViewport() {
  return window.innerWidth < 520 || window.innerHeight < 430
}

function uiScale() {
  return clamp(Math.min(window.innerWidth / 760, window.innerHeight / 520), 0.54, 1)
}

function displayRect() {
  const width = window.innerWidth
  const height = window.innerHeight
  const compact = isCompactViewport()
  const marginX = compact
    ? Math.max(10, Math.min(width * 0.045, 20))
    : Math.max(28, Math.min(width * 0.09, 170))
  const marginY = compact
    ? Math.max(12, Math.min(height * 0.045, 28))
    : Math.max(28, Math.min(height * 0.08, 86))
  return {
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * (compact ? 1.72 : 2.15),
  }
}

function gridPoint(node) {
  const rect = displayRect()
  const compact = isCompactViewport()
  const insetX = rect.width * (compact ? 0.08 : 0.11)
  const insetY = rect.height * (compact ? 0.2 : 0.14)
  const columns = 9
  const rows = 6
  return {
    x: rect.x + insetX + (node.x / columns) * (rect.width - insetX * 2),
    y: rect.y + insetY + (node.y / rows) * (rect.height - insetY * 2),
  }
}

function clearScreen() {
  const width = window.innerWidth
  const height = window.innerHeight
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#020605'
  ctx.fillRect(0, 0, width, height)

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.42, 10, width * 0.5, height * 0.42, width * 0.68)
  glow.addColorStop(0, 'rgba(27, 255, 144, 0.15)')
  glow.addColorStop(0.55, 'rgba(9, 79, 48, 0.1)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
}

function createCanvasSurface(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  return surface
}

function createFloorLogoAssets(image) {
  const sampleSize = 720
  const source = createCanvasSurface(sampleSize, sampleSize)
  const sourceCtx = source.getContext('2d', { willReadFrequently: true })
  if (!sourceCtx) return null

  sourceCtx.fillStyle = '#ffffff'
  sourceCtx.fillRect(0, 0, sampleSize, sampleSize)
  sourceCtx.drawImage(image, 0, 0, sampleSize, sampleSize)

  const sourceData = sourceCtx.getImageData(0, 0, sampleSize, sampleSize)
  const { data } = sourceData
  const bounds = {
    minX: sampleSize,
    minY: sampleSize,
    maxX: 0,
    maxY: 0,
  }

  for (let y = 0; y < sampleSize; y += 1) {
    for (let x = 0; x < sampleSize; x += 1) {
      const i = (y * sampleSize + x) * 4
      const average = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (average > 238) continue
      bounds.minX = Math.min(bounds.minX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.maxY = Math.max(bounds.maxY, y)
    }
  }

  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) return null

  const cropPadding = 10
  bounds.minX = Math.max(0, bounds.minX - cropPadding)
  bounds.minY = Math.max(0, bounds.minY - cropPadding)
  bounds.maxX = Math.min(sampleSize, bounds.maxX + cropPadding)
  bounds.maxY = Math.min(sampleSize, bounds.maxY + cropPadding)

  const cropWidth = bounds.maxX - bounds.minX
  const cropHeight = bounds.maxY - bounds.minY
  const outputHeight = 260
  const outputWidth = Math.max(1, Math.round(outputHeight * (cropWidth / cropHeight)))
  const cutout = createCanvasSurface(outputWidth, outputHeight)
  const tint = createCanvasSurface(outputWidth, outputHeight)
  const cutoutCtx = cutout.getContext('2d', { willReadFrequently: true })
  const tintCtx = tint.getContext('2d', { willReadFrequently: true })
  if (!cutoutCtx || !tintCtx) return null

  cutoutCtx.drawImage(source, bounds.minX, bounds.minY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)
  const cutoutData = cutoutCtx.getImageData(0, 0, outputWidth, outputHeight)
  const cutoutPixels = cutoutData.data
  const tintData = tintCtx.createImageData(outputWidth, outputHeight)
  const tintPixels = tintData.data

  for (let i = 0; i < cutoutPixels.length; i += 4) {
    const average = (cutoutPixels[i] + cutoutPixels[i + 1] + cutoutPixels[i + 2]) / 3
    const alphaFromWhite = Math.max(0, Math.min(1, (252 - average) / 42))
    const alpha = Math.pow(alphaFromWhite, 0.82) * (cutoutPixels[i + 3] / 255)

    if (alpha < 0.035) {
      cutoutPixels[i + 3] = 0
      tintPixels[i + 3] = 0
      continue
    }

    cutoutPixels[i + 3] = Math.round(alpha * 255)
    tintPixels[i] = 32
    tintPixels[i + 1] = 255
    tintPixels[i + 2] = 147
    tintPixels[i + 3] = Math.round(alpha * 225)
  }

  cutoutCtx.putImageData(cutoutData, 0, 0)
  tintCtx.putImageData(tintData, 0, 0)
  return {
    cutout,
    tint,
    aspect: outputWidth / outputHeight,
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function easeOutCubic(value) {
  const t = clamp(value)
  return 1 - Math.pow(1 - t, 3)
}

function successFx(now) {
  if (!successAnimationStarted) {
    return {
      active: false,
      elapsed: 0,
      progress: 0,
      reveal: power.complete ? 1 : 0,
      lineBoost: 0,
      floorAlpha: 1,
      logoAlpha: power.complete ? 0.08 + Math.sin(frame * 0.028) * 0.015 : 0,
    }
  }

  const elapsed = Math.max(0, now - successAnimationStart)
  const progress = clamp(elapsed / SUCCESS_ANIMATION_DURATION)
  const reveal = easeOutCubic(elapsed / 920)
  const active = elapsed < SUCCESS_ANIMATION_DURATION
  const earlyPulse = Math.max(0, 1 - elapsed / 520)
  return {
    active,
    elapsed,
    progress,
    reveal,
    lineBoost: earlyPulse * (0.72 + Math.sin(elapsed * 0.055) * 0.28),
    floorAlpha: active ? 0.58 + progress * 0.38 : 1,
    logoAlpha: active
      ? 0.06 + reveal * 0.21 + Math.max(0, Math.sin(progress * Math.PI * 3)) * 0.055
      : 0.085 + Math.sin(frame * 0.028) * 0.016,
  }
}

function startSuccessAnimation(now) {
  if (successAnimationStarted) return
  successAnimationStarted = true
  successAnimationStart = now
}

function resetSuccessAnimation() {
  successAnimationStarted = false
  successAnimationStart = 0
}

function completionReady() {
  return state.status === 'active' && power.complete && !levelAdvanceActive && !lastComplete
}

function startLevelAdvance(now) {
  if (levelAdvanceActive) return
  const currentLevel = activeLevel()
  const nextLevel = LEVELS[state.levelIndex + 1]
  state = markCurrentLevelComplete(state)
  levelAdvanceActive = true
  levelAdvanceStart = now
  levelAdvanceMessage = `${currentLevel.label} ROUTE STABILIZED. LOADING ${nextLevel?.label || 'NEXT LEVEL'}`
  startSuccessAnimation(now)
}

function maybeAdvanceLevel(now) {
  if (!levelAdvanceActive || now - levelAdvanceStart < LEVEL_ADVANCE_DELAY) return
  state = advanceToNextLevel(state, Date.now())
  power = solvePower(state)
  lastComplete = false
  levelAdvanceActive = false
  levelAdvanceStart = 0
  levelAdvanceMessage = ''
  resetSuccessAnimation()
}

function confirmCompletion(now = performance.now()) {
  power = solvePower(state)
  if (!completionReady()) return false

  if (hasNextLevel(state)) {
    startLevelAdvance(now)
    lastComplete = true
    return true
  }

  state = markCurrentLevelComplete(state)
  startSuccessAnimation(now)
  const level = activeLevel()
  const completionMessage = {
    type: 'r3-mission-complete',
    rewardTier: state.tier || 'Common',
    traceDetect: state.traceDetect,
    levelId: level.id,
    completedLevelIds: state.completedLevelIds,
  }
  persistCompletion(completionMessage)
  window.parent?.postMessage(completionMessage, '*')
  lastComplete = true
  return true
}

function drawFloorLogoPattern(fx) {
  if (!floorLogo.tint) return

  const rect = displayRect()
  const compact = isCompactViewport()
  const clipInset = compact ? 16 : 34
  const rows = 4
  const gapX = Math.max(160, rect.width * 0.18)
  const gapY = Math.max(112, rect.height * 0.19)
  const startX = rect.x + rect.width * 0.14
  const startY = rect.y + rect.height * 0.24
  const solvedLift = power.complete ? 0.012 : 0
  const rasterFlicker = Math.sin(frame * 0.025) * 0.004
  const baseAlpha = (0.044 + solvedLift + rasterFlicker) * fx.floorAlpha

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x + clipInset, rect.y + clipInset, rect.width - clipInset * 2, rect.height - clipInset * 2)
  ctx.clip()
  ctx.globalCompositeOperation = 'lighter'

  for (let row = 0; row < rows; row += 1) {
    const depth = row / Math.max(1, rows - 1)
    const y = startY + row * gapY
    const logoHeight = Math.max(68, Math.min(122, rect.height * (0.11 + depth * 0.028)))
    const logoWidth = logoHeight * floorLogo.aspect
    const rowOffset = row % 2 === 0 ? 0 : gapX * 0.5

    for (let column = -1; column < 7; column += 1) {
      const x = startX + column * gapX + rowOffset
      if (x < rect.x + clipInset || x > rect.x + rect.width - clipInset) continue

      const checkerFade = (column + row) % 2 === 0 ? 1 : 0.68
      const localAlpha = baseAlpha * checkerFade * (0.72 + depth * 0.34)
      const drawX = x - logoWidth / 2
      const drawY = y - logoHeight / 2

      ctx.save()
      ctx.globalAlpha = localAlpha * 0.48
      ctx.filter = 'blur(5px)'
      ctx.drawImage(floorLogo.tint, drawX, drawY, logoWidth, logoHeight)
      ctx.restore()

      ctx.globalAlpha = localAlpha
      ctx.filter = 'none'
      ctx.drawImage(floorLogo.tint, drawX, drawY, logoWidth, logoHeight)
    }
  }

  ctx.restore()
}

function drawWakePulseLogo(fx) {
  if (!power.complete || !floorLogo.tint) return

  const rect = displayRect()
  const clipInset = isCompactViewport() ? 16 : 34
  const centerX = rect.x + rect.width * 0.5
  const centerY = rect.y + rect.height * 0.52
  const logoHeight = Math.min(rect.height * 0.34, rect.width * 0.22)
  const logoWidth = logoHeight * floorLogo.aspect
  const revealScale = 0.84 + fx.reveal * 0.16
  const drawWidth = logoWidth * revealScale
  const drawHeight = logoHeight * revealScale
  const drawX = centerX - drawWidth / 2
  const drawY = centerY - drawHeight / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x + clipInset, rect.y + clipInset, rect.width - clipInset * 2, rect.height - clipInset * 2)
  ctx.clip()
  ctx.globalCompositeOperation = 'lighter'

  if (fx.active) {
    ;[0, 360].forEach((delay) => {
      const ringProgress = clamp((fx.elapsed - delay) / 980)
      if (ringProgress <= 0 || ringProgress >= 1) return
      const radius = 46 + ringProgress * rect.height * 0.28
      ctx.save()
      ctx.globalAlpha = (1 - ringProgress) * 0.36
      ctx.strokeStyle = '#32ff9b'
      ctx.lineWidth = 2 + (1 - ringProgress) * 5
      ctx.shadowColor = 'rgba(32,255,147,0.85)'
      ctx.shadowBlur = 26
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })
  }

  ctx.save()
  ctx.globalAlpha = fx.logoAlpha * 0.55
  ctx.filter = 'blur(18px)'
  ctx.shadowColor = 'rgba(32,255,147,0.9)'
  ctx.shadowBlur = 34
  ctx.drawImage(floorLogo.tint, drawX, drawY, drawWidth, drawHeight)
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = fx.logoAlpha
  ctx.filter = 'none'
  ctx.shadowColor = 'rgba(32,255,147,0.45)'
  ctx.shadowBlur = 16
  ctx.drawImage(floorLogo.tint, drawX, drawY, drawWidth, drawHeight)
  ctx.restore()

  ctx.restore()
}

function drawScreenFrame() {
  const rect = displayRect()
  const compact = isCompactViewport()
  const innerInset = compact ? 10 : 18
  const gridInsetX = compact ? 16 : 38
  const gridInsetY = compact ? 22 : 44
  ctx.save()
  ctx.strokeStyle = 'rgba(32, 255, 147, 0.42)'
  ctx.lineWidth = compact ? 1.5 : 2
  ctx.shadowColor = 'rgba(32, 255, 147, 0.32)'
  ctx.shadowBlur = compact ? 10 : 18
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(32, 255, 147, 0.16)'
  ctx.lineWidth = compact ? 4 : 8
  ctx.strokeRect(rect.x + innerInset, rect.y + innerInset, rect.width - innerInset * 2, rect.height - innerInset * 2)

  ctx.strokeStyle = 'rgba(32, 255, 147, 0.13)'
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i += 1) {
    const y = rect.y + gridInsetY + i * ((rect.height - gridInsetY * 2) / 11)
    ctx.beginPath()
    ctx.moveTo(rect.x + gridInsetX, y)
    ctx.lineTo(rect.x + rect.width - gridInsetX, y)
    ctx.stroke()
  }
  for (let i = 0; i < 18; i += 1) {
    const x = rect.x + gridInsetX + i * ((rect.width - gridInsetX * 2) / 17)
    ctx.beginPath()
    ctx.moveTo(x, rect.y + gridInsetY)
    ctx.lineTo(x, rect.y + rect.height - gridInsetY)
    ctx.stroke()
  }
  ctx.restore()
}

function drawHeader() {
  const rect = displayRect()
  const level = activeLevel()
  const compact = isCompactViewport()
  const scale = uiScale()
  const tier = state.tier.toUpperCase()
  const left = rect.x + rect.width * (compact ? 0.07 : 0.12)
  const top = rect.y + rect.height * (compact ? 0.085 : 0.1)
  const statusY = rect.y + rect.height * (compact ? 0.895 : 0.91)
  const metaY = rect.y + rect.height * (compact ? 0.952 : 0.965)

  drawLabel(left, top, 'POWER', true, compact ? 17 : 22)
  drawFittedText(
    rect.x + rect.width * (compact ? 0.72 : 0.77),
    rect.y + rect.height * (compact ? 0.102 : 0.115),
    `${power.poweredTargets} / ${level.targets.length}`,
    rect.width * 0.2,
    compact ? 18 : 24,
    true,
  )
  drawFittedText(
    left,
    statusY,
    compact ? compactStatusText() : statusText(),
    rect.width * (compact ? 0.86 : 0.72),
    compact ? 12 : 22,
    power.complete,
    compact ? 9 : 14,
  )
  drawFittedText(
    left,
    metaY,
    compact
      ? `LVL:${state.levelIndex + 1}  STORE:${shortStoreName()}  TIER:${tier}  TRACE:${state.traceDetect}%`
      : `${level.label}  STORE:${state.store.toUpperCase()}  TIER:${tier}  TRACE:${state.traceDetect}%`,
    rect.width * (compact ? 0.86 : 0.76),
    compact ? Math.round(11 * scale) : 13,
    false,
    8,
  )
}

function statusText() {
  if (levelAdvanceActive) return levelAdvanceMessage
  if (state.status === 'failed') return 'CONNECTION BLOCKED. TRACE COMPLETE.'
  if (completionReady()) return 'POWER RESTORED. CONFIRM ROUTE TO PROCEED.'
  if (power.complete) return 'POWER RESTORED. ACCESS GRANTED.'
  return 'INSUFFICIENT POWER. CALIBRATION REQUIRED.'
}

function compactStatusText() {
  if (levelAdvanceActive) return 'ROUTE STABLE. LOADING NEXT.'
  if (state.status === 'failed') return 'CONNECTION BLOCKED.'
  if (completionReady()) return 'POWER READY. PRESS CONFIRM.'
  if (power.complete) return 'POWER RESTORED.'
  return 'LOW POWER. CALIBRATE ROUTE.'
}

function shortStoreName() {
  return state.store
    .toUpperCase()
    .replace('R3 RESIDENCY', 'R3')
    .replace('SELFRIDGES ', 'SFR ')
    .replace('FLANNELS ', 'FLN ')
    .slice(0, 14)
}

function drawLabel(x, y, text, bright = false, size = 22) {
  const labelHeight = size * 1.9
  const metricsWidth = Math.max(size * 5.3, text.length * size * 0.92)
  ctx.save()
  ctx.strokeStyle = bright ? '#20ff93' : 'rgba(32,255,147,0.48)'
  ctx.fillStyle = 'rgba(0, 30, 18, 0.55)'
  ctx.lineWidth = Math.max(1.5, size * 0.13)
  ctx.shadowColor = 'rgba(32,255,147,0.45)'
  ctx.shadowBlur = bright ? 14 : 5
  ctx.fillRect(x, y - labelHeight * 0.76, metricsWidth, labelHeight)
  ctx.strokeRect(x, y - labelHeight * 0.76, metricsWidth, labelHeight)
  drawText(x + size * 0.72, y - size * 0.22, text, size, bright)
  ctx.restore()
}

function drawText(x, y, text, size = 16, bright = false) {
  ctx.save()
  ctx.font = `700 ${size}px "Courier New", monospace`
  ctx.fillStyle = bright ? '#7cffbd' : 'rgba(91, 255, 169, 0.74)'
  ctx.shadowColor = 'rgba(32,255,147,0.5)'
  ctx.shadowBlur = bright ? 14 : 6
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawFittedText(x, y, text, maxWidth, size = 16, bright = false, minSize = 8) {
  let fittedSize = size
  ctx.save()
  ctx.font = `700 ${fittedSize}px "Courier New", monospace`
  while (fittedSize > minSize && ctx.measureText(text).width > maxWidth) {
    fittedSize -= 1
    ctx.font = `700 ${fittedSize}px "Courier New", monospace`
  }
  ctx.restore()
  drawText(x, y, text, fittedSize, bright)
}

function drawEdges(nodes, fx) {
  const level = activeLevel()
  levelEdges(level).forEach(([fromId, toId]) => {
    const from = nodes.get(fromId)
    const to = nodes.get(toId)
    const fromPoint = gridPoint(from)
    const toPoint = gridPoint(to)
    const powered = power.poweredEdges.has(edgeKey(fromId, toId))
    drawConnector(fromPoint, toPoint, powered, fx)
  })

  drawDecorativeCircuit(nodes, level)
}

function drawConnector(from, to, powered, fx) {
  const boost = powered ? fx.lineBoost : 0
  const compact = isCompactViewport()
  ctx.save()
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.strokeStyle = powered ? '#32ff9b' : 'rgba(32, 255, 147, 0.22)'
  ctx.lineWidth = powered
    ? (compact ? 3 : 4) + boost * (compact ? 1.4 : 2.5)
    : compact ? 1.5 : 2
  ctx.shadowColor = 'rgba(32, 255, 147, 0.55)'
  ctx.shadowBlur = powered ? (compact ? 11 : 18) + boost * (compact ? 14 : 26) : 2
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  if (powered) {
    ctx.strokeStyle = 'rgba(180, 255, 218, 0.9)'
    ctx.lineWidth = 1 + boost
    ctx.shadowBlur = 8 + boost * 18
    ctx.stroke()
  }
  ctx.restore()
}

function drawDecorativeCircuit(nodes, level) {
  const rect = displayRect()
  const compact = isCompactViewport()
  const box = {
    x: rect.x + rect.width * 0.2,
    y: rect.y + rect.height * 0.18,
    width: rect.width * 0.58,
    height: rect.height * 0.62,
  }
  const sourcePoints = level.sources.map((source) => gridPoint(nodes.get(source.id)))
  const targetPoints = level.targets.map((target) => gridPoint(nodes.get(target.id)))

  ctx.save()
  ctx.setLineDash([4, 8])
  ctx.strokeStyle = 'rgba(32, 255, 147, 0.22)'
  ctx.lineWidth = compact ? 1 : 2
  ctx.strokeRect(box.x, box.y, box.width, box.height)
  ctx.beginPath()
  sourcePoints.forEach((point, index) => {
    const railY = clamp(point.y, box.y, box.y + box.height)
    const routeY = index % 2 === 0 ? box.y : box.y + box.height
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(box.x, railY)
    ctx.lineTo(box.x, routeY)
  })
  targetPoints.forEach((point, index) => {
    const railY = clamp(point.y, box.y, box.y + box.height)
    const routeY = index === 0 ? box.y : index === targetPoints.length - 1 ? box.y + box.height : railY
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(box.x + box.width, railY)
    ctx.lineTo(box.x + box.width, routeY)
  })
  if (sourcePoints.length && targetPoints.length) {
    ctx.moveTo(box.x, box.y)
    ctx.lineTo(box.x + box.width, box.y)
    ctx.moveTo(box.x, box.y + box.height)
    ctx.lineTo(box.x + box.width, box.y + box.height)
  }
  ctx.stroke()
  ctx.restore()
}

function drawNodes(nodes) {
  const level = activeLevel()
  level.sources.forEach((node) => drawPowerCircle(nodes.get(node.id), power.poweredNodes.has(node.id), 'source'))
  level.targets.forEach((node) => drawPowerCircle(nodes.get(node.id), power.poweredNodes.has(node.id), 'target'))
  state.modules.forEach((module) => {
    const selected = getSelectedModule(state)?.id === module.id
    const powered = power.poweredNodes.has(module.id)
    drawModule(nodes.get(module.id), selected, powered)
  })
}

function drawPowerCircle(node, powered, type) {
  const point = gridPoint(node)
  const compact = isCompactViewport()
  const radius = (type === 'source' ? 19 : 17) * (compact ? 0.82 : 1)
  ctx.save()
  ctx.strokeStyle = powered ? '#32ff9b' : 'rgba(32, 255, 147, 0.36)'
  ctx.fillStyle = powered ? 'rgba(32,255,147,0.18)' : 'rgba(0, 14, 9, 0.62)'
  ctx.lineWidth = compact ? 2 : 3
  ctx.shadowColor = 'rgba(32,255,147,0.62)'
  ctx.shadowBlur = powered ? (compact ? 14 : 22) : compact ? 5 : 8
  ctx.beginPath()
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(point.x - 5, point.y)
  ctx.lineTo(point.x + 1, point.y - 11)
  ctx.lineTo(point.x, point.y - 2)
  ctx.lineTo(point.x + 7, point.y - 2)
  ctx.lineTo(point.x - 1, point.y + 12)
  ctx.lineTo(point.x + 1, point.y + 2)
  ctx.lineTo(point.x - 6, point.y + 2)
  ctx.stroke()

  drawText(point.x - radius * 1.25, point.y + radius + (compact ? 13 : 20), node.label, compact ? 8 : 11, powered)
  ctx.restore()
}

function drawModule(module, selected, powered) {
  const point = gridPoint(module)
  const compact = isCompactViewport()
  const size = compact
    ? Math.max(20, Math.min(30, window.innerWidth * 0.078))
    : Math.max(30, Math.min(window.innerWidth, window.innerHeight) * 0.047)
  const half = size / 2
  ctx.save()
  ctx.translate(point.x, point.y)

  ctx.fillStyle = powered ? 'rgba(32, 255, 147, 0.16)' : 'rgba(0, 19, 12, 0.76)'
  ctx.strokeStyle = powered ? '#45ffab' : 'rgba(32, 255, 147, 0.42)'
  ctx.lineWidth = selected ? (compact ? 2.5 : 4) : compact ? 1.5 : 2
  ctx.shadowColor = 'rgba(32,255,147,0.58)'
  ctx.shadowBlur = selected ? (compact ? 14 : 22) : powered ? (compact ? 10 : 16) : 5
  ctx.fillRect(-half, -half, size, size)
  ctx.strokeRect(-half, -half, size, size)

  if (selected) {
    ctx.strokeStyle = '#b8ffe0'
    ctx.lineWidth = 1
    const selectionInset = compact ? 4 : 7
    ctx.strokeRect(-half - selectionInset, -half - selectionInset, size + selectionInset * 2, size + selectionInset * 2)
  }

  ctx.strokeStyle = powered ? '#d1ffe8' : 'rgba(116, 255, 188, 0.78)'
  ctx.lineWidth = Math.max(compact ? 2.5 : 4, size * 0.12)
  ctx.lineCap = 'square'
  const portLength = size * 0.34
  module.open.forEach((side) => {
    const rotatedSide = side
    ctx.beginPath()
    ctx.moveTo(0, 0)
    if (rotatedSide === 'N') ctx.lineTo(0, -portLength)
    if (rotatedSide === 'E') ctx.lineTo(portLength, 0)
    if (rotatedSide === 'S') ctx.lineTo(0, portLength)
    if (rotatedSide === 'W') ctx.lineTo(-portLength, 0)
    ctx.stroke()
  })

  ctx.fillStyle = 'rgba(201,255,225,0.55)'
  ctx.font = `700 ${Math.max(compact ? 7 : 10, size * 0.22)}px "Courier New", monospace`
  ctx.fillText(module.label, -half - (compact ? 8 : 13), -half - (compact ? 4 : 6))
  ctx.restore()
}

function drawLevelAdvanceOverlay(now) {
  if (!levelAdvanceActive) return

  const rect = displayRect()
  const compact = isCompactViewport()
  const elapsed = Math.max(0, now - levelAdvanceStart)
  const progress = clamp(elapsed / LEVEL_ADVANCE_DELAY)
  const alpha = Math.sin(progress * Math.PI) * 0.82 + 0.1
  const panelWidth = rect.width * (compact ? 0.82 : 0.58)
  const panelHeight = compact ? 74 : 96
  const x = rect.x + (rect.width - panelWidth) / 2
  const y = rect.y + rect.height * (compact ? 0.42 : 0.44) - panelHeight / 2

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = `rgba(0, 28, 16, ${0.62 + alpha * 0.18})`
  ctx.strokeStyle = `rgba(82, 255, 174, ${0.45 + alpha * 0.45})`
  ctx.lineWidth = compact ? 1.5 : 2
  ctx.shadowColor = 'rgba(32,255,147,0.85)'
  ctx.shadowBlur = compact ? 14 : 24
  ctx.fillRect(x, y, panelWidth, panelHeight)
  ctx.strokeRect(x, y, panelWidth, panelHeight)

  drawFittedText(
    x + panelWidth * 0.08,
    y + panelHeight * 0.46,
    compact ? 'ROUTE STABILIZED' : levelAdvanceMessage,
    panelWidth * 0.84,
    compact ? 12 : 18,
    true,
    8,
  )
  drawFittedText(
    x + panelWidth * 0.08,
    y + panelHeight * 0.72,
    compact ? 'LOADING LEVEL 02' : 'SIGNAL PATH LOCKED // BUFFERING NEXT ROUTE',
    panelWidth * 0.84,
    compact ? 9 : 13,
    false,
    7,
  )

  ctx.strokeStyle = `rgba(32,255,147,${0.24 + alpha * 0.36})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + panelWidth * 0.08, y + panelHeight * 0.84)
  ctx.lineTo(x + panelWidth * (0.08 + 0.84 * progress), y + panelHeight * 0.84)
  ctx.stroke()
  ctx.restore()
}

function completionButtonBounds() {
  const rect = displayRect()
  const compact = isCompactViewport()
  const width = Math.min(rect.width * (compact ? 0.6 : 0.34), compact ? 190 : 270)
  const height = compact ? 34 : 44
  return {
    x: rect.x + rect.width - width - (compact ? 16 : 42),
    y: rect.y + rect.height * (compact ? 0.78 : 0.81),
    width,
    height,
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

function drawCompletionPrompt(now) {
  completionButtonRect = null
  if (!completionReady()) return

  const compact = isCompactViewport()
  const button = completionButtonBounds()
  const pulse = 0.55 + Math.sin(now * 0.007) * 0.45
  const label = hasNextLevel(state) ? 'LOAD NEXT LEVEL' : 'COMPLETE BYPASS'

  completionButtonRect = button
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = `rgba(0, 32, 18, ${0.72 + pulse * 0.12})`
  ctx.strokeStyle = `rgba(82, 255, 174, ${0.68 + pulse * 0.24})`
  ctx.lineWidth = compact ? 1.5 : 2
  ctx.shadowColor = 'rgba(32,255,147,0.72)'
  ctx.shadowBlur = compact ? 12 : 20
  ctx.fillRect(button.x, button.y, button.width, button.height)
  ctx.strokeRect(button.x, button.y, button.width, button.height)

  ctx.strokeStyle = `rgba(190,255,225,${0.26 + pulse * 0.2})`
  ctx.lineWidth = 1
  ctx.strokeRect(button.x + 4, button.y + 4, button.width - 8, button.height - 8)

  drawFittedText(
    button.x + button.width * 0.11,
    button.y + button.height * 0.62,
    label,
    button.width * 0.78,
    compact ? 10 : 14,
    true,
    8,
  )

  drawFittedText(
    button.x,
    button.y - (compact ? 8 : 12),
    compact ? 'ALL OUT POWERED' : 'ALL OUTPUTS POWERED // MANUAL CONFIRM REQUIRED',
    button.width,
    compact ? 8 : 11,
    false,
    7,
  )
  ctx.restore()
}

function drawNoise() {
  const width = window.innerWidth
  const height = window.innerHeight
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#9effc8'
  for (let i = 0; i < 160; i += 1) {
    const x = (i * 97 + frame * 17) % width
    const y = (i * 193 + frame * 11) % height
    ctx.fillRect(x, y, 1, i % 7 === 0 ? 2 : 1)
  }
  ctx.restore()
}

function dispatchCompletionIfNeeded(now) {
  if (state.status === 'failed' && !lastComplete) {
    window.parent?.postMessage({ type: 'r3-mission-failed' }, '*')
    lastComplete = true
  }
}

function persistCompletion(message) {
  try {
    const existing = JSON.parse(localStorage.getItem(SIGNAL_BYPASS_PROGRESS_KEY) || '{}')
    const completedLevels = Array.isArray(existing.completedLevels) ? existing.completedLevels : []
    const completedIds = Array.isArray(message.completedLevelIds) && message.completedLevelIds.length
      ? message.completedLevelIds
      : [message.levelId]
    const lastReward = {
      levelId: message.levelId,
      store: state.store,
      tier: message.rewardTier,
      traceDetect: message.traceDetect,
      completedAt: new Date().toISOString(),
    }

    localStorage.setItem(SIGNAL_BYPASS_PROGRESS_KEY, JSON.stringify({
      ...existing,
      completedLevels: Array.from(new Set([...completedLevels, ...completedIds])),
      lastReward,
    }))
  } catch {
    // Direct-play demo progress is optional; completion messaging must continue.
  }
}

function render() {
  const now = performance.now()
  frame += 1
  state = updateTrace(state)
  power = solvePower(state)
  dispatchCompletionIfNeeded(now)
  maybeAdvanceLevel(now)
  power = solvePower(state)
  const fx = successFx(now)

  const nodes = nodeMapForState(state)
  clearScreen()
  drawFloorLogoPattern(fx)
  drawScreenFrame()
  drawWakePulseLogo(fx)
  drawHeader()
  drawEdges(nodes, fx)
  drawNodes(nodes)
  drawCompletionPrompt(now)
  drawLevelAdvanceOverlay(now)
  drawNoise()

  window.r3CrtSignalBypass = {
    state,
    power,
    levels: LEVELS,
    level: activeLevel(),
    activeLevelId: state.levelId,
    activeLevelIndex: state.levelIndex,
    visualLayers: {
      floorLogoPattern: floorLogo.loaded,
      floorLogoSource: floorLogo.source,
      floorLogoCutout: floorLogo.cutoutReady,
      floorLogoFailed: floorLogo.failed,
      successAnimation: 'wake-pulse',
      successAnimationStarted,
      successAnimationActive: fx.active,
      successAnimationProgress: fx.progress,
      levelAdvanceActive,
      manualCompletion: true,
      completionReady: completionReady(),
    },
    rotateSelected: () => {
      state = rotateModule(state)
      power = solvePower(state)
      return power
    },
    solve: () => {
      state = solveAllModules(state)
      power = solvePower(state)
      return { ...power, completionReady: completionReady() }
    },
    confirmCompletion: () => {
      const confirmed = confirmCompletion(performance.now())
      power = solvePower(state)
      return { confirmed, power }
    },
  }

  requestAnimationFrame(render)
}

function moduleAtPoint(x, y) {
  let nearest = null
  let nearestDistance = Infinity
  state.modules.forEach((module) => {
    const point = gridPoint(module)
    const distance = Math.hypot(point.x - x, point.y - y)
    if (distance < nearestDistance) {
      nearest = module
      nearestDistance = distance
    }
  })
  return nearestDistance < (isCompactViewport() ? 30 : 36) ? nearest : null
}

window.addEventListener('keydown', (event) => {
  if (levelAdvanceActive) return
  const key = event.key.toLowerCase()
  if (completionReady() && key === 'enter') {
    event.preventDefault()
    confirmCompletion(performance.now())
    return
  }
  const action = inputActionByKey.get(key)
  if (action) {
    event.preventDefault()
    state = selectModuleInDirection(state, action)
    return
  }
  if (event.code === 'Space' || key === 'enter') {
    event.preventDefault()
    state = rotateModule(state)
  }
})

canvas.addEventListener('pointerdown', (event) => {
  if (levelAdvanceActive) return
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (completionReady()) {
    const button = completionButtonRect || completionButtonBounds()
    if (pointInRect(x, y, button)) {
      confirmCompletion(performance.now())
      return
    }
  }
  const module = moduleAtPoint(x, y)
  if (!module) return
  state = rotateModule(selectModule(state, module.id), module.id)
})

window.addEventListener('resize', resizeCanvas)
resizeCanvas()
boot?.setAttribute('hidden', 'true')
requestAnimationFrame(render)

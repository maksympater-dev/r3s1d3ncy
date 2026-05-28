export const SIDES = ['N', 'E', 'S', 'W']

export const SIDE_VECTOR = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
}

export const OPPOSITE_SIDE = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
}

export function rotateSides(sides, rotation) {
  return sides.map((side) => SIDES[(SIDES.indexOf(side) + rotation + 4) % 4])
}

export const LEVELS = [
  {
    id: 'signal-bypass-01',
    label: 'LEVEL 01',
    primarySourceId: 'source-a',
    sources: [
      { id: 'source-a', x: 1, y: 5, label: 'PWR-A' },
    ],
    targets: [
      { id: 'target-a', x: 5, y: 0, open: ['S'], label: 'OUT-01' },
      { id: 'target-b', x: 8, y: 3, open: ['W'], label: 'OUT-02' },
      { id: 'target-c', x: 7, y: 6, open: ['N'], label: 'OUT-03' },
    ],
    modules: [
      { id: 'm1', x: 2, y: 5, open: ['E', 'W'], rotation: 0, label: '01' },
      { id: 'm2', x: 3, y: 5, open: ['E', 'W'], rotation: 1, label: '02' },
      { id: 'm3', x: 4, y: 5, open: ['N', 'E', 'W'], rotation: 2, label: '03' },
      { id: 'm4', x: 5, y: 5, open: ['E', 'W'], rotation: 0, label: '04' },
      { id: 'm5', x: 6, y: 5, open: ['E', 'W'], rotation: 1, label: '05' },
      { id: 'm6', x: 7, y: 5, open: ['S', 'W'], rotation: 0, label: '06' },
      { id: 'm7', x: 4, y: 4, open: ['N', 'S'], rotation: 1, label: '07' },
      { id: 'm8', x: 4, y: 3, open: ['N', 'E', 'S'], rotation: 1, label: '08' },
      { id: 'm9', x: 5, y: 3, open: ['E', 'W'], rotation: 0, label: '09' },
      { id: 'm10', x: 6, y: 3, open: ['E', 'W'], rotation: 1, label: '10' },
      { id: 'm11', x: 7, y: 3, open: ['E', 'W'], rotation: 0, label: '11' },
      { id: 'm12', x: 4, y: 2, open: ['N', 'S'], rotation: 0, label: '12' },
      { id: 'm13', x: 4, y: 1, open: ['E', 'S'], rotation: 1, label: '13' },
      { id: 'm14', x: 5, y: 1, open: ['N', 'E', 'W'], rotation: 0, label: '14' },
      { id: 'm15', x: 6, y: 1, open: ['E', 'W'], rotation: 1, label: '15' },
      { id: 'm16', x: 7, y: 1, open: ['E', 'W'], rotation: 0, label: '16' },
    ],
  },
  {
    id: 'signal-bypass-02',
    label: 'LEVEL 02',
    primarySourceId: 'source-a',
    sources: [
      { id: 'source-a', x: 1, y: 5, label: 'PWR-A' },
    ],
    targets: [
      { id: 'target-a', x: 5, y: 0, open: ['S'], label: 'OUT-01' },
      { id: 'target-b', x: 8, y: 2, open: ['W'], label: 'OUT-02' },
      { id: 'target-c', x: 7, y: 6, open: ['N'], label: 'OUT-03' },
      { id: 'target-d', x: 1, y: 3, open: ['E'], label: 'OUT-04' },
    ],
    modules: [
      { id: 'm1', x: 2, y: 5, open: ['E', 'W'], rotation: 1, label: '01' },
      { id: 'm2', x: 3, y: 5, open: ['N', 'E', 'W'], rotation: 1, label: '02' },
      { id: 'm3', x: 4, y: 5, open: ['N', 'E', 'W'], rotation: 1, label: '03' },
      { id: 'm4', x: 5, y: 5, open: ['E', 'W'], rotation: 1, label: '04' },
      { id: 'm5', x: 6, y: 5, open: ['N', 'E', 'W'], rotation: 1, label: '05' },
      { id: 'm6', x: 7, y: 5, open: ['S', 'W'], rotation: 1, label: '06' },
      { id: 'm7', x: 4, y: 4, open: ['N', 'S'], rotation: 1, label: '07' },
      { id: 'm8', x: 4, y: 3, open: ['N', 'E', 'S'], rotation: 1, label: '08' },
      { id: 'm9', x: 4, y: 2, open: ['N', 'S'], rotation: 1, label: '09' },
      { id: 'm10', x: 4, y: 1, open: ['E', 'S'], rotation: 1, label: '10' },
      { id: 'm11', x: 5, y: 1, open: ['N', 'E', 'W'], rotation: 1, label: '11' },
      { id: 'm12', x: 6, y: 1, open: ['E', 'W'], rotation: 1, label: '12' },
      { id: 'm13', x: 7, y: 1, open: ['E', 'W'], rotation: 1, label: '13' },
      { id: 'm14', x: 5, y: 3, open: ['E', 'W'], rotation: 1, label: '14' },
      { id: 'm15', x: 6, y: 3, open: ['N', 'E', 'W'], rotation: 1, label: '15' },
      { id: 'm16', x: 7, y: 3, open: ['E', 'W'], rotation: 1, label: '16' },
      { id: 'm17', x: 6, y: 2, open: ['E', 'S'], rotation: 1, label: '17' },
      { id: 'm18', x: 7, y: 2, open: ['E', 'W'], rotation: 1, label: '18' },
      { id: 'm19', x: 6, y: 4, open: ['N', 'S'], rotation: 1, label: '19' },
      { id: 'm20', x: 3, y: 3, open: ['E', 'S', 'W'], rotation: 1, label: '20' },
      { id: 'm21', x: 3, y: 4, open: ['N', 'S'], rotation: 1, label: '21' },
      { id: 'm22', x: 2, y: 3, open: ['E', 'W'], rotation: 1, label: '22' },
    ],
  },
  {
    id: 'signal-bypass-03',
    label: 'LEVEL 03',
    primarySourceId: 'source-a',
    sources: [
      { id: 'source-a', x: 1, y: 5, label: 'PWR-A' },
    ],
    targets: [
      { id: 'target-a', x: 4, y: 0, open: ['S'], label: 'OUT-01' },
      { id: 'target-b', x: 8, y: 2, open: ['W'], label: 'OUT-02' },
      { id: 'target-c', x: 2, y: 3, open: ['E'], label: 'OUT-03' },
      { id: 'target-d', x: 6, y: 6, open: ['N'], label: 'OUT-04' },
      { id: 'target-e', x: 8, y: 5, open: ['W'], label: 'OUT-05' },
    ],
    modules: [
      { id: 'm1', x: 2, y: 5, open: ['E', 'W'], rotation: 1, label: '01' },
      { id: 'm2', x: 3, y: 5, open: ['N', 'E', 'W'], rotation: 1, label: '02' },
      { id: 'm3', x: 4, y: 5, open: ['E', 'W'], rotation: 1, label: '03' },
      { id: 'm4', x: 5, y: 5, open: ['N', 'E', 'W'], rotation: 1, label: '04' },
      { id: 'm5', x: 6, y: 5, open: ['E', 'S', 'W'], rotation: 1, label: '05' },
      { id: 'm6', x: 7, y: 5, open: ['E', 'W'], rotation: 1, label: '06' },
      { id: 'm7', x: 3, y: 4, open: ['N', 'S'], rotation: 1, label: '07' },
      { id: 'm8', x: 5, y: 4, open: ['E', 'S'], rotation: 1, label: '08' },
      { id: 'm9', x: 6, y: 4, open: ['E', 'W'], rotation: 1, label: '09' },
      { id: 'm10', x: 7, y: 4, open: ['E', 'W'], rotation: 1, label: '10' },
      { id: 'm11', x: 3, y: 3, open: ['N', 'E', 'S', 'W'], rotation: 1, label: '11' },
      { id: 'm12', x: 4, y: 3, open: ['E', 'W'], rotation: 1, label: '12' },
      { id: 'm13', x: 5, y: 3, open: ['E', 'W'], rotation: 1, label: '13' },
      { id: 'm14', x: 6, y: 3, open: ['E', 'W'], rotation: 1, label: '14' },
      { id: 'm15', x: 7, y: 3, open: ['E', 'W'], rotation: 1, label: '15' },
      { id: 'm16', x: 3, y: 2, open: ['N', 'E', 'S'], rotation: 1, label: '16' },
      { id: 'm17', x: 4, y: 2, open: ['E', 'W'], rotation: 1, label: '17' },
      { id: 'm18', x: 5, y: 2, open: ['E', 'W'], rotation: 1, label: '18' },
      { id: 'm19', x: 6, y: 2, open: ['E', 'W'], rotation: 1, label: '19' },
      { id: 'm20', x: 7, y: 2, open: ['E', 'W'], rotation: 1, label: '20' },
      { id: 'm21', x: 3, y: 1, open: ['E', 'S'], rotation: 1, label: '21' },
      { id: 'm22', x: 4, y: 1, open: ['N', 'E', 'W'], rotation: 1, label: '22' },
      { id: 'm23', x: 5, y: 1, open: ['E', 'W'], rotation: 1, label: '23' },
      { id: 'm24', x: 6, y: 1, open: ['E', 'W'], rotation: 1, label: '24' },
      { id: 'm25', x: 7, y: 1, open: ['E', 'W'], rotation: 1, label: '25' },
    ],
  },
]

export const LEVEL = LEVELS[0]

export function getLevelByIndex(levelIndex = 0) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, levelIndex))] || LEVEL
}

export function getCurrentLevel(state) {
  return getLevelByIndex(state?.levelIndex ?? 0)
}

function parseLevelIndex(searchParams) {
  const requestedLevel = Number.parseInt(searchParams.get('level') || '1', 10)
  if (!Number.isFinite(requestedLevel)) return 0
  return Math.max(0, Math.min(LEVELS.length - 1, requestedLevel - 1))
}

export function allLevelNodes(level = LEVEL) {
  return [...level.sources, ...level.modules, ...level.targets]
}

export function deriveLevelEdges(level = LEVEL) {
  const nodes = allLevelNodes(level)
  const edgeIds = new Set()
  const edges = []

  function addEdge(from, to) {
    const id = edgeKey(from.id, to.id)
    if (edgeIds.has(id)) return
    edgeIds.add(id)
    edges.push([from.id, to.id])
  }

  const rows = new Map()
  const columns = new Map()
  nodes.forEach((node) => {
    if (!rows.has(node.y)) rows.set(node.y, [])
    if (!columns.has(node.x)) columns.set(node.x, [])
    rows.get(node.y).push(node)
    columns.get(node.x).push(node)
  })

  rows.forEach((row) => {
    row.sort((a, b) => a.x - b.x)
    for (let i = 0; i < row.length - 1; i += 1) {
      if (row[i + 1].x - row[i].x === 1) addEdge(row[i], row[i + 1])
    }
  })

  columns.forEach((column) => {
    column.sort((a, b) => a.y - b.y)
    for (let i = 0; i < column.length - 1; i += 1) {
      if (column[i + 1].y - column[i].y === 1) addEdge(column[i], column[i + 1])
    }
  })

  return edges
}

export function levelEdges(level = LEVEL) {
  return deriveLevelEdges(level)
}

export function createGameState(params = {}) {
  const searchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params)
  const levelIndex = parseLevelIndex(searchParams)
  const level = getLevelByIndex(levelIndex)
  return {
    selectedIndex: 0,
    status: 'active',
    solvedOnce: false,
    traceDetect: 0,
    startedAt: Date.now(),
    store: searchParams.get('store') || 'R3 NODE',
    tier: searchParams.get('tier') || 'Common',
    levelIndex,
    levelId: level.id,
    completedLevelIds: [],
    modules: level.modules.map((module) => ({ ...module })),
  }
}

export function createStateForLevel(state, levelIndex, now = Date.now()) {
  const level = getLevelByIndex(levelIndex)
  return {
    ...state,
    selectedIndex: 0,
    status: 'active',
    solvedOnce: false,
    traceDetect: 0,
    startedAt: now,
    levelIndex,
    levelId: level.id,
    modules: level.modules.map((module) => ({ ...module })),
  }
}

export function hasNextLevel(state) {
  return (state?.levelIndex ?? 0) < LEVELS.length - 1
}

export function markCurrentLevelComplete(state) {
  const nextState = cloneState(state)
  const level = getCurrentLevel(nextState)
  nextState.solvedOnce = true
  nextState.completedLevelIds = Array.from(new Set([...nextState.completedLevelIds, level.id]))
  return nextState
}

export function advanceToNextLevel(state, now = Date.now()) {
  const completedState = markCurrentLevelComplete(state)
  return createStateForLevel(completedState, completedState.levelIndex + 1, now)
}

export function getModuleById(state, id) {
  return state.modules.find((module) => module.id === id)
}

export function getSelectedModule(state) {
  return state.modules[state.selectedIndex] || state.modules[0]
}

export function selectNextModule(state, direction) {
  const nextState = cloneState(state)
  const offset = direction === 'previous' ? -1 : 1
  nextState.selectedIndex = (nextState.selectedIndex + offset + nextState.modules.length) % nextState.modules.length
  return nextState
}

export function selectModuleInDirection(state, direction) {
  const selected = getSelectedModule(state)
  if (!selected) return state

  const vectors = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }
  const vector = vectors[direction]
  if (!vector) return state

  const candidates = state.modules
    .map((module, index) => {
      if (module.id === selected.id) return null
      const dx = module.x - selected.x
      const dy = module.y - selected.y
      const primary = dx * vector.x + dy * vector.y
      if (primary <= 0) return null
      const cross = Math.abs(vector.x === 0 ? dx : dy)
      return {
        index,
        primary,
        cross,
        distance: Math.hypot(dx, dy),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const scoreA = a.cross * 100 + a.primary * 10 + a.distance
      const scoreB = b.cross * 100 + b.primary * 10 + b.distance
      return scoreA - scoreB
    })

  if (!candidates[0]) return state
  const nextState = cloneState(state)
  nextState.selectedIndex = candidates[0].index
  return nextState
}

export function selectModule(state, id) {
  const nextState = cloneState(state)
  const index = nextState.modules.findIndex((module) => module.id === id)
  if (index >= 0) nextState.selectedIndex = index
  return nextState
}

export function rotateModule(state, id = getSelectedModule(state)?.id) {
  const nextState = cloneState(state)
  const module = getModuleById(nextState, id)
  if (module) module.rotation = (module.rotation + 1) % 4
  return nextState
}

export function cloneState(state) {
  return {
    ...state,
    completedLevelIds: [...(state.completedLevelIds || [])],
    modules: state.modules.map((module) => ({ ...module })),
  }
}

export function nodeMapForState(state, level = getCurrentLevel(state)) {
  const nodes = new Map()
  level.sources.forEach((node) => {
    nodes.set(node.id, { ...node, type: 'source', open: ['N', 'E', 'S', 'W'] })
  })
  level.targets.forEach((node) => {
    nodes.set(node.id, { ...node, type: 'target', open: node.open || ['W'] })
  })
  state.modules.forEach((module) => {
    nodes.set(module.id, {
      ...module,
      type: 'module',
      open: rotateSides(module.open, module.rotation),
    })
  })
  return nodes
}

export function sideBetween(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'E' : 'W'
  return dy > 0 ? 'S' : 'N'
}

function tracePowerNetwork(state, sourceIds, edges, level) {
  const nodes = nodeMapForState(state, level)
  const poweredNodes = new Set(sourceIds)
  const poweredEdges = new Set()
  const queue = [...poweredNodes]

  while (queue.length > 0) {
    const currentId = queue.shift()
    const currentNode = nodes.get(currentId)
    if (!currentNode) continue

    for (const [fromId, toId] of edges) {
      const forward = fromId === currentId
      const backward = toId === currentId
      if (!forward && !backward) continue

      const nextId = forward ? toId : fromId
      if (poweredNodes.has(nextId)) continue

      const nextNode = nodes.get(nextId)
      if (!nextNode) continue

      const currentSide = sideBetween(currentNode, nextNode)
      const nextSide = sideBetween(nextNode, currentNode)
      if (currentNode.open.includes(currentSide) && nextNode.open.includes(nextSide)) {
        const edgeId = edgeKey(fromId, toId)
        poweredEdges.add(edgeId)
        poweredNodes.add(nextId)
        queue.push(nextId)
      }
    }
  }

  return {
    poweredEdges,
    poweredNodes,
  }
}

export function solvePower(state) {
  const level = getCurrentLevel(state)
  const edges = levelEdges(level)
  const sourceNetworks = new Map()
  const visuallyPoweredNodes = new Set()
  const visuallyPoweredEdges = new Set()

  level.sources.forEach((source) => {
    const network = tracePowerNetwork(state, [source.id], edges, level)
    sourceNetworks.set(source.id, network)
    network.poweredNodes.forEach((nodeId) => visuallyPoweredNodes.add(nodeId))
    network.poweredEdges.forEach((edgeId) => visuallyPoweredEdges.add(edgeId))
  })

  const primarySourceId = level.primarySourceId || level.sources[0]?.id
  const primaryNetwork = sourceNetworks.get(primarySourceId) || tracePowerNetwork(state, [primarySourceId], edges, level)
  const poweredTargets = level.targets.filter((target) => primaryNetwork.poweredNodes.has(target.id)).length

  level.targets.forEach((target) => {
    if (primaryNetwork.poweredNodes.has(target.id)) return
    visuallyPoweredNodes.delete(target.id)
    edges.forEach(([fromId, toId]) => {
      if (fromId === target.id || toId === target.id) visuallyPoweredEdges.delete(edgeKey(fromId, toId))
    })
  })

  return {
    poweredEdges: visuallyPoweredEdges,
    poweredNodes: visuallyPoweredNodes,
    primaryPoweredEdges: primaryNetwork.poweredEdges,
    primaryPoweredNodes: primaryNetwork.poweredNodes,
    poweredTargets,
    complete: poweredTargets === level.targets.length,
  }
}

export function edgeKey(fromId, toId) {
  return [fromId, toId].sort().join('--')
}

export function solveAllModules(state) {
  return {
    ...cloneState(state),
    modules: state.modules.map((module) => ({ ...module, rotation: 0 })),
  }
}

export function updateTrace(state, now = Date.now(), timeoutMs = 90000) {
  if (state.status !== 'active') return state
  const nextState = cloneState(state)
  const elapsed = Math.max(0, now - nextState.startedAt)
  nextState.traceDetect = Math.min(100, Math.floor((elapsed / timeoutMs) * 100))
  if (nextState.traceDetect >= 100 && !solvePower(nextState).complete) {
    nextState.status = 'failed'
  }
  return nextState
}

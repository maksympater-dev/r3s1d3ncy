import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const appUrl = process.env.R3_SITE_URL || 'http://127.0.0.1:3000/?skipIntro=1'
const debugPort = Number(process.env.R3_SITE_SMOKE_DEBUG_PORT || 9362)
const chromeCandidates = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
].filter(Boolean)

function findChrome() {
  return chromeCandidates.find((path) => existsSync(path))
}

async function waitForHttp(url, attempts = 40) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw lastError
}

async function fetchJson(url, attempts = 30) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw lastError
}

class CdpClient {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      if (!payload.id || !this.pending.has(payload.id)) return
      const { resolve, reject } = this.pending.get(payload.id)
      this.pending.delete(payload.id)
      if (payload.error) reject(new Error(payload.error.message))
      else resolve(payload.result)
    })
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
  }

  close() {
    this.ws.close()
  }
}

async function waitForRuntime(client, expression, attempts = 160) {
  for (let i = 0; i < attempts; i += 1) {
    const result = await client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    })
    if (result.result?.value) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for runtime condition: ${expression}`)
}

async function evaluateValue(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  })
  return result.result.value
}

async function main() {
  const chromePath = findChrome()
  if (!chromePath) throw new Error('Chrome or Edge not found')

  await waitForHttp(appUrl)
  const userDataDir = mkdtempSync(join(tmpdir(), 'r3-signal-bypass-site-'))
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    'about:blank',
  ])

  try {
    await fetchJson(`http://127.0.0.1:${debugPort}/json/version`)
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(appUrl)}`, {
      method: 'PUT',
    })
    const target = await response.json()
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

    const client = new CdpClient(ws)
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Page.navigate', { url: appUrl })
    await waitForRuntime(client, `document.readyState === 'complete' || document.readyState === 'interactive'`)

    await client.send('Runtime.evaluate', {
      expression: `localStorage.removeItem('r3-signal-bypass-progress')`,
      returnByValue: true,
    })
    await waitForRuntime(
      client,
      `(() => {
        const visible = (button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && !button.disabled;
        };
        return [...document.querySelectorAll('button')].some((button) => visible(button) && /SIGNAL\\s+BYPASS|\\bBYPASS\\b/i.test(button.textContent || ''));
      })()`,
    )
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const visible = (button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && !button.disabled;
        };
        window.__r3SmokeMessages = [];
        window.addEventListener('message', (event) => window.__r3SmokeMessages.push(event.data), { once: false });
        const buttons = [...document.querySelectorAll('button')].filter(visible);
        const button = buttons.find((candidate) => /SIGNAL\\s+BYPASS/i.test(candidate.textContent || ''))
          || buttons.find((candidate) => /\\bBYPASS\\b/i.test(candidate.textContent || ''));
        button?.click();
        return Boolean(button);
      })()`,
      returnByValue: true,
    })

    await waitForRuntime(
      client,
      `(() => {
        if (document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]')) return true;
        const visible = (button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && !button.disabled;
        };
        const buttons = [...document.querySelectorAll('button')].filter(visible);
        const button = buttons.find((candidate) => /SIGNAL\\s+BYPASS/i.test(candidate.textContent || ''))
          || buttons.find((candidate) => /\\bBYPASS\\b/i.test(candidate.textContent || ''));
        button?.click();
        return Boolean(document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]'));
      })()`,
      20,
    )
    await waitForRuntime(client, `Boolean(document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]'))`)
    await waitForRuntime(client, `Boolean(document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]')?.contentWindow?.r3CrtSignalBypass?.power)`)
    const initial = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return {
        activeLevelId: game.activeLevelId,
        poweredTargets: game.power.poweredTargets,
        targetCount: game.level.targets.length,
        moduleCount: game.state.modules.length
      };
    })()`)
    if (
      initial.activeLevelId !== 'signal-bypass-01' ||
      initial.poweredTargets !== 0 ||
      initial.targetCount !== 3 ||
      initial.moduleCount !== 16
    ) {
      throw new Error(`Unexpected level 01 site iframe initial state: ${JSON.stringify(initial)}`)
    }

    const levelOneSolved = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      const result = game.solve();
      return {
        poweredTargets: result.poweredTargets,
        complete: result.complete,
        completionReady: result.completionReady,
        messages: window.__r3SmokeMessages
      };
    })()`)
    if (
      levelOneSolved.poweredTargets !== 3 ||
      !levelOneSolved.complete ||
      !levelOneSolved.completionReady ||
      levelOneSolved.messages?.some((message) => message?.type === 'r3-mission-complete')
    ) {
      throw new Error(`Expected level 01 solved state waiting for manual confirm, got ${JSON.stringify(levelOneSolved)}`)
    }

    const levelOneConfirmed = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return game.confirmCompletion();
    })()`)
    if (!levelOneConfirmed.confirmed) {
      throw new Error(`Expected level 01 manual confirmation, got ${JSON.stringify(levelOneConfirmed)}`)
    }
    await waitForRuntime(client, `document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]')?.contentWindow?.r3CrtSignalBypass?.activeLevelId === 'signal-bypass-02'`)
    const afterLevelOne = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return {
        activeLevelId: game.activeLevelId,
        poweredTargets: game.power.poweredTargets,
        targetCount: game.level.targets.length,
        moduleCount: game.state.modules.length,
        allModulesFarFromSolved: game.state.modules.every((module) => module.rotation === 1),
        hasSuccessModal: document.body.textContent.includes('DECRYPTION SUCCESSFUL'),
        messages: window.__r3SmokeMessages
      };
    })()`)
    if (
      afterLevelOne.activeLevelId !== 'signal-bypass-02' ||
      afterLevelOne.poweredTargets !== 0 ||
      afterLevelOne.targetCount !== 4 ||
      afterLevelOne.moduleCount !== 22 ||
      !afterLevelOne.allModulesFarFromSolved ||
      afterLevelOne.hasSuccessModal ||
      afterLevelOne.messages?.some((message) => message?.type === 'r3-mission-complete')
    ) {
      throw new Error(`Level 01 should transition without site reward: ${JSON.stringify(afterLevelOne)}`)
    }

    const levelTwoSolved = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      const result = game.solve();
      return {
        poweredTargets: result.poweredTargets,
        complete: result.complete,
        completionReady: result.completionReady,
        messages: window.__r3SmokeMessages
      };
    })()`)
    if (
      levelTwoSolved.poweredTargets !== 4 ||
      !levelTwoSolved.complete ||
      !levelTwoSolved.completionReady ||
      levelTwoSolved.messages?.some((message) => message?.type === 'r3-mission-complete')
    ) {
      throw new Error(`Expected level 02 solved state waiting for manual confirm, got ${JSON.stringify(levelTwoSolved)}`)
    }

    const levelTwoConfirmed = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return game.confirmCompletion();
    })()`)
    if (!levelTwoConfirmed.confirmed) {
      throw new Error(`Expected level 02 manual confirmation, got ${JSON.stringify(levelTwoConfirmed)}`)
    }
    await waitForRuntime(client, `document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]')?.contentWindow?.r3CrtSignalBypass?.activeLevelId === 'signal-bypass-03'`)
    const afterLevelTwo = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return {
        activeLevelId: game.activeLevelId,
        poweredTargets: game.power.poweredTargets,
        targetCount: game.level.targets.length,
        moduleCount: game.state.modules.length,
        allModulesFarFromSolved: game.state.modules.every((module) => module.rotation === 1),
        hasSuccessModal: document.body.textContent.includes('DECRYPTION SUCCESSFUL'),
        messages: window.__r3SmokeMessages
      };
    })()`)
    if (
      afterLevelTwo.activeLevelId !== 'signal-bypass-03' ||
      afterLevelTwo.poweredTargets !== 0 ||
      afterLevelTwo.targetCount !== 5 ||
      afterLevelTwo.moduleCount !== 25 ||
      !afterLevelTwo.allModulesFarFromSolved ||
      afterLevelTwo.hasSuccessModal ||
      afterLevelTwo.messages?.some((message) => message?.type === 'r3-mission-complete')
    ) {
      throw new Error(`Level 02 should transition without site reward: ${JSON.stringify(afterLevelTwo)}`)
    }

    const levelThreeSolved = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      const result = game.solve();
      return {
        poweredTargets: result.poweredTargets,
        complete: result.complete,
        completionReady: result.completionReady,
        hasSuccessModal: document.body.textContent.includes('DECRYPTION SUCCESSFUL'),
        messages: window.__r3SmokeMessages
      };
    })()`)
    if (
      levelThreeSolved.poweredTargets !== 5 ||
      !levelThreeSolved.complete ||
      !levelThreeSolved.completionReady ||
      levelThreeSolved.hasSuccessModal ||
      levelThreeSolved.messages?.some((message) => message?.type === 'r3-mission-complete')
    ) {
      throw new Error(`Expected level 03 solved state waiting for manual confirm, got ${JSON.stringify(levelThreeSolved)}`)
    }

    const levelThreeConfirmed = await evaluateValue(client, `(() => {
      const game = document.querySelector('iframe[title="R3 Signal Bypass Game Frame"]').contentWindow.r3CrtSignalBypass;
      return game.confirmCompletion();
    })()`)
    if (!levelThreeConfirmed.confirmed) {
      throw new Error(`Expected level 03 manual confirmation, got ${JSON.stringify(levelThreeConfirmed)}`)
    }
    await waitForRuntime(client, `document.body.textContent.includes('DECRYPTION SUCCESSFUL')`)
    const finalState = await evaluateValue(client, `(() => {
      const progress = JSON.parse(localStorage.getItem('r3-signal-bypass-progress') || '{}');
      const completeMessage = window.__r3SmokeMessages.find((message) => message?.type === 'r3-mission-complete') || null;
      return {
        hasSuccessModal: document.body.textContent.includes('DECRYPTION SUCCESSFUL'),
        completeMessage,
        completedLevels: progress.completedLevels || [],
        lastReward: progress.lastReward || null
      };
    })()`)
    if (
      !finalState.hasSuccessModal ||
      finalState.completeMessage?.levelId !== 'signal-bypass-03' ||
      !finalState.completedLevels.includes('signal-bypass-01') ||
      !finalState.completedLevels.includes('signal-bypass-02') ||
      !finalState.completedLevels.includes('signal-bypass-03')
    ) {
      throw new Error(`Expected final site reward and persisted progress, got ${JSON.stringify(finalState)}`)
    }

    console.log('Initial:', initial)
    console.log('Level 01 solved:', levelOneSolved)
    console.log('Level 01 confirmed:', levelOneConfirmed)
    console.log('After Level 01:', afterLevelOne)
    console.log('Level 02 solved:', levelTwoSolved)
    console.log('Level 02 confirmed:', levelTwoConfirmed)
    console.log('After Level 02:', afterLevelTwo)
    console.log('Level 03 solved:', levelThreeSolved)
    console.log('Level 03 confirmed:', levelThreeConfirmed)
    console.log('Final:', finalState)
    console.log('SUCCESS: site Signal Bypass three-level iframe flow works.')
    client.close()
  } finally {
    chromeProcess.kill()
    setTimeout(() => {
      try {
        rmSync(userDataDir, { recursive: true, force: true })
      } catch {
        // Chrome can briefly keep profile files locked on Windows.
      }
    }, 250)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

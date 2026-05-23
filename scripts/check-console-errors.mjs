import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const appUrl = 'http://127.0.0.1:3000'
const chromeCandidates = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
].filter(Boolean)

function findChrome() {
  return chromeCandidates.find((path) => existsSync(path))
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
    this.listeners = new Map()

    ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id)
        this.pending.delete(payload.id)
        if (payload.error) reject(new Error(payload.error.message))
        else resolve(payload.result)
        return
      }

      const listeners = this.listeners.get(payload.method) ?? []
      listeners.forEach((listener) => listener(payload.params))
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

  on(method, listener) {
    const arr = this.listeners.get(method) ?? []
    arr.push(listener)
    this.listeners.set(method, arr)
  }

  close() {
    this.ws.close()
  }
}

async function main() {
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('Chrome not found')
    process.exit(1)
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'r3-console-check-'))
  const port = 9350
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank',
  ])

  try {
    await fetchJson(`http://127.0.0.1:${port}/json/version`)
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(appUrl)}`, {
      method: 'PUT',
    })
    const target = await response.json()

    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

    const client = new CdpClient(ws)
    await client.send('Page.enable')
    await client.send('Console.enable')
    await client.send('Runtime.enable')

    client.on('Console.messageAdded', (params) => {
      console.log(`[BROWSER CONSOLE] ${params.message.level.toUpperCase()}: ${params.message.text}`)
    })

    client.on('Runtime.exceptionThrown', (params) => {
      console.error(`[BROWSER EXCEPTION]`, params.exceptionDetails.exception?.description || params.exceptionDetails)
    })

    console.log('Navigating to', appUrl)
    await client.send('Page.navigate', { url: appUrl })

    // Wait for hydration
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const beforeState = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /enter now/i.test(b.textContent || ''));
        const card = document.querySelector('.r3-card');
        return {
          buttonFound: !!btn,
          buttonText: btn ? btn.textContent.trim() : null,
          buttonOpacity: btn ? getComputedStyle(btn).opacity : null,
          cardFound: !!card,
          cardTransform: card ? getComputedStyle(card).transform : null
        };
      })()`,
      returnByValue: true
    })
    console.log('Before click state:', beforeState.result.value)

    console.log('Clicking button...')
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /enter now/i.test(b.textContent || ''));
        if (btn) btn.click();
      })()`
    })

    // Wait 1.5 seconds and check transition progress
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const midState = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => /enter now/i.test(b.textContent || ''));
        return {
          buttonFound: !!btn,
          buttonOpacity: btn ? getComputedStyle(btn).opacity : null,
          hasCodeLines: !!document.querySelector('.font-mono')
        };
      })()`,
      returnByValue: true
    })
    console.log('1.5s after click state:', midState.result.value)

    // Wait another 3.5 seconds
    await new Promise((resolve) => setTimeout(resolve, 3500))

    const afterState = await client.send('Runtime.evaluate', {
      expression: `(() => {
        return {
          hasSelectCity: document.body.innerHTML.includes('Select city'),
          hasLoadingScreen: !!document.querySelector('.r3-loading-atmosphere')
        };
      })()`,
      returnByValue: true
    })
    console.log('5s after click state:', afterState.result.value)

    client.close()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    chromeProcess.kill()
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {}
  }
}

main()

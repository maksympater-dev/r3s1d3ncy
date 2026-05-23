import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const appUrl = process.env.RESPONSIVE_AUDIT_URL ?? 'http://localhost:3000'
const chromeCandidates = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
].filter(Boolean)

const staticRules = [
  {
    id: 'no-fixed-short-screen-heights',
    pattern: /\b(?:h|min-h|pt)-\[(?:5[68]vh|6[08]vh|7[06]vh|76vh|560px|430px|18vh|20vh)\]/,
    message: 'Use clamp/min/max/dvh responsive sizing instead of fixed tall vh or px layout heights.',
  },
  {
    id: 'no-early-two-column-experience',
    pattern: /\bmd:grid-cols-\[/,
    message: 'Large experiential panels should not become two-column at tablet width; use lg/xl.',
  },
  {
    id: 'no-unbounded-vw-display-type',
    pattern: /\btext-\[(?:13|15)vw\]/,
    message: 'Use clamp() for display type so text fits narrow, short, and ultrawide screens.',
  },
  {
    id: 'no-section-overflow-hidden',
    pattern: /<section\b[^>]*\boverflow-hidden\b/,
    message: 'Page sections should allow vertical recovery on short screens; use overflow-x-hidden.',
  },
  {
    id: 'no-large-responsive-offsets',
    pattern: /\b(?:translate-x-16|xl:translate-x-24|-translate-x-14)\b/,
    message: 'Avoid large breakpoint offsets that push panels out of tablet/ultrawide safe areas.',
  },
]

const viewports = [
  { name: 'mobile-compact', width: 360, height: 740, mobile: true },
  { name: 'mobile-modern', width: 390, height: 844, mobile: true },
  { name: 'tablet-portrait', width: 768, height: 1024, mobile: true },
  { name: 'laptop-short', width: 1366, height: 640, mobile: false },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'full-hd', width: 1920, height: 1080, mobile: false },
  { name: 'qhd', width: 2560, height: 1440, mobile: false },
]

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) return walk(path)
    return ['.tsx', '.ts', '.css'].includes(extname(path)) ? [path] : []
  })
}

function runStaticAudit() {
  const files = walk(join(root, 'src'))
  const findings = []

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    for (const rule of staticRules) {
      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          findings.push({
            file: relative(root, file),
            line: index + 1,
            rule: rule.id,
            message: rule.message,
            code: line.trim(),
          })
        }
      })
    }
  }

  return findings
}

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

async function waitForServer() {
  const response = await fetch(appUrl)
  if (!response.ok) {
    throw new Error(`App returned ${response.status} ${response.statusText}`)
  }
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

  waitFor(method, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`))
      }, timeout)

      const listener = (params) => {
        clearTimeout(timer)
        this.listeners.set(
          method,
          (this.listeners.get(method) ?? []).filter((item) => item !== listener),
        )
        resolve(params)
      }

      this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener])
    })
  }

  close() {
    this.ws.close()
  }
}

async function launchChrome() {
  const chromePath = findChrome()
  if (!chromePath) {
    throw new Error('Chrome or Edge executable was not found.')
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'r3-responsive-audit-'))
  const port = 9225 + Math.floor(Math.random() * 300)
  const process = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-sync',
    '--hide-scrollbars',
    '--no-sandbox',
    '--no-first-run',
    'about:blank',
  ])

  process.on('exit', () => {
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {}
  })

  const version = await fetchJson(`http://127.0.0.1:${port}/json/version`)

  return {
    browserProcess: process,
    port,
    browserWsUrl: version.webSocketDebuggerUrl,
    dispose: () => {
      process.kill()
      try {
        rmSync(userDataDir, { recursive: true, force: true })
      } catch {}
    },
  }
}

async function createPage(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(appUrl)}`, {
    method: 'PUT',
  })
  if (!response.ok) throw new Error(`Could not create Chrome target: ${response.status}`)
  const target = await response.json()

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  const client = new CdpClient(ws)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  return client
}

async function navigate(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })

  const loaded = client.waitFor('Page.loadEventFired').catch(() => null)
  await client.send('Page.navigate', { url: appUrl })
  await loaded
  await new Promise((resolve) => setTimeout(resolve, 3500))
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text)
  }

  return result.result.value
}

const layoutAuditExpression = `(() => {
  const viewport = { width: innerWidth, height: innerHeight };
  const root = document.documentElement;
  const body = document.body;
  const horizontalOverflow = Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth;
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (Number(style.opacity) === 0) return false;
    if (rect.width < 2 || rect.height < 2) return false;
    if (element.closest('[aria-hidden="true"]')) return false;
    return true;
  };
  const meaningful = (element) => {
    if (element.matches('script,style,svg,path')) return false;
    if (element.className && String(element.className).includes('mapboxgl')) return false;
    if (getComputedStyle(element).pointerEvents === 'none' && !element.textContent.trim()) return false;
    return Boolean(element.textContent.trim()) || element.matches('button,a,input,main,section,aside,header,nav');
  };
  const offenders = Array.from(document.querySelectorAll('body *'))
    .filter((element) => visible(element) && meaningful(element))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        text: element.textContent.trim().replace(/\\s+/g, ' ').slice(0, 80),
        className: String(element.className).slice(0, 120),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })
    .filter((item) => item.left < -8 || item.right > viewport.width + 8)
    .slice(0, 8);

  return {
    viewport,
    horizontalOverflow,
    bodyHeight: Math.round(body.scrollHeight),
    offenders,
  };
})()`

const desktopGutterAuditExpression = `(() => {
  const findLeafText = (root, text) =>
    Array.from(root.querySelectorAll('*')).find(
      (element) => element.childElementCount === 0 && element.textContent.trim() === text,
    );
  const rectFor = (element, text) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      text,
    };
  };
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const headerLogo = rectFor(findLeafText(header ?? document, 'R3S1D3NCY'), 'R3S1D3NCY');
  const selectCity = rectFor(findLeafText(main ?? document, 'Select city'), 'Select city');
  const minGutter = innerWidth >= 1024 ? 32 : 20;
  const maxGutter = innerWidth >= 2200 ? 112 : 96;
  const tooClose = [headerLogo, selectCity].filter((item) => item && item.left < minGutter);
  const tooFar = [headerLogo, selectCity].filter((item) => item && item.left > maxGutter);
  const misaligned =
    headerLogo && selectCity ? Math.abs(headerLogo.left - selectCity.left) > 24 : false;

  return {
    viewport: { width: innerWidth, height: innerHeight },
    minGutter,
    maxGutter,
    headerLogo,
    selectCity,
    tooClose,
    tooFar,
    misaligned,
    ok: tooClose.length === 0 && tooFar.length === 0 && !misaligned,
  };
})()`

async function runBrowserAudit() {
  await waitForServer()
  const chrome = await launchChrome()
  const findings = []

  try {
    const client = await createPage(chrome.port)

    for (const viewport of viewports) {
      await navigate(client, viewport)
      await evaluate(
        client,
        `Array.from(document.querySelectorAll('button')).find((button) => /enter now/i.test(button.textContent || ''))?.click()`,
      )
      await new Promise((resolve) => setTimeout(resolve, 6000))

      const selectorAudit = await evaluate(client, layoutAuditExpression)
      if (selectorAudit.horizontalOverflow > 2 || selectorAudit.offenders.length > 0) {
        findings.push({
          viewport: viewport.name,
          stage: 'city-selector',
          audit: selectorAudit,
        })
      }

      if (!viewport.mobile && viewport.width >= 1024) {
        const gutterAudit = await evaluate(client, desktopGutterAuditExpression)
        if (!gutterAudit.ok) {
          findings.push({
            viewport: viewport.name,
            stage: 'city-selector-gutters',
            audit: gutterAudit,
          })
        }
      }

      await evaluate(
        client,
        `Array.from(document.querySelectorAll('button')).find((button) => /london/i.test(button.textContent || ''))?.click()`,
      )
      await new Promise((resolve) => setTimeout(resolve, 2200))

      const mapAudit = await evaluate(client, layoutAuditExpression)
      if (mapAudit.horizontalOverflow > 2 || mapAudit.offenders.length > 0) {
        findings.push({
          viewport: viewport.name,
          stage: 'city-map',
          audit: mapAudit,
        })
      }
    }

    client.close()
  } finally {
    chrome.dispose()
  }

  return findings
}

const staticFindings = runStaticAudit()

if (staticFindings.length > 0) {
  console.error('Responsive audit failed:')

  for (const finding of staticFindings) {
    console.error(
      `${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`,
    )
    console.error(`  ${finding.code}`)
  }

  process.exit(1)
}

const browserFindings = await runBrowserAudit().catch((error) => [
  {
    viewport: 'browser',
    stage: 'setup',
    audit: { error: error.message },
  },
])

if (browserFindings.length > 0) {
  console.error('Responsive audit failed:')

  for (const finding of browserFindings) {
    console.error(`[${finding.viewport} / ${finding.stage}]`)
    console.error(JSON.stringify(finding.audit, null, 2))
  }

  process.exit(1)
}

console.log('Responsive audit passed.')

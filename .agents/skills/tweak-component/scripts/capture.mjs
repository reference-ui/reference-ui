#!/usr/bin/env node
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Locate repository root dynamically
export function findRepoRoot(startDir = __dirname) {
  let cur = startDir
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) return cur
    cur = path.dirname(cur)
  }
  return process.cwd()
}
const repoRoot = findRepoRoot(__dirname)

// 2. Dynamically resolve @playwright/test from matrix/lib or root
let playwright
try {
  const matrixRequire = createRequire(path.join(repoRoot, 'matrix/lib/package.json'))
  playwright = matrixRequire('@playwright/test')
} catch {
  try {
    const rootRequire = createRequire(path.join(repoRoot, 'package.json'))
    playwright = rootRequire('@playwright/test')
  } catch {
    console.error(
      'PLAYWRIGHT_NOT_FOUND: Could not resolve @playwright/test from matrix/lib or root.\n' +
      'Please run "pnpm install" or check matrix/lib dependencies.'
    )
    process.exit(1)
  }
}
const { chromium } = playwright

// 3. Extract named story/fixture exports from a book or fixture file
export function extractFixtureNames(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const startIdx = content.indexOf('export default {')
  if (startIdx !== -1) {
    let depth = 0
    let inObj = false
    let startBrace = -1
    let endBrace = -1
    for (let i = startIdx; i < content.length; i++) {
      if (content[i] === '{') {
        if (!inObj) {
          inObj = true
          startBrace = i
        }
        depth++
      } else if (content[i] === '}') {
        depth--
        if (depth === 0 && inObj) {
          endBrace = i
          break
        }
      }
    }
    if (startBrace !== -1 && endBrace !== -1) {
      const names = []
      let d = 0
      let curToken = ''
      for (let i = startBrace + 1; i < endBrace; i++) {
        const ch = content[i]
        if (ch === '{' || ch === '(' || ch === '[') {
          d++
        } else if (ch === '}' || ch === ')' || ch === ']') {
          d--
        } else if (d === 0) {
          if (ch === ':' || (ch === '(' && curToken.trim())) {
            const key = curToken.trim().replace(/^['"]|['"]$/g, '')
            if (/^[a-zA-Z0-9_$]+$/.test(key) && !names.includes(key)) {
              names.push(key)
            }
            curToken = ''
          } else if (ch === ',' || ch === '\n') {
            curToken = ''
          } else {
            curToken += ch
          }
        }
      }
      if (names.length > 0) return names
    }
  }

  // Check for named exports: export function Name or export const Name =
  const namedMatches = [...content.matchAll(/export\s+(?:function|const|var|let)\s+([A-Z][a-zA-Z0-9_$]*)/g)]
  const names = namedMatches.map(m => m[1]).filter(n => n !== 'Default' && n !== 'Meta')
  if (names.length > 0) return names

  // Fallback: single default export component
  if (/export\s+default\s+/.test(content)) {
    return ['Default']
  }

  return []
}

// 4. Resolve book/fixture file path on disk
export function resolveFixtureFilePath(componentInput) {
  const componentsDir = path.join(repoRoot, 'packages/reference-lib/src/components')
  if (!fs.existsSync(componentsDir)) {
    return null
  }

  if (componentInput.includes('/') || componentInput.endsWith('.tsx') || componentInput.endsWith('.ts')) {
    const direct = path.resolve(componentInput)
    if (fs.existsSync(direct)) return direct
    const inPkg = path.join(repoRoot, 'packages/reference-lib', componentInput)
    if (fs.existsSync(inPkg)) return inPkg
    return null
  }

  const extensions = ['.book.tsx', '.book.ts', '.fixture.tsx', '.fixture.ts']

  // Exact matches
  for (const ext of extensions) {
    const candidate1 = path.join(componentsDir, componentInput, `${componentInput}${ext}`)
    if (fs.existsSync(candidate1)) return candidate1
    const candidate2 = path.join(componentsDir, `${componentInput}${ext}`)
    if (fs.existsSync(candidate2)) return candidate2
  }

  // Case-insensitive search
  const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.toLowerCase() === componentInput.toLowerCase()) {
      if (entry.isDirectory()) {
        for (const ext of extensions) {
          const sub = path.join(componentsDir, entry.name, `${entry.name}${ext}`)
          if (fs.existsSync(sub)) return sub
        }
      }
    }
    for (const ext of extensions) {
      if (entry.name.toLowerCase() === `${componentInput.toLowerCase()}${ext}`) {
        return path.join(componentsDir, entry.name)
      }
    }
  }

  return null
}

// 5. Discover all components and books/fixtures in the repository
export function getAllComponentFixtures() {
  const componentsDir = path.join(repoRoot, 'packages/reference-lib/src/components')
  if (!fs.existsSync(componentsDir)) return {}

  const result = {}
  const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const ext of ['.book.tsx', '.book.ts', '.fixture.tsx', '.fixture.ts']) {
        const subFixture = path.join(componentsDir, entry.name, `${entry.name}${ext}`)
        if (fs.existsSync(subFixture)) {
          result[entry.name] = {
            filePath: subFixture,
            fixtures: extractFixtureNames(subFixture),
          }
          break
        }
      }
    } else {
      const match = entry.name.match(/^(.+?)\.(book|fixture)\.[jt]sx?$/)
      if (match) {
        const compName = match[1]
        const fullPath = path.join(componentsDir, entry.name)
        if (!result[compName] || entry.name.includes('.book.')) {
          result[compName] = {
            filePath: fullPath,
            fixtures: extractFixtureNames(fullPath),
          }
        }
      }
    }
  }
  return result
}

// 6. Check if Cosmos dev server is responding
export async function checkPort(port, retries = 3) {
  const hosts = ['127.0.0.1', 'localhost', '::1']
  for (let i = 0; i < retries; i++) {
    for (const host of hosts) {
      const ok = await new Promise(resolve => {
        const url = host.includes(':') ? `http://[${host}]:${port}/` : `http://${host}:${port}/`
        const req = http.get(url, { timeout: 4000 }, () => resolve(true))
        req.on('error', () => resolve(false))
        req.on('timeout', () => {
          req.destroy()
          resolve(false)
        })
      })
      if (ok) return true
    }
    await new Promise(r => setTimeout(r, 600))
  }
  return false
}

// 7. Safe screenshot with padding to preserve outlines, focus rings, and shadows
export async function capturePadded(page, targetLoc, outPath, pad = 20, viewport = { width: 1600, height: 1050 }) {
  await targetLoc.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(100)

  const box = await targetLoc.boundingBox().catch(() => null)
  if (box && box.width > 0 && box.height > 0) {
    const clip = {
      x: Math.max(0, Math.floor(box.x - pad)),
      y: Math.max(0, Math.floor(box.y - pad)),
      width: Math.min(viewport.width - Math.max(0, Math.floor(box.x - pad)), Math.ceil(box.width + pad * 2)),
      height: Math.min(viewport.height - Math.max(0, Math.floor(box.y - pad)), Math.ceil(box.height + pad * 2)),
    }
    await page.screenshot({ path: outPath, clip })
  } else {
    await targetLoc.screenshot({ path: outPath }).catch(async () => {
      await page.screenshot({ path: outPath })
    })
  }
}

// 8. Core capture runner (used both by CLI and programmatic API)
export async function runCapture(rawOpts, customScriptFn = null) {
  const defaultOutDir = path.join(repoRoot, '.reference-ui/captures')
  const opts = {
    outDir: defaultOutDir,
    wait: 2200,
    pad: 20,
    viewport: { width: 1600, height: 1050 },
    ...rawOpts,
  }

  const fixtureFilePath = resolveFixtureFilePath(opts.component)
  if (!fixtureFilePath) {
    throw new Error(`Could not find fixture file for component '${opts.component}'. Checked under packages/reference-lib/src/components/`)
  }

  const availableFixtures = extractFixtureNames(fixtureFilePath)

  // Resolve fixture name
  let selectedFixture = opts.fixture
  if (selectedFixture) {
    const matched = availableFixtures.find(f => f.toLowerCase() === selectedFixture.toLowerCase())
    if (matched) {
      selectedFixture = matched
    } else if (availableFixtures.length > 0) {
      throw new Error(`Fixture '${selectedFixture}' not found in ${path.basename(fixtureFilePath)}. Available fixtures: ${availableFixtures.join(', ')}`)
    }
  } else {
    if (availableFixtures.length > 0) {
      selectedFixture = availableFixtures[0]
      console.log(`No fixture specified. Auto-selected primary fixture: '${selectedFixture}' (available: ${availableFixtures.join(', ')})`)
    }
  }

  // Book dev server health check
  const isAlive = await checkPort(5000)
  if (!isAlive) {
    throw new Error('BOOK_NOT_RUNNING: Book dev server is not reachable on port 5000. Please run "pnpm dev:lib" locally in your terminal.')
  }

  fs.mkdirSync(opts.outDir, { recursive: true })

  // Construct Book URL parameter
  const compId = opts.component
  const storyParam = selectedFixture ? `&story=${encodeURIComponent(selectedFixture)}` : ''
  const themeParam = opts.theme ? `&theme=${encodeURIComponent(opts.theme)}` : '&theme=dark'
  const url = `http://127.0.0.1:5000/?book=${encodeURIComponent(compId)}${storyParam}${themeParam}&chrome=0`
  const baseName = opts.name || (selectedFixture ? `${opts.component}_${selectedFixture}` : opts.component)

  console.log(`Connecting to Book story: ${opts.component}${selectedFixture ? ` : ${selectedFixture}` : ''}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: opts.viewport })

  const savedFiles = []

  try {
    const navStartTime = Date.now()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

    // Wait for data-book-ready (contract: 'live' | 'updating' | 'error')
    try {
      await page.waitForFunction(
        () => {
          const ready = document.documentElement.getAttribute('data-book-ready') ||
            document.querySelector('[data-book-ready]')?.getAttribute('data-book-ready')
          return ready === 'live' || ready === 'error'
        },
        null,
        { timeout: 15000 }
      )
    } catch (e) {
      const currentReady = await page.evaluate(() =>
        document.documentElement.getAttribute('data-book-ready') ||
        document.querySelector('[data-book-ready]')?.getAttribute('data-book-ready')
      ).catch(() => null)

      if (currentReady === 'updating') {
        throw new Error('BOOK_UPDATING: waited 15s (sync in progress). Not a component failure.')
      }
      throw new Error(`BOOK_READY_TIMEOUT: waited 15s for Book to be ready. Status was: ${currentReady}`)
    }

    const finalReady = await page.evaluate(() =>
      document.documentElement.getAttribute('data-book-ready') ||
      document.querySelector('[data-book-ready]')?.getAttribute('data-book-ready')
    )

    if (finalReady === 'error') {
      const errorText = await page.locator('[data-book-error]').innerText().catch(() => 'Story threw an error')
      throw new Error(`BOOK_STORY_ERROR: ${errorText}`)
    }

    const captureReadyMs = Date.now() - navStartTime
    console.log(`[Book] Connected & live in ${captureReadyMs}ms`)

    const canvas = page.locator('[data-book-canvas]').first()
    const root = canvas

    // Compat alias: FrameLocator on iframe -> canvas/page locator in single document
    const frame = {
      locator: (selector) => page.locator(selector),
      evaluate: (fn, arg) => page.evaluate(fn, arg),
    }

    // Resolve target locator
    let targetLoc
    if (opts.target) {
      targetLoc = page.locator(opts.target).first()
    } else {
      const fieldLoc = canvas.locator('[data-reference-field]').first()
      if (await fieldLoc.count() > 0 && await fieldLoc.isVisible()) {
        targetLoc = fieldLoc
      } else {
        const toastHost = page.locator('[data-reference-toast-host]').first()
        if (await toastHost.count() > 0) {
          const fixtureRoot = toastHost.locator('xpath=../*[1]').first()
          if (await fixtureRoot.count() > 0 && await fixtureRoot.isVisible()) {
            targetLoc = fixtureRoot
          }
        }
      }
      if (!targetLoc) {
        const firstChild = canvas.locator('> *').first()
        targetLoc = (await firstChild.count() > 0 && await firstChild.isVisible()) ? firstChild : canvas
      }
    }

    // Resolve primary interactive element inside target
    let interactiveEl = targetLoc.locator('input, button, [role="slider"], [role="button"], [role="combobox"], [role="switch"], [tabindex="0"], [role="tab"]').first()
    if (await interactiveEl.count() === 0 || !(await interactiveEl.isVisible())) {
      interactiveEl = canvas.locator('input, button, [role="slider"], [role="button"], [role="combobox"], [role="switch"], [tabindex="0"], [role="tab"]').first()
    }
    if (await interactiveEl.count() === 0) {
      interactiveEl = targetLoc
    }

    // Helper: inspect computed styles of target or custom selector/locator
    async function inspectStyles(targetOrSelector) {
      let loc
      if (typeof targetOrSelector === 'string') {
        loc = frame.locator(targetOrSelector).first()
      } else if (targetOrSelector) {
        loc = targetOrSelector
      } else {
        loc = targetLoc
      }
      return loc.evaluate(el => {
        const cs = window.getComputedStyle(el)
        return {
          tag: el.tagName,
          id: el.id || undefined,
          className: el.className || undefined,
          border: cs.border,
          borderColor: cs.borderColor,
          borderWidth: cs.borderWidth,
          borderStyle: cs.borderStyle,
          borderRadius: cs.borderRadius,
          outline: cs.outline,
          outlineColor: cs.outlineColor,
          outlineWidth: cs.outlineWidth,
          outlineStyle: cs.outlineStyle,
          outlineOffset: cs.outlineOffset,
          boxShadow: cs.boxShadow,
          backgroundColor: cs.backgroundColor,
          color: cs.color,
          width: cs.width,
          height: cs.height,
        }
      })
    }

    // Helper: press Tab with native keyboard :focus-visible outline shim
    async function pressTab(customLoc) {
      await page.mouse.move(0, 0)
      await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {})
      const el = customLoc || interactiveEl
      await el.evaluate(node => {
        const btn = document.createElement('button')
        btn.id = '__capture_tab_shim__'
        btn.textContent = 'shim'
        node.parentNode.insertBefore(btn, node)
        btn.focus()
      }).catch(() => {})
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)
      await page.locator('#__capture_tab_shim__').evaluate(btn => btn?.remove()).catch(() => {})
    }

    // Helper: capture screenshot of target or custom element
    async function captureStep(label, customTarget, customPad = opts.pad) {
      const cleanLabel = String(label).trim().replace(/\s+/g, '_')
      const outPath = path.join(opts.outDir, `${baseName}_${cleanLabel}.png`)

      let snapTarget = targetLoc
      if (customTarget) {
        if (customTarget === 'full' || customTarget === 'viewport') {
          await page.screenshot({ path: outPath })
          savedFiles.push({ label, path: outPath })
          console.log(`  [captured] ${label}: ${outPath}`)
          return outPath
        } else if (typeof customTarget === 'string') {
          snapTarget = page.locator(customTarget).first()
        } else {
          snapTarget = customTarget
        }
      }

      await capturePadded(page, snapTarget, outPath, customPad, opts.viewport)
      savedFiles.push({ label, path: outPath })
      console.log(`  [captured] ${label}: ${outPath}`)
      return outPath
    }

    // Build context passed to script functions
    const scriptContext = {
      page,
      frame,
      canvas,
      root,
      target: targetLoc,
      interactive: interactiveEl,
      pressTab,
      inspectStyles,
      wait: (ms) => page.waitForTimeout(ms),
      capture: captureStep,
    }

    // 1. Script function passed programmatically or via --script / --eval
    if (customScriptFn) {
      console.log('Executing custom capture script function...')
      await customScriptFn(scriptContext)
    } else if (opts.script) {
      const scriptPath = path.resolve(process.cwd(), opts.script)
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script file not found: ${scriptPath}`)
      }
      console.log(`Executing capture script: ${opts.script}`)
      const scriptUrl = pathToFileURL(scriptPath).href
      const mod = await import(scriptUrl)
      const fn = mod.default || mod.run || (typeof mod === 'function' ? mod : null)
      if (typeof fn !== 'function') {
        throw new Error(`Script ${opts.script} must export a default async function({ page, frame, root, target, interactive, capture, pressTab, wait })`)
      }
      await fn(scriptContext)
    } else if (opts.eval) {
      console.log(`Executing inline script: ${opts.eval.trim()}`)
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const fn = new AsyncFunction('ctx', `
        const { page, frame, root, target, interactive, pressTab, inspectStyles, wait, capture } = ctx;
        return (async () => {
          ${opts.eval}
        })();
      `)
      await fn(scriptContext)
    } else if (opts.states) {
      // Legacy multi-state capture
      const stateStyles = []

      await page.mouse.move(0, 0)
      await page.waitForTimeout(150)
      await captureStep('Resting')
      if (opts.inspectStyles) {
        stateStyles.push({ state: 'Resting', ...(await inspectStyles(targetLoc)) })
      }

      if (await interactiveEl.count() > 0 && await interactiveEl.isVisible()) {
        await interactiveEl.hover().catch(() => {})
        await page.waitForTimeout(200)
        await captureStep('Hover')
        if (opts.inspectStyles) {
          stateStyles.push({ state: 'Hover', ...(await inspectStyles(targetLoc)) })
        }

        await interactiveEl.click().catch(() => {})
        await page.waitForTimeout(200)
        await captureStep('Focus (Click)')
        if (opts.inspectStyles) {
          stateStyles.push({ state: 'Focus (Click)', ...(await inspectStyles(targetLoc)) })
        }

        await pressTab(interactiveEl)
        await captureStep('Tab (Keyboard)')
        if (opts.inspectStyles) {
          stateStyles.push({ state: 'Tab (Keyboard)', ...(await inspectStyles(targetLoc)) })
        }
      }

      if (stateStyles.length > 0) {
        console.log('\n--- COMPUTED STYLES TABLE ---')
        console.log('| State | Outline | Outline Color | Border | Border Color |')
        console.log('| :--- | :--- | :--- | :--- | :--- |')
        for (const s of stateStyles) {
          console.log(`| ${s.state} | ${s.outlineWidth} ${s.outlineStyle} (offset: ${s.outlineOffset}) | ${s.outlineColor} | ${s.borderWidth} ${s.borderStyle} | ${s.borderColor} |`)
        }
      }

      const trigger = targetLoc.locator('button, [role="button"], [role="combobox"]').first()
      if (await trigger.count() > 0 && await trigger.isVisible()) {
        const hasPopup = await trigger.getAttribute('aria-haspopup').catch(() => null)
        const role = await trigger.getAttribute('role').catch(() => null)
        if (hasPopup || role === 'combobox') {
          await trigger.click().catch(() => {})
          await page.waitForTimeout(350)
          const popupLoc = page.locator('[role="dialog"], [role="listbox"], [role="menu"], [data-reference-popover], [data-reference-overlay-portal]').first()
          if (await popupLoc.count() > 0 && await popupLoc.isVisible()) {
            const fieldBox = await targetLoc.boundingBox().catch(() => null)
            const popupBox = await popupLoc.boundingBox().catch(() => null)
            if (fieldBox && popupBox) {
              const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - opts.pad)
              const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - opts.pad)
              const maxX = Math.min(opts.viewport.width, Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + opts.pad)
              const maxY = Math.min(opts.viewport.height, Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + opts.pad)
              const openPath = path.join(opts.outDir, `${baseName}_Open.png`)
              await page.screenshot({ path: openPath, clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } })
              savedFiles.push({ label: 'Open', path: openPath })
            }
          }
        }
      }
    } else {
      // Single capture mode with optional explicit actions
      await page.mouse.move(0, 0)
      if (opts.hover) {
        const hoverEl = page.locator(opts.hover).first()
        await hoverEl.hover()
        await page.waitForTimeout(200)
      }
      if (opts.click) {
        const clickEl = page.locator(opts.click).first()
        await clickEl.click()
        await page.waitForTimeout(250)
      }
      if (opts.focus) {
        await interactiveEl.focus().catch(() => {})
        await page.waitForTimeout(150)
      }
      if (opts.tab) {
        await pressTab(interactiveEl)
      }
      if (opts.type) {
        await page.keyboard.type(opts.type)
        await page.waitForTimeout(150)
      }
      if (opts.press) {
        await page.keyboard.press(opts.press)
        await page.waitForTimeout(200)
      }

      const outPath = opts.out || path.join(opts.outDir, `${baseName}.png`)
      const popupLoc = page.locator('[role="dialog"], [role="listbox"], [role="menu"], [data-reference-popover], [data-reference-overlay-portal]').first()
      if (!opts.target && await popupLoc.count() > 0 && await popupLoc.isVisible()) {
        const fieldBox = await targetLoc.boundingBox().catch(() => null)
        const popupBox = await popupLoc.boundingBox().catch(() => null)
        if (fieldBox && popupBox) {
          const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - opts.pad)
          const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - opts.pad)
          const maxX = Math.min(opts.viewport.width, Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + opts.pad)
          const maxY = Math.min(opts.viewport.height, Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + opts.pad)
          await page.screenshot({ path: outPath, clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } })
        } else {
          await capturePadded(page, targetLoc, outPath, opts.pad, opts.viewport)
        }
      } else {
        await capturePadded(page, targetLoc, outPath, opts.pad, opts.viewport)
      }
      savedFiles.push({ label: 'Captured', path: outPath })

      if (opts.inspectStyles) {
        const s = await inspectStyles(targetLoc)
        console.log('\n--- COMPUTED STYLES [target] ---')
        console.log(`Outline: ${s.outlineWidth} ${s.outlineStyle} (color: ${s.outlineColor}, offset: ${s.outlineOffset})`)
        console.log(`Border:  ${s.borderWidth} ${s.borderStyle} (color: ${s.borderColor})`)
        console.log(`Box:     ${s.width}x${s.height}, bg: ${s.backgroundColor}`)
      }
    }

    // Auto-detect Antigravity brain directory to ensure images render cleanly in chat and artifacts
    const conversationId = process.env.ANTIGRAVITY_CONVERSATION_ID
    const brainDir = conversationId
      ? path.join(os.homedir(), '.gemini/antigravity/brain', conversationId)
      : null
    const hasBrainDir = brainDir && fs.existsSync(brainDir)

    const resolvedFiles = savedFiles.map(f => {
      let embedPath = f.path
      if (hasBrainDir) {
        const destPath = path.join(brainDir, path.basename(f.path))
        try {
          fs.copyFileSync(f.path, destPath)
          embedPath = destPath
        } catch {
          // Fallback to original path if copy fails
        }
      }
      return { ...f, embedPath }
    })

    console.log('\n--- CAPTURED SCREENSHOTS ---')
    savedFiles.forEach(f => console.log(`${f.label}: ${f.path}`))
    if (hasBrainDir) {
      console.log(`(Synced to Antigravity brain: ${brainDir})`)
    }

    if (resolvedFiles.length > 1) {
      console.log('\n--- READY-TO-EMBED MARKDOWN TABLE ---')
      console.log(`| ${resolvedFiles.map(f => f.label).join(' | ')} |`)
      console.log(`| ${resolvedFiles.map(() => ':---:').join(' | ')} |`)
      console.log(`| ${resolvedFiles.map(f => `![${opts.component} ${f.label}](${f.embedPath})`).join(' | ')} |`)
    } else if (resolvedFiles.length === 1) {
      console.log('\n--- READY-TO-EMBED MARKDOWN ---')
      console.log(`![${opts.component} ${selectedFixture || ''}](${resolvedFiles[0].embedPath})`)
    }

    return {
      component: opts.component,
      fixture: selectedFixture,
      files: resolvedFiles,
    }
  } finally {
    await browser.close()
  }
}

// 9. Programmatic API for scripts to import
export async function captureFixture(component, fixture, scriptFn, options = {}) {
  return runCapture({ component, fixture, ...options }, scriptFn)
}

// 10. CLI Argument Parser
function parseArgs() {
  const args = process.argv.slice(2)
  const defaultOutDir = path.join(repoRoot, '.reference-ui/captures')
  const options = {
    component: '',
    fixture: '',
    outDir: defaultOutDir,
    name: '',
    target: '',
    eval: '',
    script: '',
    hover: '',
    click: '',
    focus: false,
    tab: false,
    press: '',
    type: '',
    states: false,
    list: false,
    wait: 2200,
    pad: 20,
    viewport: { width: 1600, height: 1050 },
  }

  const positional = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--states') {
      options.states = true
    } else if (arg === '--inspect-styles' || arg === '--styles') {
      options.inspectStyles = true
    } else if (arg === '--list' || arg === '-l') {
      options.list = true
    } else if (arg === '--focus') {
      options.focus = true
    } else if (arg === '--tab') {
      options.tab = true
    } else if ((arg === '--eval' || arg === '-e') && i + 1 < args.length) {
      options.eval = args[++i]
    } else if ((arg === '--script' || arg === '-s') && i + 1 < args.length) {
      options.script = args[++i]
    } else if (arg === '--hover' && i + 1 < args.length) {
      options.hover = args[++i]
    } else if (arg === '--click' && i + 1 < args.length) {
      options.click = args[++i]
    } else if (arg === '--press' && i + 1 < args.length) {
      options.press = args[++i]
    } else if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i]
    } else if (arg === '--target' && i + 1 < args.length) {
      options.target = args[++i]
    } else if (arg === '--out-dir' && i + 1 < args.length) {
      options.outDir = path.resolve(process.cwd(), args[++i])
    } else if (arg === '--out' && i + 1 < args.length) {
      options.out = path.resolve(process.cwd(), args[++i])
    } else if (arg === '--name' && i + 1 < args.length) {
      options.name = args[++i]
    } else if (arg === '--pad' && i + 1 < args.length) {
      options.pad = parseInt(args[++i], 10)
    } else if (arg === '--wait' && i + 1 < args.length) {
      options.wait = parseInt(args[++i], 10)
    } else if (arg === '--viewport' && i + 1 < args.length) {
      const [w, h] = args[++i].split('x').map(n => parseInt(n, 10))
      if (w && h) options.viewport = { width: w, height: h }
    } else if (!arg.startsWith('--')) {
      positional.push(arg)
    }
  }

  if (positional[0]) {
    // Handle "Slider/SingleThumb" or "Slider.SingleThumb"
    if (positional[0].includes('/') && !positional[0].endsWith('.tsx')) {
      const parts = positional[0].split('/')
      options.component = parts[0]
      options.fixture = parts.slice(1).join('/')
    } else {
      options.component = positional[0]
    }
  }
  if (positional[1] && !options.fixture) {
    options.fixture = positional[1]
  }

  return options
}

// 11. Main CLI Entrypoint
async function main() {
  const opts = parseArgs()

  // 1. If --list without component: list all components and fixtures in the repo
  if (opts.list && !opts.component) {
    const all = getAllComponentFixtures()
    console.log('\nAvailable components and fixtures in @reference-ui/lib:\n')
    for (const [comp, info] of Object.entries(all).sort(([a], [b]) => a.localeCompare(b))) {
      const fxList = info.fixtures.length > 0 ? info.fixtures.join(', ') : '(default)'
      console.log(`  ${comp.padEnd(16)} -> [ ${fxList} ]`)
    }
    console.log('\nUsage Examples:')
    console.log('  pnpm capture Slider SingleThumb')
    console.log('  pnpm capture Slider SingleThumb -e "await capture(\'resting\'); await frame.locator(\'[role=slider]\').hover(); await capture(\'hover\');"')
    console.log('  pnpm capture Tabs Horizontal --script ./my-scenario.mjs')
    process.exit(0)
  }

  // 2. If no component specified at all, show friendly help and discovery
  if (!opts.component) {
    const all = getAllComponentFixtures()
    const compNames = Object.keys(all).sort()
    console.log('Usage: pnpm capture <Component> [Fixture] [options]')
    console.log('\nScripting Options:')
    console.log('  -e, --eval <code>     Run inline async script with { page, frame, root, target, interactive, capture, pressTab, inspectStyles, wait }')
    console.log('  -s, --script <file>   Run script file exporting default async fn')
    console.log('  -l, --list            List available fixtures for component (or all components if omitted)')
    console.log('  --states              Multi-state capture: Resting, Hover, Focus (click), Tab, Open')
    console.log('  --inspect-styles      Dump computed styles (outline, border, box-model) table')
    console.log('  --target <css>        CSS selector for component bounding box')
    console.log('  --pad <px>            Outline-safe bounding box padding (default: 20)')
    console.log('\nAvailable components in @reference-ui/lib:')
    console.log(`  ${compNames.join(', ')}`)
    console.log('\nRun "pnpm capture --list" to view all components with their fixture names.')
    process.exit(0)
  }

  // 3. If component specified with --list: list fixtures for this component
  const fixtureFilePath = resolveFixtureFilePath(opts.component)
  if (!fixtureFilePath) {
    console.error(`ERROR: Could not find fixture file for component '${opts.component}'.`)
    console.error('Checked under packages/reference-lib/src/components/')
    process.exit(1)
  }

  const availableFixtures = extractFixtureNames(fixtureFilePath)
  if (opts.list) {
    console.log(`\nAvailable fixtures for ${opts.component} (${path.relative(repoRoot, fixtureFilePath)}):`)
    if (availableFixtures.length === 0) {
      console.log('  (single default export)')
    } else {
      availableFixtures.forEach(f => console.log(`  - ${f}`))
    }
    process.exit(0)
  }

  try {
    await runCapture(opts)
  } catch (err) {
    console.error('Capture error:', err.message)
    process.exit(1)
  }
}

// Only invoke main when run directly from the CLI
const isDirectRun = Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
if (isDirectRun) {
  main()
}

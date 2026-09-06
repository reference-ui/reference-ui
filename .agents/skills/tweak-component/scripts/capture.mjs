#!/usr/bin/env node
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Locate repository root dynamically
function findRepoRoot(startDir) {
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

// 3. Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const defaultOutDir = path.join(repoRoot, '.reference-ui/captures')
  const options = {
    component: '',
    fixture: '',
    outDir: defaultOutDir,
    name: '',
    target: '',
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
    viewport: { width: 1000, height: 700 },
  }

  const positional = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--states') {
      options.states = true
    } else if (arg === '--list') {
      options.list = true
    } else if (arg === '--focus') {
      options.focus = true
    } else if (arg === '--tab') {
      options.tab = true
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

  if (positional[0]) options.component = positional[0]
  if (positional[1]) options.fixture = positional[1]

  return options
}

// 4. Resolve fixture file path on disk
function resolveFixtureFilePath(componentInput) {
  const componentsDir = path.join(repoRoot, 'packages/reference-lib/src/components')
  if (!fs.existsSync(componentsDir)) {
    return null
  }

  if (componentInput.includes('/') || componentInput.endsWith('.tsx')) {
    const direct = path.resolve(componentInput)
    if (fs.existsSync(direct)) return direct
    const inPkg = path.join(repoRoot, 'packages/reference-lib', componentInput)
    if (fs.existsSync(inPkg)) return inPkg
    return null
  }

  // Exact matches
  const candidate1 = path.join(componentsDir, componentInput, `${componentInput}.fixture.tsx`)
  if (fs.existsSync(candidate1)) return candidate1

  const candidate2 = path.join(componentsDir, `${componentInput}.fixture.tsx`)
  if (fs.existsSync(candidate2)) return candidate2

  // Case-insensitive search
  const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.toLowerCase() === componentInput.toLowerCase()) {
      if (entry.isDirectory()) {
        const sub = path.join(componentsDir, entry.name, `${entry.name}.fixture.tsx`)
        if (fs.existsSync(sub)) return sub
      }
    }
    if (entry.name.toLowerCase() === `${componentInput.toLowerCase()}.fixture.tsx`) {
      return path.join(componentsDir, entry.name)
    }
  }

  return null
}

// 5. Parse fixture file to extract named fixture exports
function extractFixtureNames(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const startIdx = content.indexOf('export default {')
  if (startIdx === -1) return []

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
  if (startBrace === -1 || endBrace === -1) return []

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
  return names
}

// 6. Check if Cosmos dev server is responding
async function checkPort(port, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const ok = await new Promise(resolve => {
      const req = http.get(`http://localhost:${port}/`, { timeout: 2500 }, () => resolve(true))
      req.on('error', () => resolve(false))
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
    })
    if (ok) return true
    await new Promise(r => setTimeout(r, 600))
  }
  return false
}

// 7. Safe screenshot with padding to preserve outlines, focus rings, and shadows
async function capturePadded(page, targetLoc, outPath, pad = 20, viewport) {
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

// 8. Main execution
async function main() {
  const opts = parseArgs()

  if (!opts.component) {
    console.error('Usage: pnpm capture <Component> [Fixture] [options]')
    console.error('Options:')
    console.error('  --states          Capture Resting, Hover, Focus (click), and Tab (keyboard focus-visible)')
    console.error('  --list            List available fixtures for component')
    console.error('  --target <css>    CSS selector for component bounding box')
    console.error('  --hover <css>     Hover specific element')
    console.error('  --click <css>     Click specific element')
    console.error('  --focus           Focus primary interactive element')
    console.error('  --tab             Tab into primary interactive element (keyboard focus-visible)')
    console.error('  --out-dir <dir>   Output directory (default: .reference-ui/captures)')
    console.error('  --pad <px>        Padding around bounding box (default: 20)')
    process.exit(1)
  }

  const fixtureFilePath = resolveFixtureFilePath(opts.component)
  if (!fixtureFilePath) {
    console.error(`ERROR: Could not find fixture file for component '${opts.component}'.`)
    console.error('Checked under packages/reference-lib/src/components/')
    process.exit(1)
  }

  const availableFixtures = extractFixtureNames(fixtureFilePath)

  if (opts.list) {
    console.log(`\nAvailable fixtures in ${path.relative(repoRoot, fixtureFilePath)}:`)
    if (availableFixtures.length === 0) {
      console.log('  (single default export)')
    } else {
      availableFixtures.forEach(f => console.log(`  - ${f}`))
    }
    process.exit(0)
  }

  // Resolve fixture name
  let selectedFixture = opts.fixture
  if (selectedFixture) {
    // Case-insensitive match if available
    const matched = availableFixtures.find(f => f.toLowerCase() === selectedFixture.toLowerCase())
    if (matched) {
      selectedFixture = matched
    } else if (availableFixtures.length > 0) {
      console.error(`ERROR: Fixture '${selectedFixture}' not found in ${path.basename(fixtureFilePath)}.`)
      console.error(`Available fixtures: ${availableFixtures.join(', ')}`)
      process.exit(1)
    }
  } else {
    // Auto-select first fixture if named exports exist
    if (availableFixtures.length > 0) {
      selectedFixture = availableFixtures[0]
      console.log(`No fixture specified. Auto-selected primary fixture: '${selectedFixture}' (available: ${availableFixtures.join(', ')})`)
    }
  }

  // Cosmos dev server health check
  const isAlive = await checkPort(5000)
  if (!isAlive) {
    console.error('\nCOSMOS_NOT_RUNNING: Cosmos playground is not reachable on port 5000.')
    console.error('Please run "pnpm dev:lib" locally in your terminal before capturing fixtures.\n')
    process.exit(1)
  }

  fs.mkdirSync(opts.outDir, { recursive: true })

  // Construct Cosmos URL parameter
  const relFixturePath = path.relative(path.join(repoRoot, 'packages/reference-lib'), fixtureFilePath)
  const fixtureObj = { path: relFixturePath }
  if (selectedFixture) {
    fixtureObj.name = selectedFixture
  }

  const fixtureParam = JSON.stringify(fixtureObj)
  const url = `http://localhost:5000/?fixture=${encodeURIComponent(fixtureParam)}`
  const baseName = opts.name || (selectedFixture ? `${opts.component}_${selectedFixture}` : opts.component)

  console.log(`Connecting to Cosmos fixture: ${JSON.stringify(fixtureObj)}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: opts.viewport })

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 12000 })
    await page.waitForTimeout(opts.wait)

    const frame = page.frameLocator('iframe')
    const root = frame.locator('#root')
    await root.waitFor({ timeout: 6000 }).catch(() => {})

    // 1. Resolve target locator
    let targetLoc
    if (opts.target) {
      targetLoc = frame.locator(opts.target).first()
    } else {
      const fieldLoc = frame.locator('[data-reference-field]').first()
      if (await fieldLoc.count() > 0 && await fieldLoc.isVisible()) {
        targetLoc = fieldLoc
      } else {
        const toastHost = frame.locator('[data-reference-toast-host]').first()
        if (await toastHost.count() > 0) {
          const fixtureRoot = toastHost.locator('xpath=../*[1]').first()
          if (await fixtureRoot.count() > 0 && await fixtureRoot.isVisible()) {
            targetLoc = fixtureRoot
          }
        }
      }
      if (!targetLoc) {
        const firstChild = root.locator('> *').first()
        targetLoc = (await firstChild.count() > 0 && await firstChild.isVisible()) ? firstChild : root
      }
    }

    // 2. Resolve primary interactive element inside target
    let interactiveEl = targetLoc.locator('input, button, [role="slider"], [role="button"], [role="combobox"], [role="switch"], [tabindex="0"], [role="tab"]').first()
    if (await interactiveEl.count() === 0 || !(await interactiveEl.isVisible())) {
      interactiveEl = frame.locator('input, button, [role="slider"], [role="button"], [role="combobox"], [role="switch"], [tabindex="0"], [role="tab"]').first()
    }
    if (await interactiveEl.count() === 0) {
      interactiveEl = targetLoc
    }

    const savedFiles = []

    if (opts.states) {
      // --- STATE 1: Resting (mouse at 0, 0) ---
      await page.mouse.move(0, 0)
      await page.waitForTimeout(200)
      const restingPath = path.join(opts.outDir, `${baseName}_resting.png`)
      await capturePadded(page, targetLoc, restingPath, opts.pad, opts.viewport)
      savedFiles.push({ label: 'Resting', path: restingPath })

      // --- STATE 2: Hover ---
      if (await interactiveEl.count() > 0 && await interactiveEl.isVisible()) {
        await interactiveEl.hover().catch(() => {})
        await page.waitForTimeout(250)
        const hoverPath = path.join(opts.outDir, `${baseName}_hover.png`)
        await capturePadded(page, targetLoc, hoverPath, opts.pad, opts.viewport)
        savedFiles.push({ label: 'Hover', path: hoverPath })
      }

      // --- STATE 3: Focus (Pointer Click) ---
      if (await interactiveEl.count() > 0 && await interactiveEl.isVisible()) {
        await interactiveEl.click().catch(() => {})
        await page.waitForTimeout(250)
        const focusPath = path.join(opts.outDir, `${baseName}_focus.png`)
        await capturePadded(page, targetLoc, focusPath, opts.pad, opts.viewport)
        savedFiles.push({ label: 'Focus (Click)', path: focusPath })
      }

      // --- STATE 4: Tab (Keyboard Focus-Visible) ---
      if (await interactiveEl.count() > 0 && await interactiveEl.isVisible()) {
        await page.mouse.move(0, 0)
        // Reset focus cleanly
        await frame.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {})
        // Insert temporary preceding button inside iframe to trigger native keyboard modality via Tab
        await interactiveEl.evaluate(el => {
          const btn = document.createElement('button')
          btn.id = '__capture_tab_shim__'
          btn.textContent = 'shim'
          el.parentNode.insertBefore(btn, el)
          btn.focus()
        }).catch(() => {})

        await page.keyboard.press('Tab')
        await page.waitForTimeout(250)
        await frame.locator('#__capture_tab_shim__').evaluate(el => el?.remove()).catch(() => {})

        const tabPath = path.join(opts.outDir, `${baseName}_tab.png`)
        await capturePadded(page, targetLoc, tabPath, opts.pad, opts.viewport)
        savedFiles.push({ label: 'Tab (Keyboard)', path: tabPath })
      }

      // --- STATE 5: Open (Popups / Dialogs / Menus) ---
      const trigger = targetLoc.locator('button, [role="button"], [role="combobox"]').first()
      if (await trigger.count() > 0 && await trigger.isVisible()) {
        const hasPopup = await trigger.getAttribute('aria-haspopup').catch(() => null)
        const role = await trigger.getAttribute('role').catch(() => null)
        if (hasPopup || role === 'combobox') {
          await trigger.click().catch(() => {})
          await page.waitForTimeout(350)

          const popupLoc = frame.locator('[role="dialog"], [role="listbox"], [role="menu"], [data-reference-popover]').first()
          if (await popupLoc.count() > 0 && await popupLoc.isVisible()) {
            const fieldBox = await targetLoc.boundingBox().catch(() => null)
            const popupBox = await popupLoc.boundingBox().catch(() => null)

            const openPath = path.join(opts.outDir, `${baseName}_open.png`)
            if (fieldBox && popupBox) {
              const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - opts.pad)
              const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - opts.pad)
              const maxX = Math.min(opts.viewport.width, Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + opts.pad)
              const maxY = Math.min(opts.viewport.height, Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + opts.pad)

              await page.screenshot({
                path: openPath,
                clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
              })
              savedFiles.push({ label: 'Open', path: openPath })
            }
          }
        }
      }
    } else {
      // Single capture mode with optional explicit actions
      await page.mouse.move(0, 0)
      if (opts.hover) {
        const hoverEl = frame.locator(opts.hover).first()
        await hoverEl.hover()
        await page.waitForTimeout(250)
      }
      if (opts.click) {
        const clickEl = frame.locator(opts.click).first()
        await clickEl.click()
        await page.waitForTimeout(300)
      }
      if (opts.focus) {
        await interactiveEl.focus().catch(() => {})
        await page.waitForTimeout(200)
      }
      if (opts.tab) {
        await interactiveEl.evaluate(el => {
          const btn = document.createElement('button')
          btn.id = '__capture_tab_shim__'
          btn.textContent = 'shim'
          el.parentNode.insertBefore(btn, el)
          btn.focus()
        }).catch(() => {})
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)
        await frame.locator('#__capture_tab_shim__').evaluate(el => el?.remove()).catch(() => {})
      }
      if (opts.type) {
        await page.keyboard.type(opts.type)
        await page.waitForTimeout(200)
      }
      if (opts.press) {
        await page.keyboard.press(opts.press)
        await page.waitForTimeout(250)
      }

      const outPath = opts.out || path.join(opts.outDir, `${baseName}.png`)
      const popupLoc = frame.locator('[role="dialog"], [role="listbox"]').first()
      if (!opts.target && await popupLoc.count() > 0 && await popupLoc.isVisible()) {
        const fieldBox = await targetLoc.boundingBox().catch(() => null)
        const popupBox = await popupLoc.boundingBox().catch(() => null)
        if (fieldBox && popupBox) {
          const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - opts.pad)
          const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - opts.pad)
          const maxX = Math.min(opts.viewport.width, Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + opts.pad)
          const maxY = Math.min(opts.viewport.height, Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + opts.pad)
          await page.screenshot({
            path: outPath,
            clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          })
        } else {
          await capturePadded(page, targetLoc, outPath, opts.pad, opts.viewport)
        }
      } else {
        await capturePadded(page, targetLoc, outPath, opts.pad, opts.viewport)
      }
      savedFiles.push({ label: 'Captured', path: outPath })
    }

    console.log('\n--- CAPTURED SCREENSHOTS ---')
    savedFiles.forEach(f => console.log(`${f.label}: ${f.path}`))

    if (savedFiles.length > 1) {
      console.log('\n--- READY-TO-EMBED MARKDOWN TABLE ---')
      console.log(`| ${savedFiles.map(f => f.label).join(' | ')} |`)
      console.log(`| ${savedFiles.map(() => ':---:').join(' | ')} |`)
      console.log(`| ${savedFiles.map(f => `![${opts.component} ${f.label}](${f.path})`).join(' | ')} |`)
    } else if (savedFiles.length === 1) {
      console.log('\n--- READY-TO-EMBED MARKDOWN ---')
      console.log(`![${opts.component} ${selectedFixture || ''}](${savedFiles[0].path})`)
    }
  } catch (err) {
    console.error('Capture error:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()

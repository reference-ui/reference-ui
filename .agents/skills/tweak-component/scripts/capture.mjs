#!/usr/bin/env node
import playwright from '/Users/ryn/Developer/reference-ui/matrix/lib/node_modules/@playwright/test/index.js'
const { chromium } = playwright
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    component: 'DateField',
    fixture: 'FoldedPicker',
    outDir: '/tmp',
    name: '',
    target: '',
    hover: '',
    click: '',
    press: '',
    type: '',
    states: false,
    wait: 2500,
    viewport: { width: 1000, height: 700 },
  }

  const positional = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--states') {
      options.states = true
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
      options.outDir = args[++i]
    } else if (arg === '--out' && i + 1 < args.length) {
      options.out = args[++i]
    } else if (arg === '--name' && i + 1 < args.length) {
      options.name = args[++i]
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
  if (!options.name) options.name = `${options.component}_${options.fixture}`

  return options
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 1500 }, (res) => resolve(true))
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

async function main() {
  const opts = parseArgs()
  const isAlive = await checkPort(5000)
  if (!isAlive) {
    console.error('COSMOS_NOT_RUNNING: Cosmos playground is not reachable on port 5000. Please prompt user to run "pnpm dev:lib" locally.')
    process.exit(1)
  }

  fs.mkdirSync(opts.outDir, { recursive: true })

  const fixtureParam = JSON.stringify({
    path: `src/components/${opts.component}/${opts.component}.fixture.tsx`,
    name: opts.fixture
  })
  const url = `http://localhost:5000/?fixture=${encodeURIComponent(fixtureParam)}`
  console.log(`Connecting to Cosmos fixture: ${opts.component} -> ${opts.fixture}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: opts.viewport })

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 10000 })
    await page.waitForTimeout(opts.wait)

    const frame = page.frameLocator('iframe')
    const root = frame.locator('#root')
    await root.waitFor({ timeout: 5000 }).catch(() => {})

    // Determine target locator inside iframe
    let targetLoc
    if (opts.target) {
      targetLoc = frame.locator(opts.target).first()
    } else {
      const fieldLoc = frame.locator('[data-reference-field]').first()
      if (await fieldLoc.count() > 0 && await fieldLoc.isVisible()) {
        targetLoc = fieldLoc
      } else {
        const firstChild = root.locator('> *').first()
        if (await firstChild.count() > 0 && await firstChild.isVisible()) {
          targetLoc = firstChild
        } else {
          targetLoc = root
        }
      }
    }

    const savedFiles = []

    if (opts.states) {
      // 1. Resting state: move mouse away to (0, 0)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(200)
      const restingPath = path.join(opts.outDir, `${opts.name}_resting.png`)
      await targetLoc.screenshot({ path: restingPath })
      savedFiles.push({ label: 'Resting', path: restingPath })

      // Locate trigger button: prioritize <button> element inside target
      let trigger = targetLoc.locator('button').first()
      if (await trigger.count() === 0) {
        trigger = frame.locator('button').first()
      }
      if (await trigger.count() === 0) {
        trigger = targetLoc.locator('[role="button"]').first()
      }

      if (await trigger.count() > 0 && await trigger.isVisible()) {
        // 2. Hover state
        await trigger.hover()
        await page.waitForTimeout(300)
        const hoverPath = path.join(opts.outDir, `${opts.name}_hover.png`)
        await targetLoc.screenshot({ path: hoverPath })
        savedFiles.push({ label: 'Hover', path: hoverPath })

        // 3. Open state: activate trigger or open combobox/dropdown
        const hasPopup = await trigger.getAttribute('aria-haspopup').catch(() => null)
        if (hasPopup) {
          await trigger.click()
          await page.waitForTimeout(400)
        } else {
          // If not aria-haspopup button, try clicking field and pressing ArrowDown
          await targetLoc.click()
          await page.keyboard.press('ArrowDown')
          await page.waitForTimeout(400)
        }

        const openPath = path.join(opts.outDir, `${opts.name}_open.png`)
        const popupLoc = frame.locator('[role="dialog"], [role="listbox"]').first()
        if (await popupLoc.count() > 0 && await popupLoc.isVisible()) {
          const fieldBox = await targetLoc.boundingBox().catch(() => null)
          const popupBox = await popupLoc.boundingBox().catch(() => null)

          if (fieldBox && popupBox) {
            const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - 16)
            const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - 16)
            const maxX = Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + 16
            const maxY = Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + 16

            await page.screenshot({
              path: openPath,
              clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
            })
            savedFiles.push({ label: 'Open', path: openPath })
          } else {
            await root.screenshot({ path: openPath })
            savedFiles.push({ label: 'Open', path: openPath })
          }
        }
      }
    } else {
      // Single capture mode with optional explicit actions
      await page.mouse.move(0, 0)
      if (opts.hover) {
        const hoverEl = frame.locator(opts.hover).first()
        await hoverEl.hover()
        await page.waitForTimeout(300)
      }
      if (opts.click) {
        const clickEl = frame.locator(opts.click).first()
        await clickEl.click()
        await page.waitForTimeout(400)
      }
      if (opts.type) {
        await page.keyboard.type(opts.type)
        await page.waitForTimeout(200)
      }
      if (opts.press) {
        await page.keyboard.press(opts.press)
        await page.waitForTimeout(300)
      }

      const outPath = opts.out || path.join(opts.outDir, `${opts.name}.png`)
      const popupLoc = frame.locator('[role="dialog"], [role="listbox"]').first()
      if (await popupLoc.count() > 0 && await popupLoc.isVisible()) {
        const fieldBox = await targetLoc.boundingBox().catch(() => null)
        const popupBox = await popupLoc.boundingBox().catch(() => null)
        if (fieldBox && popupBox) {
          const minX = Math.max(0, Math.min(fieldBox.x, popupBox.x) - 16)
          const minY = Math.max(0, Math.min(fieldBox.y, popupBox.y) - 16)
          const maxX = Math.max(fieldBox.x + fieldBox.width, popupBox.x + popupBox.width) + 16
          const maxY = Math.max(fieldBox.y + fieldBox.height, popupBox.y + popupBox.height) + 16
          await page.screenshot({
            path: outPath,
            clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
          })
        } else {
          await root.screenshot({ path: outPath })
        }
      } else {
        await targetLoc.screenshot({ path: outPath })
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
      console.log(`![${opts.component} ${opts.fixture}](${savedFiles[0].path})`)
    }
  } catch (err) {
    console.error('Capture error:', err.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()

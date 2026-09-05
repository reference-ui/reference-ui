#!/usr/bin/env node
import playwright from '/Users/ryn/Developer/reference-ui/matrix/lib/node_modules/@playwright/test/index.js'
const { chromium } = playwright
import http from 'node:http'

const [componentName = 'DateField', fixtureName = 'Atomic', outputPath = '/tmp/fixture.png'] = process.argv.slice(2)

// Quick ping to check if port 5000 is alive
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 1500 }, (res) => {
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

const isAlive = await checkPort(5000)
if (!isAlive) {
  console.error('COSMOS_NOT_RUNNING: Cosmos playground is not reachable on port 5000. Please prompt user to run "pnpm dev:lib" locally.')
  process.exit(1)
}

const fixtureParam = JSON.stringify({
  path: `src/components/${componentName}/${componentName}.fixture.tsx`,
  name: fixtureName
})
const url = `http://localhost:5000/?fixture=${encodeURIComponent(fixtureParam)}`

console.log(`Connecting to Cosmos fixture at: ${url}`)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

try {
  await page.goto(url, { waitUntil: 'load', timeout: 10000 })
  await page.waitForTimeout(2500) // Allow Cosmos postMessage iframe handshake

  const frame = page.frameLocator('iframe')
  const root = frame.locator('#root')
  await root.waitFor({ timeout: 5000 }).catch(() => {})

  const innerText = await root.innerText().catch(() => 'No text found')
  console.log(`--- RENDERED TEXT ---\n${innerText}\n---------------------`)

  await root.screenshot({ path: outputPath })
  console.log(`SCREENSHOT_SAVED: ${outputPath}`)
} catch (err) {
  console.error('Capture failed:', err.message)
  process.exit(1)
} finally {
  await browser.close()
}

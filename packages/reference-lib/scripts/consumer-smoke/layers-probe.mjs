// layers-probe.mjs — the paint half of the layered-override pass (run.mjs layers step). Takes the scaffold's dev
// server URL and the override hex pair as JSON. Opens three pages, each rendering a lib primitive Button in light
// and dark: the extendSystem override sheet, the plain-layers control sheet, and lib's own prebuilt styles. Reads
// each Button's computed background and its stamps, and fails on any page error or console error. Emits one
// PASS or FAIL line per check and exits 1 on any failure.
import { chromium } from '@playwright/test'

const [base, expectJson] = process.argv.slice(2)
if (!base || !expectJson) {
  console.error('usage: layers-probe.mjs <base-url> <{"light":"#hex","dark":"#hex"}>')
  process.exit(2)
}
const expect = JSON.parse(expectJson)

const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
  if (!ok) failures.push(name)
}

// Computed styles report colours as rgb(), so the hex override is converted to the same form before comparing.
function rgbOf(hex) {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

// One page's verdict: the console and page errors it raised, plus both Buttons' computed paint and stamps.
async function probePage(browser, name) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error?.message ?? error)}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  await page.goto(new URL(`${name}.html`, base).href, { waitUntil: 'load' })
  await page.waitForSelector('#dark', { timeout: 60000 })
  const paint = await page.evaluate(() => {
    const read = (id) => {
      const el = document.getElementById(id)
      if (!el) return null
      return {
        background: getComputedStyle(el).backgroundColor,
        layer: el.getAttribute('data-layer'),
        mode: el.getAttribute('data-color-mode'),
      }
    }
    return { light: read('light'), dark: read('dark') }
  })
  await context.close()
  return { paint, errors }
}

const browser = await chromium.launch()
try {
  const override = await probePage(browser, 'override')
  const control = await probePage(browser, 'control')
  const libown = await probePage(browser, 'libown')
  const overrideLight = rgbOf(expect.light)
  const overrideDark = rgbOf(expect.dark)

  check(
    'override: light Button paints the extendSystem light value',
    override.paint.light?.background === overrideLight,
    `got ${override.paint.light?.background}, want ${overrideLight}`,
  )
  check('override: dark Button paints the extendSystem dark value', override.paint.dark?.background === overrideDark,
    `got ${override.paint.dark?.background}, want ${overrideDark}`)
  check('override: both Buttons carry the data-layer="reference-ui" stamp',
    override.paint.light?.layer === 'reference-ui' && override.paint.dark?.layer === 'reference-ui',
    `got ${override.paint.light?.layer} and ${override.paint.dark?.layer}`)
  check('override: the dark Button is stamped data-color-mode="dark" and the light one "light"',
    override.paint.dark?.mode === 'dark' && override.paint.light?.mode === 'light',
    `got ${override.paint.dark?.mode} and ${override.paint.light?.mode}`)
  check(
    "control: light Button paints lib's default, not the override",
    control.paint.light?.background === libown.paint.light?.background &&
      control.paint.light?.background !== overrideLight,
    `control ${control.paint.light?.background}, lib ${libown.paint.light?.background}`,
  )
  check('control: dark Button paints lib\'s default, not the override',
    control.paint.dark?.background === libown.paint.dark?.background && control.paint.dark?.background !== overrideDark,
    `control ${control.paint.dark?.background}, lib ${libown.paint.dark?.background}`)
  check('lib own styles: Buttons paint a real colour under the reference-ui stamp',
    libown.paint.light?.layer === 'reference-ui' && libown.paint.light?.background !== 'rgba(0, 0, 0, 0)' &&
      libown.paint.dark?.background !== 'rgba(0, 0, 0, 0)',
    `light ${libown.paint.light?.background}, dark ${libown.paint.dark?.background}`)
  for (const [name, result] of [['override', override], ['control', control], ['libown', libown]]) {
    check(`${name}: zero page or console errors`, result.errors.length === 0, result.errors.slice(0, 3).join(' | '))
  }
  console.log(`measured: override light ${override.paint.light?.background} dark ${override.paint.dark?.background}; ` +
    `control light ${control.paint.light?.background} dark ${control.paint.dark?.background}; ` +
    `lib light ${libown.paint.light?.background} dark ${libown.paint.dark?.background}`)
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.error(`layers probe failed (${failures.length} checks): ${failures.join('; ')}`)
  process.exit(1)
}

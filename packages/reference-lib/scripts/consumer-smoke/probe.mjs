// W-31 probe: drives the scaffolded bare-Vite consumer app in dev mode
// (dev React is REQUIRED: B-03 element.ref noise and the Splitter dev
// diagnostics only fire outside production builds).
//
// Asserts, in order: every barrel component mounted (each mount isolated by
// an error boundary that renders MOUNT-FAILED), the six B-11 stale-dist
// behaviors of CURRENT src, zero unexpected console errors/pageerrors, and
// zero `no compiled class` paint-nothing warnings (B-10 signature).
//
// Two intentional-error categories exist. (1) allowlisted: the B-11
// degenerate Splitter fails fast with `[Reference UI Splitter]` by design;
// the probe asserts that diagnostic fired AND excludes it from the
// zero-errors gate. (2) known-open: errors matching the B-03 element.ref
// signature are counted separately — the gate still exits 1 (W-31 says it
// must fail on B-03 noise) but names the owner instead of burying it.
import { chromium } from '@playwright/test'

const url = process.argv[2]
if (!url) {
  console.error('usage: probe.mjs <url>')
  process.exit(2)
}

const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
  if (!ok) failures.push(name)
}

const errors = []
const warnings = []
const pageerrors = []

// A probe crash (timeout, missing fixture) must not swallow the console
// evidence collected so far — print it before dying.
process.on('uncaughtException', (error) => {
  console.error(`PROBE-CRASH: ${String(error.message).slice(0, 900)}`)
  console.error(`console errors so far (${errors.length}):`)
  for (const text of errors.slice(0, 8)) console.error(`  err: ${text.slice(0, 250)}`)
  console.error(`pageerrors so far (${pageerrors.length}):`)
  for (const text of pageerrors.slice(0, 8)) console.error(`  pageerr: ${text.slice(0, 250)}`)
  process.exit(2)
})

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (message) => {
  const text = message.text()
  const location = message.location()
  const where =
    location && location.url ? ` [at ${(location.url.split('/').pop() ?? '')}:${location.lineNumber ?? '?'}]` : ''
  if (message.type() === 'error') errors.push(`${text}${where}`)
  if (message.type() === 'warning') warnings.push(`${text}${where}`)
})
page.on('pageerror', (error) => pageerrors.push(String(error?.message ?? error)))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__SMOKE_MOUNTED__ === true, null, { timeout: 60000 })
await page.waitForTimeout(1500)

// --- mount-all -----------------------------------------------------------
const mounts = [
  ['referencelibrary', 'text=consumer smoke'],
  ['accordion', 'text=First'],
  ['calendar', '[data-testid="mount-calendar"] [role="grid"]'],
  ['collapsible', 'text=toggle'],
  ['combobox', '[data-testid="mount-combobox"] input'],
  ['datefield', '[data-testid="mount-datefield"] input'],
  ['field', '[data-testid="mount-field"] input'],
  ['focuslock', 'text=lock first'],
  ['listbox', '[data-testid="mount-listbox"] [role="option"]'],
  ['menu', 'text=menu trigger'],
  ['numberfield', '[data-testid="mount-numberfield"] input'],
  ['overlay', 'text=open smoke overlay'],
  ['popover', 'text=popover trigger'],
  ['portal', 'text=portalled'],
  ['presence', 'text=present content'],
  ['rovingfocus', 'text=A'],
  ['slider', '[data-testid="mount-slider"] [role="slider"]'],
  ['slot', 'text=visible'],
  ['splitter', 'text=panel zero'],
  ['switch', '[data-testid="mount-switch"] [role="switch"]'],
  ['tabs', 'text=panel one'],
  ['toast', 'text=smoke-toast-marker'],
  ['tooltip', 'text=hover me'],
  ['tree', 'text=Branch'],
  ['icon', '[data-testid="mount-icon"] svg'],
  ['primitives', 'text=primitive button'],
]
for (const [id, selector] of mounts) {
  const count = await page.locator(selector).count()
  check(`mount-${id}`, count > 0, `selector ${selector} matched ${count}`)
}
check('mount-announcer', (await page.locator('[data-reference-announcer]').count()) >= 2)
const referenceText = await page.locator('[data-testid="mount-reference"]').innerText()
check(
  'mount-reference',
  referenceText.trim().length > 0 && !referenceText.includes('MOUNT-FAILED'),
  referenceText.slice(0, 160),
)
const mountFailedCount = await page.locator('text=MOUNT-FAILED').count()
if (mountFailedCount > 0) {
  const texts = await page.locator('text=MOUNT-FAILED').allInnerTexts()
  for (const text of texts) console.log(`  mount failure: ${text.slice(0, 300)}`)
}
check('no-mount-failures', mountFailedCount === 0)

// Overlay open/close round-trip (explicit buttons: no Escape semantics, no
// backdrop races with later clicks).
await page.locator('[data-testid="smoke-overlay-open"]').click()
try {
  await page.locator('[data-testid="smoke-overlay-content"]').waitFor({ state: 'visible' })
  check('overlay-open', true)
} catch {
  check('overlay-open', false, 'overlay content never became visible')
}
await page.locator('[data-testid="smoke-overlay-close"]').click()
try {
  await page.locator('[data-testid="smoke-overlay-content"]').waitFor({ state: 'hidden' })
  check('overlay-dismiss', true)
} catch {
  check('overlay-dismiss', false, 'overlay content still visible after close')
}

// --- B-11 stale-dist behaviors (current src) ------------------------------
check(
  'b11-tree-autodetect',
  (await page.locator('#b11-parent[aria-expanded]').count()) === 1,
  'parent without isBranch must take the branch path (aria-expanded present)',
)

const describeActive = () => {
  const el = document.activeElement
  return el ? el.tagName + ' testid=' + (el.getAttribute('data-testid') || '(none)') : '(none)'
}
// B-11 N1b: src is headers-only — arrows from the NESTED trigger neither
// hijack nor escape (focus stays put); arrows from a HEADER rove to the
// next header (mirrors the nav crew's verify.mjs header check).
await page.locator('[data-testid="b11-nested-collapsible-trigger"]').click()
await page.waitForTimeout(300)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(300)
const nestedFocus = await page.evaluate(describeActive)
check(
  'b11-accordion-arrows-no-hijack',
  nestedFocus.includes('testid=b11-nested-collapsible-trigger'),
  `focus on ${nestedFocus}`,
)
await page.locator('[data-testid="b11-acc-trigger-0"]').click()
await page.waitForTimeout(300)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(300)
const headerFocus = await page.evaluate(describeActive)
check(
  'b11-accordion-arrows-rove',
  headerFocus.includes('testid=b11-acc-trigger-1'),
  `focus on ${headerFocus}`,
)

const splitterCaught = page.locator('[data-testid="b11-splitter-caught"]')
check('b11-splitter-failfast', await splitterCaught.isVisible(), 'degenerate value must throw')
const splitterCaughtText = (await splitterCaught.count()) ? await splitterCaught.innerText() : ''
check('b11-splitter-message', /Splitter/.test(splitterCaughtText), splitterCaughtText.slice(0, 120))

// Earlier clicks may have outside-dismissed the menu; reopen deterministically.
await page.locator('[data-testid="b11-menu-open"]').click()
await page.locator('[data-testid="b11-menu-content"]').waitFor({ state: 'visible' })
check(
  'b11-menu-textvalue',
  (await page.locator('[data-testid="b11-menu-content"] [textvalue]').count()) === 0,
  'textValue must not leak to the DOM',
)
await page.locator('[data-testid="b11-menu-content"]').getByText('B11 Item').click()
const menuEvent = await page.evaluate(() => window.__B11_MENU_EVENT__ ?? '(unset)')
check('b11-menu-event', menuEvent === 'event', `onSelect received ${menuEvent}`)

check(
  'b11-tree-expander-present',
  (await page
    .locator('[data-testid="b11-tree-expander-scope"] button[aria-label="B11 expander"]')
    .count()) === 1,
)
check(
  'b11-tree-expander-no-aria-hidden',
  (await page
    .locator('[data-testid="b11-tree-expander-scope"] button[aria-hidden="true"]')
    .count()) === 0,
)

// B-01-tolerant by design: hide, wait WITHOUT asserting removal (the open
// B-01 wedge keeps it mounted), re-show, assert recovery. Stale dist
// bricked here (vanished, never recovered); src recovers.
await page.locator('[data-testid="b11-presence-content"]').waitFor({ state: 'visible' })
await page.locator('[data-testid="b11-presence-hide"]').click()
await page.waitForTimeout(2500)
await page.locator('[data-testid="b11-presence-show"]').click()
try {
  await page
    .locator('[data-testid="b11-presence-content"]')
    .waitFor({ state: 'visible', timeout: 10000 })
  check('b11-presence-recovery', true)
} catch {
  check('b11-presence-recovery', false, 'content did not recover on false->true (stale-dist brick)')
}

// --- console verdict ------------------------------------------------------
const ALLOWLIST = [/\[Reference UI Splitter\]/, /Splitter.*does not match|Invalid Splitter/i]
const B03 = /element\.ref was removed/
const allowlisted = []
const b03 = []
const unexpected = []
for (const text of [...errors, ...pageerrors.map((message) => `pageerror: ${message}`)]) {
  if (B03.test(text)) b03.push(text)
  else if (ALLOWLIST.some((pattern) => pattern.test(text))) allowlisted.push(text)
  else unexpected.push(text)
}
// The degenerate Splitter diagnostic must fire (positive assertion: the
// fail-fast path ran); its console noise is then excused, nothing else is.
check('b11-splitter-diagnostic-fired', allowlisted.length > 0, 'expected [Reference UI Splitter]')
check('zero-unexpected-console-errors', unexpected.length === 0, unexpected.slice(0, 3).join(' | '))
check('zero-b03-noise', b03.length === 0, `${b03.length} element.ref errors (B-03, presence crew)`)

const missWarnings = warnings.filter((text) => text.includes('no compiled class'))
// Bucket each miss against the SERVED stylesheet: a warning whose value is
// absent from the CSS is a deterministic true gap (extraction/coverage —
// H-5/B-28/H-2 class); a warning for a value the sheet DOES contain is the
// dev-mode race (css() runs before Vite injects the sheet — H-6 class),
// which is timing-flaky by nature: it fails when caught, never when hidden.
const servedCss = await page.evaluate(() =>
  Array.from(document.querySelectorAll('style'))
    .map((element) => element.textContent ?? '')
    .join('\n'),
)
const LEAK_PROPS = /^(minSize|maxSize|collapsible|collapsedSize)$/
const trueGaps = []
const raceNoise = []
for (const text of missWarnings) {
  const span = text.match(/`([^`]+)`/)?.[1] ?? ''
  const leaf = span.includes('>') ? span.slice(span.lastIndexOf('>') + 1).trim() : span
  const colon = leaf.indexOf(': ')
  const prop = colon === -1 ? leaf : leaf.slice(0, colon)
  let value = colon === -1 ? '' : leaf.slice(colon + 2).trim()
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
  if (LEAK_PROPS.test(prop) || (value.length >= 4 && !servedCss.includes(value))) {
    trueGaps.push(text)
  } else {
    raceNoise.push(text)
  }
}
check(
  'zero-true-gap-style-warnings',
  trueGaps.length === 0,
  trueGaps
    .slice(0, 3)
    .map((text) => text.slice(0, 160))
    .join(' | '),
)
check(
  'zero-race-style-warnings',
  raceNoise.length === 0,
  `${raceNoise.length} dev-race warnings (H-6 class, timing-flaky)`,
)
for (const text of [...trueGaps, ...raceNoise].slice(0, 8)) {
  console.log(`  miss: ${text.slice(0, 220)}`)
}
console.log(`console warnings (info only): ${warnings.length}`)
for (const text of warnings.slice(0, 10)) console.log(`  warn: ${text.slice(0, 200)}`)

await browser.close()

console.log(
  JSON.stringify(
    {
      failures,
      console: {
        errors: errors.length,
        pageerrors: pageerrors.length,
        warnings: warnings.length,
        allowlisted: allowlisted.length,
        b03: b03.length,
        unexpected: unexpected.length,
        missTrueGaps: trueGaps.length,
        missRaceNoise: raceNoise.length,
      },
    },
    null,
    2,
  ),
)
process.exit(failures.length === 0 ? 0 : 1)

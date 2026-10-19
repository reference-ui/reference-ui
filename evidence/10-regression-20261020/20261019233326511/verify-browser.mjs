import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const url = process.argv[2]
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url || '')) throw new Error('Pass managed loopback URL')
await fs.mkdir(new URL('./evidence/', import.meta.url), { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const checks = []
const pageErrors = []
let consoleMessages = []
function check(issue, name, passed, actual) {
  checks.push({ issue, name, passed, actual })
  console.log(JSON.stringify(checks.at(-1)))
}
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', m => consoleMessages.push({ type: m.type(), text: m.text() }))
  await page.goto(url + '/responsive.html', { waitUntil: 'networkidle' })
  const columns = () => page.getByTestId('responsive-grid').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(/\s+/).length)
  const wide = await columns()
  await page.screenshot({ path: new URL('./evidence/issue-14-wide.png', import.meta.url).pathname })
  await page.setViewportSize({ width: 390, height: 720 })
  const narrow = await columns()
  check(14, 'responsive object runtime', wide === 3 && narrow === 1, { wide, narrow })
  await page.screenshot({ path: new URL('./evidence/issue-14-narrow.png', import.meta.url).pathname })
  await page.setViewportSize({ width: 1100, height: 720 })

  consoleMessages = []
  await page.goto(url + '/warning.html', { waitUntil: 'networkidle' })
  const padding = await page.getByTestId('sync-probe').evaluate(e => getComputedStyle(e).padding)
  const warnings = consoleMessages.filter(m => m.text.includes('no compiled class'))
  check(15, 'static style paints without false warning', padding === '29px' && warnings.length === 0, { padding, warnings })
  await page.screenshot({ path: new URL('./evidence/issue-15-static-padding.png', import.meta.url).pathname })

  for (const fixture of ['focus', 'focus-default']) {
    await page.goto(url + '/' + fixture + '.html', { waitUntil: 'networkidle' })
    await page.locator('#repro-trigger').click()
    await page.keyboard.press('Tab')
    const before = await page.evaluate(() => document.activeElement?.id)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    const after = await page.evaluate(() => ({ id: document.activeElement?.id, tag: document.activeElement?.tagName, expanded: document.querySelector('#repro-trigger')?.getAttribute('aria-expanded') }))
    check(17, `${fixture}: Escape restores surviving trigger`, before === 'first-name' && after.id === 'repro-trigger' && after.expanded === 'false', { before, after })
    await page.screenshot({ path: new URL(`./evidence/issue-17-${fixture}-escape.png`, import.meta.url).pathname })
    await page.locator('#repro-trigger').click()
    await page.locator('#repro-close').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    const afterClose = await page.evaluate(() => document.activeElement?.id)
    check(17, `${fixture}: Close restores trigger`, afterClose === 'repro-trigger', { afterClose })
  }

  await page.goto(url + '/number.html', { waitUntil: 'networkidle' })
  const input = page.locator('#number-min-input')
  const state = () => page.evaluate(() => ({ value: document.querySelector('#controlled')?.textContent, calls: document.querySelector('#calls')?.textContent, focus: document.activeElement?.id }))
  await input.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('4')
  const live = await state()
  check(18, 'new docs explicitly describe live parsed onChange', live.value === '4' && live.calls === '[4]' && live.focus === 'number-min-input', live)
  await page.screenshot({ path: new URL('./evidence/issue-18-live-value.png', import.meta.url).pathname })
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('99')
  const draft = await state()
  await page.keyboard.press('Tab')
  const committed = await state()
  check(18, 'bounds apply on commit as documented', draft.value === '99' && committed.value === '12', { draft, committed })
} finally {
  await browser.close()
  const result = { url, checks, pageErrors, passed: checks.length === 8 && checks.every(c => c.passed) && pageErrors.length === 0 }
  await fs.writeFile(new URL('./logs/browser-regressions.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ passed: result.passed, count: checks.length, pageErrors }))
  if (!result.passed) process.exitCode = 1
}

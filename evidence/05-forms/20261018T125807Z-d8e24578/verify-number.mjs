import { chromium } from '../../node_modules/playwright/index.mjs'
import { writeFile } from 'node:fs/promises'
const baseURL = process.argv[2]
if (!/^http:\/\/127\.0\.0\.1:\d+\/$/.test(baseURL ?? '')) throw new Error('Pass assigned loopback URL')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1120, height: 600 } })
const observations = []
const capture = async stage => observations.push({ stage, input: await page.getByLabel('Quantity', { exact: true }).inputValue(), value: await page.getByTestId('value').textContent(), callbacks: await page.getByTestId('commits').textContent(), focused: await page.getByLabel('Quantity', { exact: true }).evaluate(el => document.activeElement === el) })
try {
  await page.goto(new URL('repro-number.html', baseURL).href, { waitUntil: 'networkidle' })
  const input = page.getByLabel('Quantity', { exact: true })
  await input.focus()
  await capture('initial focus')
  await input.press('ControlOrMeta+A')
  await input.press('4')
  await capture('typed digit4; no blur or Enter')
  await page.screenshot({ path: 'evidence/number-commit-focused.png', fullPage: true })
  await input.press('Tab')
  await capture('after blur')
  console.log(JSON.stringify({ url: page.url(), observations }, null, 2))
  await writeFile('logs/number-commit-results.json', JSON.stringify({ url: page.url(), observations }, null, 2))
} finally { await browser.close() }

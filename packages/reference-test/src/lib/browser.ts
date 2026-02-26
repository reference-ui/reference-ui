/**
 * Playwright wrapper for style inspection.
 */

import { chromium, type Browser as PWBrowser, type Page } from 'playwright'

let browser: PWBrowser | null = null
let page: Page | null = null

export async function launch(): Promise<void> {
  if (!browser) browser = await chromium.launch()
}

export async function navigateTo(url: string): Promise<void> {
  await launch()
  page = await browser!.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
}

export async function queryComputedStyle(selector: string, property: string): Promise<string> {
  if (!page) throw new Error('No page. Call navigateTo first.')
  const el = await page.locator(selector).first()
  const style = await el.evaluate((e, prop) => getComputedStyle(e).getPropertyValue(prop), property)
  return style.trim()
}

export async function close(): Promise<void> {
  page = null
  if (browser) {
    await browser.close()
    browser = null
  }
}

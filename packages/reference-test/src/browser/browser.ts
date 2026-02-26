/**
 * Minimal Playwright wrapper for style inspection.
 * No complex interactions - developer workflow is file-system based.
 */

import { chromium, type Browser, type Page } from 'playwright'

let browser: Browser | null = null
let page: Page | null = null

/** Launch browser (reuses same instance) */
export async function launchBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true, timeout: 15_000 })
  }
  return browser
}

/** Navigate to URL and wait for load */
export async function navigateTo(url: string): Promise<Page> {
  const b = await launchBrowser()
  page = await b.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  return page
}

/** Get computed style property for element matching selector */
export async function queryComputedStyle(selector: string, property: string): Promise<string> {
  if (!page) throw new Error('No page - call navigateTo first')
  const el = page.locator(selector).first()
  return el.evaluate((e, prop) => {
    return getComputedStyle(e).getPropertyValue(prop)
  }, property)
}

/** Close browser instance */
export async function close(): Promise<void> {
  if (page) {
    await page.close()
    page = null
  }
  if (browser) {
    await browser.close()
    browser = null
  }
}

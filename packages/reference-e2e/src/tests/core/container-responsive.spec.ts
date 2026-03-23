import { test, expect } from '@playwright/test'
import { testRoutes } from '../../environments/base/routes'

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

test.describe('container + r (responsive container queries)', () => {
  test('ResponsiveContainerTest mounts', async ({ page }) => {
    await page.goto(testRoutes.responsiveContainer)
    const root = page.getByTestId('responsive-container-test')
    await expect(root).toBeVisible()
  })

  test('anonymous: inner `r` applies when nearest container is wide enough', async ({
    page,
  }) => {
    await page.goto(testRoutes.responsiveContainer)
    const shell = page.getByTestId('anonymous-shell')
    const target = page.getByTestId('anonymous-target')
    await expect(shell).toBeVisible()
    await expect(target).toBeVisible()

    const narrowPad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    const narrowBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(narrowPad).toBe('0px')
    expect(narrowBg).toBe('rgba(0, 0, 0, 0)')

    await shell.evaluate((el) => {
      el.style.width = '520px'
    })

    const widePad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    const wideBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(widePad).toBe('20px')
    expect(wideBg).toBe(hexToRgb('#dbeafe'))
  })

  test('named sidebar: `r` queries container named sidebar', async ({ page }) => {
    await page.goto(testRoutes.responsiveContainer)
    const shell = page.getByTestId('sidebar-shell')
    const target = page.getByTestId('sidebar-target')

    const narrowBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    const narrowPad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    expect(narrowBg).toBe('rgba(0, 0, 0, 0)')
    expect(narrowPad).toBe('0px')

    await shell.evaluate((el) => {
      el.style.width = '240px'
    })

    const wideBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    const wideColor = await target.evaluate((e) => getComputedStyle(e).color)
    const widePad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    expect(wideBg).toBe(hexToRgb('#2563eb'))
    expect(wideColor).toBe(hexToRgb('#ffffff'))
    expect(widePad).toBe('12px')
  })

  test('named card: `r` matches across nested wrappers', async ({ page }) => {
    await page.goto(testRoutes.responsiveContainer)
    const shell = page.getByTestId('card-shell')
    const target = page.getByTestId('card-target')

    const narrowBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    const narrowPad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    expect(narrowBg).toBe('rgba(0, 0, 0, 0)')
    expect(narrowPad).toBe('0px')

    await shell.evaluate((el) => {
      el.style.width = '360px'
    })

    const wideBg = await target.evaluate((e) => getComputedStyle(e).backgroundColor)
    const wideColor = await target.evaluate((e) => getComputedStyle(e).color)
    const widePad = await target.evaluate((e) => getComputedStyle(e).paddingTop)
    expect(wideBg).toBe(hexToRgb('#16a34a'))
    expect(wideColor).toBe(hexToRgb('#ffffff'))
    expect(widePad).toBe('12px')
  })

  test('named sidebar and card are independent (each uses its own container width)', async ({
    page,
  }) => {
    await page.goto(testRoutes.responsiveContainer)
    const sidebarShell = page.getByTestId('sidebar-shell')
    const sidebarTarget = page.getByTestId('sidebar-target')
    const cardShell = page.getByTestId('card-shell')
    const cardTarget = page.getByTestId('card-target')

    // Wide card shell, narrow sidebar shell — card matches ≥300px, sidebar stays below 200px
    await sidebarShell.evaluate((el) => {
      el.style.minWidth = '0'
      el.style.width = '150px'
    })
    await cardShell.evaluate((el) => {
      el.style.width = '400px'
    })

    const sidebarBg = await sidebarTarget.evaluate((e) => getComputedStyle(e).backgroundColor)
    const cardBg = await cardTarget.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(sidebarBg).toBe('rgba(0, 0, 0, 0)')
    expect(cardBg).toBe(hexToRgb('#16a34a'))

    // Wide sidebar, narrow card — sidebar matches ≥200px, card stays below 300px
    await sidebarShell.evaluate((el) => {
      el.style.width = '280px'
    })
    await cardShell.evaluate((el) => {
      el.style.width = '260px'
    })

    const sidebarBg2 = await sidebarTarget.evaluate((e) => getComputedStyle(e).backgroundColor)
    const cardBg2 = await cardTarget.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(sidebarBg2).toBe(hexToRgb('#2563eb'))
    expect(cardBg2).toBe('rgba(0, 0, 0, 0)')
  })
})

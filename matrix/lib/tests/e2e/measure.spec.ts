import { expect, test } from '@playwright/test'

test.describe('Measure browser proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/measure')
    await expect(page.getByTestId('measure-fixture-root')).toBeVisible()
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-settled', 'yes')
  })

  test('MS-DOM-01: publishes the authored host border box with no wrapper node', async ({
    page,
  }) => {
    const host = page.getByTestId('measure-host')
    const box = await host.evaluate(el => {
      const rect = el.getBoundingClientRect()
      return {
        width: Math.round(rect.width),
        childCount: el.parentElement?.childElementCount ?? 0,
      }
    })
    await expect(host).toHaveAttribute('data-width', String(box.width))
    expect(box.width).toBe(100)
    expect(box.childCount).toBeGreaterThanOrEqual(1)
  })

  test('MS-BOX-B-01: padding-only change updates published width (border-box)', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await expect(host).toHaveAttribute('data-width', '100')
    await page.getByTestId('measure-pad').click()
    await expect(host).toHaveAttribute('data-width', '140')
    await expect(host).toHaveAttribute('data-settled', 'yes')
  })

  test('MS-SETTLE-B-01: a width change resets settle then settles again', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await page.getByTestId('measure-wide').click()
    await expect(host).toHaveAttribute('data-width', '200')
    await expect(host).toHaveAttribute('data-settled', 'yes')
  })

  test('MS-PAUSE-B-01: paused keeps the last width through a size change', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await page.getByTestId('measure-pause').click()
    await expect(host).toHaveAttribute('data-settled', 'no')
    await expect(host).toHaveAttribute('data-width', '100')
    await page.getByTestId('measure-wide').click()
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'no')
  })

  test('MS-PERF-B-01: does not read layout while idle after settle', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await host.evaluate(el => {
      const element = el as HTMLElement & { __measureReads?: number }
      let reads = 0
      const original = el.getBoundingClientRect.bind(el)
      el.getBoundingClientRect = () => {
        reads += 1
        element.__measureReads = reads
        return original()
      }
      element.__measureReads = 0
    })

    await page.waitForTimeout(120)
    const idleReads = await host.evaluate(
      el => (el as HTMLElement & { __measureReads?: number }).__measureReads ?? -1
    )
    expect(idleReads).toBe(0)

    await page.getByTestId('measure-wide').click()
    await expect(host).toHaveAttribute('data-width', '200')
    const afterResize = await host.evaluate(
      el => (el as HTMLElement & { __measureReads?: number }).__measureReads ?? -1
    )
    expect(afterResize).toBeGreaterThan(0)
  })
})

test.describe('Measure sharp edges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/measure')
    await expect(page.getByTestId('measure-fixture-root')).toBeVisible()
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-settled', 'yes')
  })

  test('MS-SCALE-01: transform-only change does not churn the layout box', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await page.getByTestId('measure-scale').click()
    await page.waitForTimeout(50)
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    const visual = await host.evaluate(el => el.getBoundingClientRect().width)
    expect(visual).toBeGreaterThan(140)
  })

  test('MS-LOOP-01: sizing the host from rect converges without a ResizeObserver loop', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    const host = page.getByTestId('measure-loop-host')
    await expect(host).toHaveAttribute('data-width', '80')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await page.waitForTimeout(80)
    await expect(host).toHaveAttribute('data-width', '80')
    expect(errors.some(text => /ResizeObserver loop/i.test(text))).toBe(false)
  })

  test('MS-DOC-01: observes a same-origin iframe with that document’s box', async ({ page }) => {
    const frame = page.frameLocator('[data-testid="measure-iframe"]')
    const host = frame.getByTestId('measure-iframe-host')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await expect(host).toHaveAttribute('data-width', '100')
    const publishedTop = Number(await host.getAttribute('data-top'))
    expect(publishedTop).toBeLessThan(20)
    const iframeBox = await page.getByTestId('measure-iframe').boundingBox()
    expect(iframeBox?.y ?? 0).toBeGreaterThan(40)
  })

  test('MS-HIDDEN-01: display:none publishes a zero box and re-measures on reappear', async ({
    page,
  }) => {
    const host = page.getByTestId('measure-host')
    await page.getByTestId('measure-hide').click()
    await expect(host).toHaveAttribute('data-width', '0')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await page.getByTestId('measure-hide').click()
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'yes')
  })

  test('MS-ENV-01: StrictMode remount leaves one settled observer session', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await expect(host).toHaveAttribute('data-width', '100')
    await page.getByTestId('measure-unmount').click()
    await expect(page.getByTestId('measure-host')).toHaveCount(0)
    await page.getByTestId('measure-unmount').click()
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-settled', 'yes')
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-width', '100')
  })
})

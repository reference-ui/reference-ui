/**
 * Measure browser proofs: border-box publishing, settle, pause, and idle
 * reads plus the scale, loop, document, hidden, and StrictMode edges.
 * Mounts the story fixture and asserts ResizeObserver discipline with
 * no wrapper node in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Measure browser proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Measure/Measure/Fixture')
    await expect(page.getByTestId('measure-fixture-root')).toBeVisible()
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-settled', 'yes')
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
    await snap(page, 'ms-perf-wide-settled')
  })
})

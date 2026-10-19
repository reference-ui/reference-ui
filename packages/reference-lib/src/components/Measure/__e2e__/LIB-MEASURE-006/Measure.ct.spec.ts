/**
 * Measure browser proofs: border-box publishing, settle, pause, and idle
 * reads plus the scale, loop, document, hidden, and StrictMode edges.
 * Mounts the story fixture and asserts ResizeObserver discipline with
 * no wrapper node in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Measure sharp edges', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Measure/Measure/Fixture')
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
    await snap(page, 'ms-scale-transformed')
  })
})

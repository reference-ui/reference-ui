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

  test('MS-PAUSE-B-01: paused keeps the last width through a size change', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await page.getByTestId('measure-pause').click()
    await expect(host).toHaveAttribute('data-settled', 'no')
    await expect(host).toHaveAttribute('data-width', '100')
    await snap(page, 'ms-pause-settled-no')
    await page.getByTestId('measure-wide').click()
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'no')
    await snap(page, 'ms-pause-wide-paused')
  })
})

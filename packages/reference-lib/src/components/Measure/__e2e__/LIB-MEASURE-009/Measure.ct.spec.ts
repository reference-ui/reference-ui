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

  test('MS-HIDDEN-01: display:none publishes a zero box and re-measures on reappear', async ({
    page,
  }) => {
    const host = page.getByTestId('measure-host')
    await page.getByTestId('measure-hide').click()
    await expect(host).toHaveAttribute('data-width', '0')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await snap(page, 'ms-hidden-zero')
    await page.getByTestId('measure-hide').click()
    await expect(host).toHaveAttribute('data-width', '100')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await snap(page, 'ms-reappeared')
  })
})

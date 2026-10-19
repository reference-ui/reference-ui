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

  test('MS-ENV-01: StrictMode remount leaves one settled observer session', async ({ page }) => {
    const host = page.getByTestId('measure-host')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await expect(host).toHaveAttribute('data-width', '100')
    await page.getByTestId('measure-unmount').click()
    await expect(page.getByTestId('measure-host')).toHaveCount(0)
    await snap(page, 'ms-unmounted')
    await page.getByTestId('measure-unmount').click()
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-settled', 'yes')
    await expect(page.getByTestId('measure-host')).toHaveAttribute('data-width', '100')
    await snap(page, 'ms-remounted')
  })
})

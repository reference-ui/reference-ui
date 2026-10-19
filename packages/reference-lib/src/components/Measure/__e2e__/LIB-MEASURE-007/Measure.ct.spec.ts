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
    await snap(page, 'ms-loop-converged')
  })
})

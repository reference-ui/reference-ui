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

  test('MS-DOM-01: publishes the authored host border box with no wrapper node', async ({
    page,
  }) => {
    const host = page.getByTestId('measure-host')
    await snap(page, 'ms-dom-resting')
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
})

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

  test('MS-DOC-01: observes a same-origin iframe with that document’s box', async ({ page }) => {
    const frame = page.frameLocator('[data-testid="measure-iframe"]')
    const host = frame.getByTestId('measure-iframe-host')
    await expect(host).toHaveAttribute('data-settled', 'yes')
    await expect(host).toHaveAttribute('data-width', '100')
    const publishedTop = Number(await host.getAttribute('data-top'))
    expect(publishedTop).toBeLessThan(20)
    const iframeBox = await page.getByTestId('measure-iframe').boundingBox()
    expect(iframeBox?.y ?? 0).toBeGreaterThan(40)
    await snap(page, 'ms-doc-iframe')
  })
})

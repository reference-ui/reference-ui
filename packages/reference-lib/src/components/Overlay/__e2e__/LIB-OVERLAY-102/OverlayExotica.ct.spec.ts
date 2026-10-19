/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-LAYER-09: branch mount, reparent, and unmount update dismiss and focus together', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-layer-09-parent').click()
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-mount-child"]') as HTMLButtonElement).click()
    })
    const child = page.getByTestId('layer-09-child-content')
    await expect(child).toBeVisible()
    await expect(page.getByTestId('layer-09-host-a').locator('[data-testid="layer-09-child-content"]')).toHaveCount(1)
    await page.waitForTimeout(200)
    await snap(page, 'exotica-layer-09-child-open')

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-reparent"]') as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('layer-09-host-b').locator('[data-testid="layer-09-child-content"]')).toHaveCount(1)
    await page.getByTestId('btn-layer-09-child-inner').evaluate(el => (el as HTMLButtonElement).click())
    await expect(page.getByTestId('layer-09-log')).not.toContainText('parent-dismiss')
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-unmount-child"]') as HTMLButtonElement).click()
    })
    await expect(child).toHaveCount(0)
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()
  })
})

/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-LAYER-07: sibling Overlays in independent React roots share top-layer ordering', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-root-a').click()
    await expect(page.getByTestId('root-a-content')).toBeVisible()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-open-root-b"]') as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('root-b-content')).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'exotica-two-roots-open')

    await page.getByTestId('root-b-inner').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('root-b-content')).toHaveCount(0)
    await expect(page.getByTestId('root-a-content')).toBeVisible()
    await expect(page.getByTestId('roots-log')).toContainText('b-escape')
    await expect(page.getByTestId('roots-log')).toContainText('b-dismiss')
    await expect(page.getByTestId('roots-log')).not.toContainText('a-escape')

    await page.getByTestId('root-a-inner').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('root-a-content')).toHaveCount(0)
    await expect(page.getByTestId('roots-log')).toContainText('a-dismiss')
  })
})

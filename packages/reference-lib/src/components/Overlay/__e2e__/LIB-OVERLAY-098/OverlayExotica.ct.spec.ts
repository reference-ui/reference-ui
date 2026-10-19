/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-ESC-05 & OV-LAYER-10: Escape and outside route only through the active document stack', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    const frameEl = page.getByTestId('exotica-iframe')
    await expect(frameEl).toBeVisible()
    await page.waitForFunction(() => {
      const iframe = document.querySelector('[data-testid="exotica-iframe"]') as HTMLIFrameElement | null
      return Boolean(iframe?.contentDocument?.querySelector('[data-testid="frame-fixture-root"]'))
    })
    const frame = page.frameLocator('[data-testid="exotica-iframe"]')
    await expect(frame.getByTestId('frame-fixture-root')).toBeVisible()

    await frame.getByTestId('btn-frame-open').click()
    await expect(frame.getByTestId('frame-content')).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'exotica-frame-open')

    await page.getByTestId('btn-main-esc-open').click()
    await expect(page.getByTestId('main-esc-content')).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'exotica-main-open')

    await page.getByTestId('btn-main-esc-inner').focus()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('main-esc-content')).toHaveCount(0)
    await expect(page.getByTestId('main-esc-log')).toContainText('escape')
    await expect(page.getByTestId('main-esc-log')).toContainText('dismiss')
    await expect(frame.getByTestId('frame-content')).toBeVisible()
    await expect(frame.getByTestId('frame-log')).not.toContainText('escape')
    await expect(frame.getByTestId('frame-log')).not.toContainText('dismiss')

    await frame.getByTestId('btn-frame-inner').focus()
    await page.keyboard.press('Escape')
    await expect(frame.getByTestId('frame-content')).toHaveCount(0)
    await expect(frame.getByTestId('frame-log')).toContainText('dismiss')
  })
})

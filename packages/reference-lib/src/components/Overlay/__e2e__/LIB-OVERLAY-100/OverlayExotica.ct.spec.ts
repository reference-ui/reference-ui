/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-OUT-10: focus during a deferred stopped pointer sequence does not dismiss', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-out-10').click()
    const content = page.getByTestId('out-10-content')
    const log = page.getByTestId('out-10-log')
    await expect(content).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'exotica-out-10-open')

    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="btn-out-10-extension"]') as HTMLButtonElement
      el.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        })
      )
      el.focus()
      el.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        })
      )
      el.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
      el.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
      el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
    })

    await expect(content).toBeVisible()
    await expect(log).not.toContainText('outside')
    await expect(log).not.toContainText('dismiss')
  })
})

/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-ENV-05: omitted container follows a shadow trigger into its root', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-env-05').click()
    const content = page.getByTestId('env-05-content')
    await expect(content).toBeVisible()

    // Automatic destination: the trigger's shadow root, not document.body.
    const dest = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="env05-host"]') as HTMLElement
      return {
        inShadow: Boolean(host.shadowRoot?.querySelector('[data-testid="env-05-content"]')),
        inBody: Boolean(document.body.querySelector(':scope > [data-testid="env-05-content"]')),
      }
    })
    expect(dest.inShadow).toBe(true)
    expect(dest.inBody).toBe(false)

    // Composed dismissal still holds: a light-DOM outside press closes.
    // Synthetic sequence mirrors OV-OUT-11 (no-backdrop modals dismiss via
    // the deferred document path; the light button is inert + pointer-locked).
    await page.evaluate(() => {
      const target = document.querySelector('[data-testid="btn-env-05-light-outside"]')!
      const opts = {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        isPrimary: true,
      }
      target.dispatchEvent(new PointerEvent('pointerdown', opts))
      target.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }))
      target.dispatchEvent(new MouseEvent('click', opts))
    })
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('env-05-log')).toHaveText('outside,dismiss')

    // And Escape closes with the same granular-before-high-level order.
    await page.getByTestId('btn-open-env-05').click()
    await expect(content).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('env-05-log')).toHaveText('outside,dismiss,escape,dismiss')
  })
})

/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-07: Collapsible should evacuate focus before closing Content becomes inert', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const input1 = page.getByTestId('probe-input')
    const trigger1 = page.getByTestId('probe-trigger')

    await input1.focus()
    await expect(input1).toBeFocused()
    await page.getByTestId('probe-close').click()
    await expect(trigger1).toBeFocused()

    await mount('components/Collapsible/Collapsible/FocusFallback')
    const input2 = page.getByTestId('fb-input')

    await input2.focus()
    await expect(input2).toBeFocused()
    await page.getByTestId('fb-close').click()

    const isInside = await input2.evaluate(el => document.activeElement === el)
    expect(isInside).toBe(false)
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
  })
});

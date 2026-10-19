/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-SIZE-02: Collapsible should snapshot the last open size before closed CSS can collapse the box', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/SizeSnapshot')
    const snapContent = page.getByTestId('snap-content')

    await expect(snapContent).toBeVisible()
    await page.getByTestId('snap-close').click()

    const vars = await snapContent.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        w: styles.getPropertyValue('--reference-collapsible-content-width').trim(),
        h: styles.getPropertyValue('--reference-collapsible-content-height').trim(),
      }
    })

    expect(parseFloat(vars.w)).toBeCloseTo(160, 0)
    expect(parseFloat(vars.h)).toBeCloseTo(64, 0)
  })
});

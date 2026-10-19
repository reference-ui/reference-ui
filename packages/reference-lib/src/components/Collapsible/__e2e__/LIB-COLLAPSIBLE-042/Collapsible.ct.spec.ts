/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-03: Collapsible should remove closed Content immediately when no finite exit motion exists (re-targeted: reduced-motion stub zeroes the GSAP exit)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    await expect(content).toBeVisible()

    await page.evaluate(() => {
      const orig = window.matchMedia.bind(window)
      window.matchMedia = ((query: string) => {
        if (query.includes('prefers-reduced-motion')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
          }
        }
        return orig(query)
      }) as unknown as typeof window.matchMedia
    })

    await page.getByTestId('probe-close').click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // A normal GSAP exit holds content ~320ms; reduced motion must beat 250ms.
    await expect(content).toHaveCount(0, { timeout: 250 })
  })
});

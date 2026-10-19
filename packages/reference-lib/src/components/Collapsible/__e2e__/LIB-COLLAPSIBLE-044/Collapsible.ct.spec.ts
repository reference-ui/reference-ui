/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-05: Collapsible should give each exit a fresh lifecycle without replaying mount-only motion (re-targeted: GSAP skipEnter probe + close/reopen/close lifecycle)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/DefaultOpen')
    const defaultContent = page.getByTestId('default-open-content')
    await expect(defaultContent).toBeVisible()
    // Initially-open content renders at final size with no enter tween inline state.
    expect(await defaultContent.evaluate(el => (el as HTMLElement).style.height)).toBe('auto')

    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const content = page.getByTestId('probe-content')
    await expect(content).toBeVisible()

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })

    await page.getByTestId('probe-set-open').click()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })
  })
});

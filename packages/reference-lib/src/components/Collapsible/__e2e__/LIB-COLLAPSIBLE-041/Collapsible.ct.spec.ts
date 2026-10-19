/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-02: Collapsible should ignore descendant end events during exit and unmount on its own completion (re-targeted: CT harness disables CSS keyframes, GSAP holds the exit)', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ExitChild')
    const content = page.getByTestId('exit-content')
    const child = page.getByTestId('exit-child')

    await expect(content).toBeVisible()
    await page.getByTestId('exit-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await child.evaluate(el => el.dispatchEvent(new Event('animationend', { bubbles: true })))
    await child.evaluate(el => el.dispatchEvent(new Event('transitionend', { bubbles: true })))
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await expect(content).toHaveCount(0, { timeout: 2000 })
  })
});

/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-ACT-02: Collapsible should request closing once when an enabled open trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const log = page.getByTestId('probe-log')

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await trigger.click()
    await expect(log).toHaveText('[false]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()
  })
});

/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-ACT-01: Collapsible should request opening once when an enabled closed trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledClosed')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const log = page.getByTestId('probe-log')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await trigger.click()
    await expect(log).toHaveText('[true]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)
  })
});

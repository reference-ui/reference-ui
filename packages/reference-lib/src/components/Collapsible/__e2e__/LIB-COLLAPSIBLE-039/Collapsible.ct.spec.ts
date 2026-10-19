/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-ACT-03: Collapsible should use native button keyboard activation without duplicate toggle requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledClosed')
    const trigger = page.getByTestId('probe-trigger')
    const log = page.getByTestId('probe-log')
    const reset = page.getByTestId('probe-reset')

    await trigger.focus()

    await page.keyboard.down('Space')
    await page.keyboard.down('Space')
    await expect(log).toHaveText('[]')
    await page.keyboard.up('Space')
    await expect(log).toHaveText('[true]')

    await reset.click()
    await expect(log).toHaveText('[]')
    await trigger.focus()

    await page.keyboard.press('Enter')
    await expect(log).toHaveText('[true]')
  })
});

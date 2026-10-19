/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-COMP-02: An animated Collapsible should survive a close that is interrupted by reopening', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')
    const input = page.getByTestId('probe-input')

    await expect(content).toBeVisible()
    await input.focus()
    await expect(input).toBeFocused()

    await page.getByTestId('probe-close').click()
    await expect(trigger).toBeFocused()
    await expect(content).toHaveAttribute('inert', '')

    await page.getByTestId('probe-set-open').click()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content).not.toHaveAttribute('inert')

    // Valid pixel measurements after the interrupt (poll: a remount republishes async).
    await expect.poll(async () => {
      return content.evaluate(el =>
        parseFloat(getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height'))
      )
    }).toBeGreaterThan(0)

    await page.getByTestId('probe-close').click()
    await expect(content).toHaveCount(0, { timeout: 2000 })
  })
});

/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-DOM-04: Collapsible should expose authoritative open, closed, and disabled state on its rendered parts', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ForgedState')
    const trigger = page.getByTestId('forged-trigger')
    const content = page.getByTestId('forged-content')

    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(trigger).not.toHaveAttribute('data-disabled')
    await expect(content).not.toHaveAttribute('data-disabled')
    await expect(trigger).toHaveAttribute('data-unrelated', 'keep-me-trigger')
    await expect(content).toHaveAttribute('data-unrelated', 'keep-me-content')

    await page.getByTestId('forged-close').click()
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')

    await page.getByTestId('forged-open').click()
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('forged-disable').click()
    await expect(trigger).toBeDisabled()
    await expect(trigger).toHaveAttribute('data-disabled', '')
  })
});

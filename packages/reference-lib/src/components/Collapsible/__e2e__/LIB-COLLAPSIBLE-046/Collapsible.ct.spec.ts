/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-08: Collapsible should isolate visually exiting closed Content and restore only isolation it owns', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Isolation')
    const content = page.getByTestId('iso-content')
    const childBtn = page.getByTestId('iso-btn')
    const clicks = page.getByTestId('iso-clicks')

    await expect(content).toBeVisible()
    await page.getByTestId('iso-close').click()

    // Toggled imperatively so all React runtimes isolate (17/18 skip JSX inert).
    await expect(content).toHaveAttribute('inert', '')
    await expect(content).toHaveAttribute('aria-hidden', 'true')

    await childBtn.click({ force: true })
    await expect(clicks).toHaveText('0')

    await page.getByTestId('iso-reopen').click()
    await expect(content).not.toHaveAttribute('inert')
    await expect(content).not.toHaveAttribute('aria-hidden')

    await childBtn.click()
    await expect(clicks).toHaveText('1')
  })
});

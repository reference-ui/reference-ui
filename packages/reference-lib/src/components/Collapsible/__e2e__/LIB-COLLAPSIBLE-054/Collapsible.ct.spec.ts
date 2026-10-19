/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-MOUNT-CT-02: native beforematch opens hidden-until-found content; a cancelled reveal stays closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/UntilFound')
    const content = page.getByTestId('uf-content')

    await page.getByTestId('uf-close').click()
    await expect(content).toBeHidden()

    await content.evaluate((el) => {
      el.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    await page.getByTestId('uf-close').click()
    await expect(content).toBeHidden()
    await content.evaluate((el) => {
      el.addEventListener(
        'beforematch',
        (event) => event.preventDefault(),
        { once: true }
      )
      el.dispatchEvent(new Event('beforematch', { bubbles: true, cancelable: true }))
    })
    await expect(content).toBeHidden()
    await expect(content).toHaveAttribute('data-state', 'closed')
  })
});

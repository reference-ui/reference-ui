/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-COMP-03: Collapsible should remain the disclosure runtime when composed as a nested Accordion item', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/AccordionNest')
    const accTrigger1 = page.getByTestId('nest-acc-trigger-1')
    const accTrigger2 = page.getByTestId('nest-acc-trigger-2')
    const accContent1 = page.getByTestId('nest-acc-content-1')
    const innerTrigger = page.getByTestId('nest-inner-trigger')
    const innerContent = page.getByTestId('nest-inner-content')
    const innerLog = page.getByTestId('nest-inner-log')

    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(accContent1).toBeVisible()

    await expect(innerTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(innerContent).toHaveCount(0)

    await innerTrigger.click()
    await expect(innerLog).toHaveText('[true]')
    await expect(innerTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(innerContent).toBeVisible()
    await expect(accTrigger1).toHaveAttribute('aria-expanded', 'true')

    await accTrigger2.click()
    await expect(accTrigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('nest-acc-content-2')).toBeVisible()
    await expect(accContent1).toHaveCount(0, { timeout: 2000 })
  })
});

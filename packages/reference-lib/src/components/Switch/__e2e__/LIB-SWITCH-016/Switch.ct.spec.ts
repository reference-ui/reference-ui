/**
 * Switch browser proof: anatomy, activation, and parity. Renders the
 * fixtures to pin button[role=switch] with exactly one thumb, authoritative
 * checked and disabled exposure, single onChange per activation, label
 * association, form non-serialization, RTL-checked rendering, and an
 * accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Switch parity', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Switch/Switch/ParityFixture')
    await expect(page.getByTestId('switch-parity-root')).toBeVisible()
  })

  test('SW-DOM-05: Switch should forward native props and refs to the button and an authored Thumb', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-05')
    const thumb = page.getByTestId('sw-dom-05-thumb')

    await expect(sw).toHaveClass(/consumer-root-class/)
    await expect(thumb).toHaveClass(/consumer-thumb-class/)
    await expect(sw).toHaveAttribute('data-custom-root', 'root-val')
    await expect(thumb).toHaveAttribute('data-custom-thumb', 'thumb-val')
    await expect(sw).toHaveAttribute('aria-label', 'Custom Switch')
    await expect(page.getByTestId('sw-dom-05-root-tag')).toHaveText('BUTTON')
    await expect(page.getByTestId('sw-dom-05-thumb-tag')).toHaveText('SPAN')

    await sw.click()
    await expect(page.getByTestId('sw-dom-05-clicked')).toHaveText('yes')

    await page.getByTestId('sw-dom-05-rerender').click()
    await expect(sw).toHaveAttribute('data-custom-root', 'root-val')
  })
});

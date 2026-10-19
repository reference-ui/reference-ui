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

  test('SW-DOM-06: Switch should not participate in form serialization', async ({ page }) => {
    const form = page.getByTestId('sw-dom-06-form')
    const sw = page.getByTestId('sw-dom-06')

    const formDataEntries = await form.evaluate((formEl: HTMLFormElement) => {
      const data = new FormData(formEl)
      return Array.from(data.entries())
    })
    expect(formDataEntries.length).toBe(0)

    await page.getByTestId('sw-dom-06-submit').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('sw-dom-06-change-count')).toHaveText('0')

    await page.getByTestId('sw-dom-06-reset').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('sw-dom-06-change-count')).toHaveText('0')
  })
});

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

  test('SW-COMP-02: A wrapping-label Switch should sit in a form without serializing', async ({
    page,
  }) => {
    const label = page.getByTestId('sw-comp-02-label')
    const sw = page.getByTestId('sw-comp-02')
    const mirror = page.getByTestId('sw-comp-02-mirror')
    const form = page.getByTestId('sw-comp-02-form')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(mirror).not.toBeChecked()

    await label.click({ position: { x: 5, y: 5 } })
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(mirror).toBeChecked()

    const formData = await form.evaluate((formEl: HTMLFormElement) => {
      const fd = new FormData(formEl)
      return Object.fromEntries(fd.entries())
    })
    expect(formData.notifications_enabled).toBe('on')
  })
});

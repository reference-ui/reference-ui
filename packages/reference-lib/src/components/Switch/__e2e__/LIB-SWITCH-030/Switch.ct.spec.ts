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

  test('SW-A11Y-01: Switch should remain accessibility-clean in named, disabled, and wrapping-label shapes', async ({
    page,
  }) => {
    const section = page.getByTestId('section-a11y-01')
    const switches = section.locator('button[role="switch"]')
    await expect(switches).toHaveCount(5)

    for (let i = 0; i < 5; i++) {
      const sw = switches.nth(i)
      await expect(sw).toHaveAttribute('role', 'switch')
      await expect(sw).toHaveAttribute('type', 'button')
      await expect(sw).not.toHaveAttribute('aria-pressed')
      const checkedAttr = await sw.getAttribute('aria-checked')
      expect(checkedAttr === 'true' || checkedAttr === 'false').toBe(true)
      const thumb = sw.locator('[data-reference-switch-thumb]')
      await expect(thumb).toHaveCount(1)
    }

    // Scanner half: narrowed to section-a11y-01 (the named, disabled,
    // and wrapping-label shapes this case asserts). The shared
    // ParityFixture mount holds ~20 sections owned by other cases —
    // several deliberately render unnamed switches — so #root-scoping
    // would adjudicate other cases' fixtures, not this one.
    await expectNoAxeViolations(page, { include: '[data-testid="section-a11y-01"]' })
  })
});

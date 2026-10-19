/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-01: Listbox should preserve native group roles and accessible labels around nested Options', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const listbox = page.getByTestId('ng-listbox')
    await expect(page.getByTestId('ng-group-warm')).toHaveAttribute('role', 'group')
    await expect(page.getByTestId('ng-group-warm')).toHaveAttribute('aria-label', 'Warm colors')
    await expect(page.getByTestId('ng-group-cool')).toHaveAttribute(
      'aria-labelledby',
      'ng-cool-label'
    )
    await expect(page.getByTestId('ng-heading-warm')).toBeVisible()
    await expect(page.getByTestId('ng-decor-bravo')).toBeVisible()
    await expect(page.getByTestId('ng-inner-button')).toBeVisible()

    // Every nested Option keeps its role; no wrapper or extra host appears
    await expect(listbox.getByRole('option')).toHaveCount(4)
    await expect(page.getByTestId('ng-apple')).toHaveAttribute('role', 'option')
    await expect(page.getByTestId('ng-kiwi')).toHaveAttribute('role', 'option')
    await expect(listbox.locator('select, input, [role="dialog"]')).toHaveCount(0)
  })
});

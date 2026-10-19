/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-A11Y-01: Listbox should pass accessibility checks across every frozen semantic shape', async ({
    mount,
    page,
  }) => {
    // Assertion half: roles, accessible names, states, and relationships
    // per shape. The scanner half runs at the end of this test.
    await mount('components/Listbox/Listbox/A11yShapes')
    await expect(page.getByTestId('a11y-root')).toBeVisible()

    // Named single with disabled option
    const single = page.getByRole('listbox', { name: 'Single fruits' })
    await expect(single).toBeVisible()
    await expect(single).not.toHaveAttribute('aria-multiselectable')
    await expect(page.getByTestId('a11y-s-apple')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('a11y-s-banana')).toHaveAttribute('aria-disabled', 'true')

    // Named multiple
    const multi = page.getByRole('listbox', { name: 'Multi fruits' })
    await expect(multi).toHaveAttribute('aria-multiselectable', 'true')
    await expect(page.getByTestId('a11y-m-apple')).toHaveAttribute('aria-selected', 'true')

    // Whole-listbox disabled: every option reports disabled, none tabbable
    await expect(page.getByRole('listbox', { name: 'Disabled list' })).toBeVisible()
    await expect(page.getByTestId('a11y-d-apple')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('a11y-d-apple')).toHaveAttribute('tabindex', '-1')

    // Empty: role without options
    const empty = page.getByRole('listbox', { name: 'Empty list' })
    await expect(empty).toBeVisible()
    await expect(empty.getByRole('option')).toHaveCount(0)

    // Horizontal orientation
    await expect(page.getByRole('listbox', { name: 'Horizontal list' })).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    )

    // Virtualized set metadata
    await expect(page.getByRole('listbox', { name: 'Virtual list' })).toBeVisible()
    await expect(page.getByTestId('a11y-v-0')).toHaveAttribute('aria-setsize', '10')
    await expect(page.getByTestId('a11y-v-2')).toHaveAttribute('aria-posinset', '3')

    // Scanner half: the A11yShapes mount holds every frozen shape —
    // single, multiple, whole-disabled, empty, horizontal, virtualized —
    // in one story; #root scoping covers it whole (no portals).
    await expectNoAxeViolations(page, { include: '#root' })
  })
});

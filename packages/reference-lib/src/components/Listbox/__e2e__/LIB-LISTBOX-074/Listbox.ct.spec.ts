/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-VIRT-09: Virtual Listbox should atomically replace logical metadata and its scroll callback', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualReplace')
    await expect(page.getByTestId('vr-root')).toBeVisible()

    // Generation A: unmounted target routes to the A callback
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-a')).toHaveText('[3]')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[]')

    // Atomic replacement: next command consults only the newest order + callback
    await page.getByTestId('vr-replace').click()
    await expect(page.getByTestId('vr-opt-2')).toHaveAttribute('data-value', 'b-2')
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-a')).toHaveText('[3]')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[3]')

    // Invalid replacement mapping diagnoses descriptively, then recovers
    await page.getByTestId('vr-break').click()
    await expect(page.getByTestId('vr-error')).toContainText(
      'Duplicate value in virtual items: "dup"'
    )
    await page.getByTestId('vr-fix').click()
    await expect(page.getByTestId('vr-opt-0')).toBeVisible()
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[3,3]')
  })
});

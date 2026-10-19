/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-COMP-02: Standalone Listbox should support controlled multiple selection in horizontal RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/CompMultiRTL')
    await expect(page.getByTestId('cm-root')).toBeVisible()

    const calls = page.getByTestId('cm-calls')

    // Mirrored arrows skip the disabled middle option
    await page.getByTestId('cm-bravo').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('cm-delta')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('cm-bravo')).toBeFocused()

    // Current-order toggle arrays through pointer and keyboard
    await page.getByTestId('cm-delta').click()
    await expect(calls).toHaveText('[["alpha","delta","echo"]]')
    await page.getByTestId('cm-bravo').focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('[["alpha","delta","echo"],["alpha","bravo","delta","echo"]]')
    await expect(page.getByTestId('cm-bravo')).toHaveAttribute('aria-selected', 'true')

    // Unsupported range modifiers request nothing and change no ARIA
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('ControlOrMeta+a')
    await expect(calls).toHaveText('[["alpha","delta","echo"],["alpha","bravo","delta","echo"]]')
    await expect(page.getByTestId('cm-charlie')).toHaveAttribute('aria-selected', 'false')
  })
});

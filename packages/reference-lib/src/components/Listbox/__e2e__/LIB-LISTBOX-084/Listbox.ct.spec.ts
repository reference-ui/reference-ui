/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-COMP-03: Windowed Listbox should coordinate logical navigation with an application virtualizer', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual100')
    await expect(page.getByTestId('v100-root')).toBeVisible()

    const scrollLog = page.getByTestId('v100-scroll-log')
    const calls = page.getByTestId('v100-calls')

    // Accurate set metadata across a variable-height middle window
    await expect(page.getByTestId('v100-opt-40')).toHaveAttribute('aria-setsize', '100')
    await expect(page.getByTestId('v100-opt-40')).toHaveAttribute('aria-posinset', '41')
    await expect(page.getByTestId('v100-opt-46')).toHaveAttribute('aria-posinset', '47')

    // In-window arrows never consult the adapter
    await page.getByTestId('v100-opt-42').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('v100-opt-43')).toBeFocused()
    await expect(scrollLog).toHaveText('[]')

    // Past-window arrows pend latest-first; End resolves at the boundary
    await page.getByTestId('v100-opt-46').focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toHaveText('[47]')
    await page.keyboard.press('End')
    await expect(scrollLog).toHaveText('[47,99]')
    await page.getByTestId('v100-mount-93-99').click()
    await expect(page.getByTestId('v100-opt-99')).toBeFocused()

    // Home skips the disabled index 3 to logical 0
    await page.keyboard.press('Home')
    await expect(scrollLog).toHaveText('[47,99,0]')
    await page.getByTestId('v100-mount-0-6').click()
    await expect(page.getByTestId('v100-opt-0')).toBeFocused()

    // Typeahead mounts the offscreen match before focusing it
    await page.getByTestId('v100-opt-1').focus()
    await page.keyboard.type('z')
    await expect(scrollLog).toHaveText('[47,99,0,77]')
    await page.getByTestId('v100-mount-75-80').click()
    await expect(page.getByTestId('v100-opt-77')).toBeFocused()

    // Programmatic selection applies without a request and survives windowing
    await page.getByTestId('v100-set-77').click()
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
    await page.getByTestId('v100-mount-40-46').click()
    await expect(page.getByTestId('v100-listbox').locator('[data-selected]')).toHaveCount(0)
    await page.getByTestId('v100-mount-75-80').click()
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-selected', 'true')

    // Viewport resize keeps identity, metadata, and the single tab stop
    await page.setViewportSize({ width: 700, height: 500 })
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-posinset', '78')
    await expect(page.getByTestId('v100-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('v100-listbox').locator('[role="dialog"],form,input')).toHaveCount(
      0
    )
  })
});

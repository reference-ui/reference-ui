/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus composition gates', () => {
  test('RF-COMP-03: responsive picker grid combines geometry, RTL, and typeahead', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusReflowFixture', {
      loop: false,
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-reflow-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`flow-${i}`)

    await cell(0).focus()
    // keyboard.type routes non-ASCII through insertText (no keydown), so
    // dispatch a real bubbling keydown: the kernel path stays genuine.
    await cell(0).dispatchEvent('keydown', { key: 'é' })
    await expect(cell(4)).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(cell(5)).toBeFocused()

    await page.getByTestId('reflow-narrow').click()
    await cell(1).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()

    // LTR control: row head holds, then RTL reverses the horizontal axis.
    await cell(2).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(2)).toBeFocused()

    await page.getByTestId('reflow-toggle-dir').click()
    await cell(2).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(3)).toBeFocused()

    await cell(1).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()
    await expect(page.locator('[data-testid="reflow-composite"] [tabindex="0"]')).toHaveCount(1)
  })
});

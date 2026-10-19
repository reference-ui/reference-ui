/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-05: Listbox should preserve native root and option contracts for each orientation', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeProps')
    await expect(page.getByTestId('nat-root')).toBeVisible()

    const vertical = page.getByTestId('nat-vertical')
    const horizontal = page.getByTestId('nat-horizontal')
    const vAlpha = page.getByTestId('nat-v-alpha')

    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
    await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal')

    // Consumer props survive on both hosts
    await expect(vertical).toHaveAttribute('data-consumer', 'v-root')
    await expect(vertical).toHaveClass(/consumer-vertical/)
    await expect(horizontal).toHaveAttribute('data-consumer', 'h-root')
    await expect(vAlpha).toHaveAttribute('data-consumer', 'v-opt')
    await expect(vAlpha).toHaveClass(/consumer-opt/)
    expect(
      await vertical.evaluate(el => (el as HTMLElement).style.borderWidth)
    ).toBe('3px')
    expect(await vAlpha.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('5px')

    // Exact native refs
    await page.getByTestId('nat-report').click()
    const report = JSON.parse((await page.getByTestId('nat-ref-report').textContent()) ?? '{}')
    expect(report).toEqual({
      vRoot: 'HTMLDivElement',
      vRootTag: 'DIV',
      hRoot: 'HTMLDivElement',
      vOpt: 'HTMLDivElement',
      vOptTag: 'DIV',
    })

    // Keyboard interaction leaves consumer props untouched; root events fire
    await vAlpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('nat-v-bravo')).toBeFocused()
    await expect(vertical).toHaveAttribute('data-consumer', 'v-root')
    await expect(vAlpha).toHaveAttribute('data-consumer', 'v-opt')
    await vAlpha.click()
    await expect(page.getByTestId('nat-events')).toHaveText('["root-click"]')
  })
});

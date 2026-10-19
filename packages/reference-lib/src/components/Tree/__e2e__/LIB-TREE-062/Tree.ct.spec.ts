/**
 * Tree composition gates and browser proofs. Pins hierarchy rendering,
 * controlled selection and expansion with deterministic emission, APG
 * keyboard traversal with RTL mirroring, typeahead over the visible set,
 * dynamic recovery, Combobox bridge commits and virtual focus, ShadowRoot
 * traversal, and an accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Tree parity', () => {
  test('TR-ENV-03: Tree should discover focus and traverse visible hierarchy inside a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Shadow')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const host = page.getByTestId('tree-shadow-host')
    const docs = page.getByTestId('tree-shadow-item-docs')
    const resume = page.getByTestId('tree-shadow-item-resume')
    const budget = page.getByTestId('tree-shadow-item-budget')
    const readme = page.getByTestId('tree-shadow-item-readme')
    const notes = page.getByTestId('tree-shadow-item-notes')
    const display = page.getByTestId('tree-shadow-value-display')
    const expandedDisplay = page.getByTestId('tree-shadow-expanded-display')

    await expect(docs).toBeVisible()
    await expect(docs).toHaveAttribute('aria-expanded', 'true')

    // Owning-root focus discovery: the document sees only the host while the
    // shadow root holds the real focused item — Tree never consults
    // document.activeElement.
    await docs.getByText('Documents').click()
    await expect(docs).toBeFocused()
    await expect(display).toHaveText('Selected: shadow-docs')
    const docActive = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset?.testid ?? null
    )
    expect(docActive).not.toBe('tree-shadow-item-docs')
    const shadowActive = () =>
      host.evaluate(
        (el) =>
          (el.shadowRoot?.activeElement as HTMLElement | null)?.dataset?.testid ?? null
      )
    await expect.poll(shadowActive).toBe('tree-shadow-item-docs')

    // Vertical traversal matches light DOM.
    await page.keyboard.press('ArrowDown')
    await expect(resume).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(budget).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(resume).toBeFocused()

    // Home/End.
    await page.keyboard.press('End')
    await expect(notes).toBeFocused()
    await page.keyboard.press('Home')
    await expect(docs).toBeFocused()

    // Horizontal: collapse removes children from the visible set...
    await page.keyboard.press('ArrowLeft')
    await expect(docs).toHaveAttribute('aria-expanded', 'false')
    await expect(resume).toHaveCount(0)
    await expect(expandedDisplay).not.toContainText('shadow-docs')
    await page.keyboard.press('ArrowDown')
    await expect(readme).toBeFocused()

    // ...and expand restores them, focusing the first child on second press.
    await docs.focus()
    await page.keyboard.press('ArrowRight')
    await expect(docs).toHaveAttribute('aria-expanded', 'true')
    await expect(resume).toBeVisible()
    await expect(expandedDisplay).toContainText('shadow-docs')
    await page.keyboard.press('ArrowRight')
    await expect(resume).toBeFocused()

    // Typeahead over the visible set, then Enter commits through onChange.
    await page.keyboard.press('b')
    await expect(budget).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Selected: shadow-budget')

    // RTL resolved through the light-DOM host chain: ArrowLeft expands.
    const rtlDocs = page.getByTestId('tree-shadow-rtl-item-docs')
    const rtlExpander = page.getByTestId('tree-shadow-rtl-expander-docs')
    await expect(rtlDocs).toBeVisible()
    await rtlExpander.click()
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'false')
    await rtlDocs.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'false')
  })
});

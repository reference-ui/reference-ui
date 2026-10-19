/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-03: Field should embed Textarea and Select with the same descendant selector', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const embeddedTextarea = page.getByTestId('embedded-textarea')
    const standaloneTextarea = page.getByTestId('standalone-textarea')

    await expect(standaloneTextarea).toBeVisible()
    await page.waitForTimeout(300)

    const standaloneTa = await standaloneTextarea.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const embeddedTa = await embeddedTextarea.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    expect(standaloneTa.borderWidth).toBe('1px')
    expect(embeddedTa.borderWidth).toBe('0px')
    expect(embeddedTa.borderStyle).toBe('none')

    const embeddedSelect = page.getByTestId('embedded-select')
    const standaloneSelect = page.getByTestId('standalone-select')

    const standaloneSel = await standaloneSelect.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const embeddedSel = await embeddedSelect.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    expect(standaloneSel.borderWidth).toBe('1px')
    expect(embeddedSel.borderWidth).toBe('0px')
    expect(embeddedSel.borderStyle).toBe('none')
  })
});

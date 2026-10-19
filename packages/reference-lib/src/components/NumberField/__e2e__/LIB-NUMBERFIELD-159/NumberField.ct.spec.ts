/**
 * NumberField browser proof: anatomy, keys, editing, commit, and forms.
 * Mounts the story fixtures to pin the single-root DOM shape, stepping
 * and coarse deltas, native-preserving edits (caret, paste, composition,
 * IME), commit policies, locale parsing and formatting, form submit and
 * reset, Shadow DOM scoping, and an axe-clean scan.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

// Real-paste helpers (probed headless-green on Chromium/Firefox/WebKit
// 2026-09-28): stagePaste copies with focus outside the field — the prep
// blur noops on echoed/in-range drafts — then refocuses; callers pin the
// caret portably (select-all + arrow collapse, never Home) and press
// ControlOrMeta+v.

test.describe('NumberField CT', () => {
  test('NF-EDIT-10: Unreadable clipboard data fails open without fabricating an edit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(String(error)))
    const input = page.getByTestId('number-field-input')
    await input.click()
    await input.evaluate(el => {
      el.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }))
    })
    await expect(input).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await input.evaluate(el => {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        get() {
          throw new Error('denied')
        },
      })
      el.dispatchEvent(event)
    })
    await expect(input).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await expect(input).toBeFocused()
    expect(errors).toEqual([])
  })
});

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
  test('NF-DOM-09: Missing, empty, or unresolved stepper names fail at runtime instead of receiving English fallback text', async ({
    mount,
    page,
  }) => {
    // one descriptive dev diagnostic per offender (absent
    // naming + unresolving labelledby); neither renders nor activates.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await mount('components/NumberField/NumberField/UnnamedStepperFixture')

    const diags = () => errors.filter(t => t.includes('Reference UI: NumberField'))
    // Polling gates on the layout effects that deliver the diagnostics.
    await expect.poll(() => diags().length, { timeout: 5000 }).toBe(2)

    const field = page.getByTestId('unnamed-field')
    await expect(field).toBeVisible()
    await expect(page.getByTestId('unnamed-dec')).toHaveCount(0)
    await expect(page.getByTestId('unnamed-inc')).toHaveCount(0)
    await expect(field.getByRole('button')).toHaveCount(0)
    await expect(page.getByTestId('unnamed-input')).toHaveValue('42')

    expect(diags().some(t => /Decrement.*requires a nonempty/.test(t))).toBe(true)
    expect(diags().some(t => /Increment.*does not resolve/.test(t))).toBe(true)
  })
});

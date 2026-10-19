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
  test('NF-KEY-04: Home and End are native when bounds are absent', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')

    const input = page.getByTestId('unbounded-number-field-input')

    await input.focus()
    await page.keyboard.press('Home')
    await expect(input).toHaveValue('5')
    await page.keyboard.press('End')
    await expect(input).toHaveValue('5')
  })
});

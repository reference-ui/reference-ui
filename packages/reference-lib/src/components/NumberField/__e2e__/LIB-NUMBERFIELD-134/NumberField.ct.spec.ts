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
  test('NF-KEY-03: Alt-modified arrows remain completely native and unhandled', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    for (const mod of ['Alt', 'Control', 'Meta'] as const) {
      await page.keyboard.down(mod)
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.up(mod)
    }
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })
});

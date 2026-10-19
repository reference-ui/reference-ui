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
  test('NF-EDIT-14: Rejected live requests do not create a hidden numeric store', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const hidden = page.locator('input[name="qty"]')
    // Echo off while clean: every live request is rejected by the parent —
    // each publishes, nothing sticks, no hidden store forms.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    for (const text of ['1', '12', '42']) {
      await input.fill(text)
      await expect(input).toHaveValue(text)
      await expect(display).toHaveText('Value: 5')
      await expect(hidden).toHaveValue('5')
    }
    await expect(log).toHaveText('log: 1,12,42')
    // The commit retry derives from the current buffer, still prop-based.
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('log: 1,12,42,42')
    await expect(display).toHaveText('Value: 5')
    await expect(hidden).toHaveValue('5')
    await expect(input).toHaveValue('5')
  })
});

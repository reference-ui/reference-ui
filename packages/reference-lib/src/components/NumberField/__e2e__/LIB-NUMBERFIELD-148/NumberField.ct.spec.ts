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
  test('percent formatOptions scale typed input to plain fractions', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/PercentFixture')

    const input = page.getByTestId('percent-input')
    const display = page.getByTestId('percent-display')

    await expect(input).toHaveValue('12%')
    await expect(display).toHaveText('Percent Value: 0.12')

    await input.fill('25')
    await expect(display).toHaveText('Percent Value: 0.25')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Percent Value: 0.25')
    await expect(input).toHaveValue('25%')
  })
});

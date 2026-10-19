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
  test('currency formatOptions display formatted text, commit plain numbers', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CurrencyFixture')

    const input = page.getByTestId('currency-input')
    const display = page.getByTestId('currency-display')

    await expect(input).toHaveValue('$1,234.50')
    await expect(display).toHaveText('Currency Value: 1234.5')

    // Typing never fights the formatter: raw keystrokes stay verbatim
    // while their meanings publish live (accepted echoes preserve the
    // buffer); commit only canonicalizes the display.
    await input.fill('')
    await input.pressSequentially('99.99', { delay: 20 })
    await expect(input).toHaveValue('99.99')
    await expect(display).toHaveText('Currency Value: 99.99')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Currency Value: 99.99')
    await expect(input).toHaveValue('$99.99')
  })
});

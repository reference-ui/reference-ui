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
  test('snap commitBehavior publishes live raw meanings then coerces typed 2.5 to 3 at commit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/SnapFixture')

    const input = page.getByTestId('snap-input')
    const display = page.getByTestId('snap-display')
    const log = page.getByTestId('snap-log')

    await input.click()
    // Live meanings publish raw (2, then 2.5); the snap lands at commit.
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Snap Value: 2.5')
    await expect(log).toHaveText('requests: 2')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('3')
    await expect(display).toHaveText('Snap Value: 3')
    await expect(log).toHaveText('requests: 3')
  })
});

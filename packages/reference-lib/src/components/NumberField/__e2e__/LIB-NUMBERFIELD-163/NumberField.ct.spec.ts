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
  test('NF-COMMIT-02: Enter commits without moving focus or synthesizing form submission', async ({
    mount,
    page,
  }) => {
    // Standalone half: no form exists, so no submission path is reachable.
    await mount('components/NumberField/NumberField/StepperFixture')
    const standalone = page.getByTestId('number-field-input')
    await standalone.click()
    await standalone.fill('43')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 43')
    await expect(standalone).toHaveValue('43')
    await expect(standalone).toBeFocused()
    // In-form half: consumer key handler first, one commit, focus retained,
    // and at most the browser's single implicit submit — never a second
    // NumberField-synthesized submission (the engine calls no submit API).
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    await input.click()
    // Live 9 lands on fill (echo on); Enter only runs the consumer key
    // handler — the commit itself is a no-op with no second request.
    await input.fill('9')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: request,key')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 9')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 9')
    await expect(input).toBeFocused()
    const submits = await page.getByTestId('commit-lab-submits').textContent()
    expect(['submits: 0', 'submits: 1']).toContain(submits?.trim())
  })
});

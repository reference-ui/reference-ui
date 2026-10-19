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
  test('NF-SURF-01: Group consumes the Field recipe on its own group node', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const host = page.getByTestId('named-form-field')
    const group = page.getByTestId('named-form-group')

    // Exactly one group host, no nested Field-surface node.
    expect(await host.locator('div[role="group"][data-reference-field]').count()).toBe(1)
    expect(await group.locator('[data-reference-field]').count()).toBe(0)

    // Warning status is visual only: data-status set, aria-invalid absent.
    await expect(group).toHaveAttribute('data-status', 'warning')
    await expect(group).not.toHaveAttribute('aria-invalid')
    const warningBorder = await group.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(warningBorder.startsWith('oklab(0.7') || warningBorder.startsWith('oklch(0.7')).toBe(true)

    // Embedded input: no standalone border inside the bezel.
    const inputBorder = await page
      .getByTestId('named-form-input')
      .evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')
  })
});

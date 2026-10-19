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
  test('NF-DYNAMIC-02: Locale and effective format changes atomically replace parser, formatter, grammar, and inputMode', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')
    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    const hidden = page.locator('input[name="price"]')
    await expect(input).toHaveAttribute('inputmode', 'numeric')
    await input.click()
    await input.fill('999')
    // Live 999 lands (echo on); the locale swap de-formats from 999.
    await expect(log).toHaveText('log: 999')
    await input.evaluate(el => {
      ;(window as unknown as { __nfNode: unknown }).__nfNode = el
    })
    await page.getByTestId('format-swap-de').click()
    const expectedDe = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(999)
    )
    await expect(input).toHaveValue(expectedDe)
    await expect(input).toHaveAttribute('inputmode', 'numeric')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(hidden).toHaveValue('999')
    await expect(log).toHaveText('log: 999')
    await expect(input).toBeFocused()
    const sameAfterLocale = await input.evaluate(
      el => el === (window as unknown as { __nfNode: unknown }).__nfNode
    )
    expect(sameAfterLocale).toBe(true)
    // Scientific grammar flips inputMode with the same atomic replacement.
    await input.fill('1500')
    await expect(log).toHaveText('log: 999,1500')
    await page.getByTestId('format-swap-scientific').click()
    const expectedSci = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { notation: 'scientific' }).format(1500)
    )
    await expect(input).toHaveValue(expectedSci)
    await expect(input).toHaveAttribute('inputmode', 'text')
    await expect(log).toHaveText('log: 999,1500')
    const sameAfterNotation = await input.evaluate(
      el => el === (window as unknown as { __nfNode: unknown }).__nfNode
    )
    expect(sameAfterNotation).toBe(true)
  })
});

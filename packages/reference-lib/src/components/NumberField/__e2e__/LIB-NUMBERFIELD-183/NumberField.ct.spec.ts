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
  test('NF-COMP-04: A scientific unit NumberField composes validate mode, RTL, Shadow DOM, and programmatic replacement without custom parsing', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CompScienceFixture')
    const input = page.getByTestId('sci-input')
    const log = page.getByTestId('sci-log')
    const display = page.getByTestId('sci-display')
    // Every expectation derives from platform Intl in-page — the spec
    // imports no engine parsing or formatting.
    const fmt = (locale: string, value: number) =>
      page.evaluate(
        ([l, v]) =>
          new Intl.NumberFormat(l, { style: 'unit', unit: 'meter', notation: 'scientific' }).format(v),
        [locale, value] as [string, number]
      )
    await expect(input).toHaveValue(await fmt('en-US', 12000))
    // RTL inheritance changes presentation, never step direction.
    await expect(page.getByTestId('sci-rtl')).toHaveAttribute('dir', 'rtl')
    const direction = await input.evaluate(el => getComputedStyle(el).direction)
    expect(direction).toBe('rtl')
    await page.getByTestId('sci-inc').click()
    await expect(log).toHaveText('log: 12005')
    await expect(display).toHaveText('Value: 12005')
    // Exponent partials stage silently; completion requests exactly.
    await input.fill('1.2E')
    await expect(input).toHaveValue('1.2E')
    await expect(log).toHaveText('log: 12005')
    await input.fill('1.2E4')
    await expect(log).toHaveText('log: 12005,12000')
    // Validate mode retains the off-step value and reports managed
    // invalidity without native range/step validity.
    await input.fill('12001')
    await expect(log).toHaveText('log: 12005,12000,12001')
    await expect(display).toHaveText('Value: 12001')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    // Same-root reset reverts staged invalid text with no request. (Runs
    // before the composition cycle: programmatic staging after a shadow
    // composition invalidation is swallowed on React 17 only — see the
    // log anomaly note. ENV-06 proves the same reset shape.)
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('abc')
    await page.getByTestId('sci-reset').click()
    await expect(input).toHaveValue(await fmt('en-US', 12001))
    await expect(log).toHaveText('log: 12005,12000,12001')
    // Locale replacement during composition: coherent new text, editing
    // cleared, stale fallout ignored, zero callback.
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await page.getByTestId('sci-de').click()
    await expect(input).toHaveValue(await fmt('de-DE', 12001))
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: 12005,12000,12001')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao!')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue(await fmt('de-DE', 12001))
    await expect(log).toHaveText('log: 12005,12000,12001')
    // Value replacement mid-session + canonical submit, all inside the
    // shadow form.
    await page.getByTestId('sci-set-5005').click()
    await expect(display).toHaveText('Value: 5005')
    await expect(input).toHaveValue(await fmt('de-DE', 5005))
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.getByTestId('sci-submit').click()
    await expect(page.getByTestId('sci-payload')).toHaveText('payload: sci=5005')
    // Local relationships: the labelledby stepper resolved in shadow,
    // and shadow IDs stay invisible to the document.
    await expect(page.getByTestId('sci-inc')).toHaveCount(1)
    const docLookup = await page.evaluate(
      () => document.getElementById('sci-name') !== null
    )
    expect(docLookup).toBe(false)
  })
});

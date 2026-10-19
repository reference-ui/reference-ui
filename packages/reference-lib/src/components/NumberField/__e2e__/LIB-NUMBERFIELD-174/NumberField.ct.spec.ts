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
  test('NF-EDIT-18: A locale or effective format change during active composition replaces from latest controlled state and ignores stale fallout', async ({
    mount,
    page,
  }) => {
    // One fresh run per replacement kind: locale, currency, notation,
    // numbering system. Each run composes prose over a selection, swaps
    // without blur, then feeds stale end/input fallout.
    const runs: Array<{
      swap: string
      expected: { formatOptions: Intl.NumberFormatOptions; locale: string }
      inputMode: string
    }> = [
      {
        swap: 'format-swap-de',
        expected: { formatOptions: { style: 'currency', currency: 'USD' }, locale: 'de-DE' },
        inputMode: 'numeric',
      },
      {
        swap: 'format-swap-eur',
        expected: { formatOptions: { style: 'currency', currency: 'EUR' }, locale: 'en-US' },
        inputMode: 'numeric',
      },
      {
        swap: 'format-swap-scientific',
        expected: { formatOptions: { notation: 'scientific' }, locale: 'en-US' },
        inputMode: 'text',
      },
      {
        swap: 'format-swap-nu-arab',
        expected: {
          formatOptions: { style: 'currency', currency: 'USD', numberingSystem: 'arab' },
          locale: 'en-US',
        },
        inputMode: 'numeric',
      },
    ]
    for (const run of runs) {
      const lab = await mount('components/NumberField/NumberField/FormatSwapFixture')
      const input = page.getByTestId('format-swap-input')
      const log = page.getByTestId('format-swap-log')
      const expectedText = await page.evaluate(
        ({ value, locale, formatOptions }) =>
          new Intl.NumberFormat(locale, formatOptions).format(value),
        { value: 1234.5, locale: run.expected.locale, formatOptions: run.expected.formatOptions }
      )
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
      await page.getByTestId(run.swap).click()
      // Coherent replacement: new text, grammar inputMode, selection at
      // the formatted end, editing cleared, focus kept, zero callback.
      await expect(input).toHaveValue(expectedText)
      await expect(input).toHaveAttribute('inputmode', run.inputMode)
      await expect(input).not.toHaveAttribute('data-editing', '')
      await expect(input).toBeFocused()
      await expect(log).toHaveText('log: none')
      const caret = await input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
      expect(caret).toEqual([expectedText.length, expectedText.length])
      // Stale fallout never restores old grammar or publishes.
      await input.evaluate(el => {
        const target = el as HTMLInputElement
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
        target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
        setter.call(target, 'ni3hao!')
        target.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await expect(input).toHaveValue(expectedText)
      await expect(log).toHaveText('log: none')
      await lab.unmount()
    }
  })
});

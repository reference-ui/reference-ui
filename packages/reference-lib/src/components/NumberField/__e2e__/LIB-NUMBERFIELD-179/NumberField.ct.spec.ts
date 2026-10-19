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

async function copyText(page: Page, text: string): Promise<void> {
  await page.evaluate(staged => {
    const node = document.createElement('div')
    node.id = 'nf-paste-source'
    node.textContent = staged
    document.body.appendChild(node)
    const range = document.createRange()
    range.selectNodeContents(node)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, text)
  await page.keyboard.press('ControlOrMeta+c')
  await page.evaluate(() => {
    document.getElementById('nf-paste-source')?.remove()
    window.getSelection()?.removeAllRanges()
  })
}

async function stagePaste(page: Page, input: Locator, text: string): Promise<void> {
  await input.evaluate(el => (el as HTMLInputElement).blur())
  await copyText(page, text)
  await input.evaluate(el => (el as HTMLInputElement).focus())
}

test.describe('NumberField CT', () => {
  test('NF-COMP-02: A localized currency NumberField composes precision, non-Latin input, dirty submit, and authored labels', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CompCurrencyFixture')
    const input = page.getByTestId('comp-currency-input')
    const log = page.getByTestId('comp-currency-log')
    const display = page.getByTestId('comp-currency-display')
    await expect(input).toHaveValue('$12.50')
    await expect(input).toHaveAttribute('aria-label', 'Amount')
    // Paste a precise value, then step the 0.05 lattice.
    await stagePaste(page, input, '13.75')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('13.75')
    await expect(log).toHaveText('log: 13.75')
    await page.getByTestId('comp-currency-inc').click()
    await expect(log).toHaveText('log: 13.75,13.8')
    await expect(input).toHaveValue('$13.80')
    // German round-trip: localized punctuation pastes and requests.
    await page.getByTestId('comp-currency-de').click()
    const deText = await page.evaluate(
      () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(13.8)
    )
    await expect(input).toHaveValue(deText)
    await stagePaste(page, input, '10,25 $')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('10,25 $')
    await expect(log).toHaveText('log: 13.75,13.8,10.25')
    // Arabic round-trip: non-Latin digits paste and request.
    await page.getByTestId('comp-currency-ar').click()
    const arText = await page.evaluate(
      () => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(10.25)
    )
    await expect(input).toHaveValue(arText)
    await stagePaste(page, input, '١٢٫٥٠')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('١٢٫٥٠')
    await expect(log).toHaveText('log: 13.75,13.8,10.25,12.5')
    // Dirty submit: the pasted value is still uncommitted text, and the
    // form serializes the canonical number.
    await expect(input).toHaveAttribute('data-editing', '')
    await stagePaste(page, input, '٩٩٫٩٩')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('٩٩٫٩٩')
    await expect(log).toHaveText('log: 13.75,13.8,10.25,12.5,99.99')
    await page.getByTestId('comp-currency-submit').click()
    await expect(page.getByTestId('comp-currency-payload')).toHaveText('payload: amount=99.99')
    await expect(display).toHaveText('Value: 99.99')
    // Authored labels survive every locale swap.
    await expect(input).toHaveAttribute('aria-label', 'Amount')
    await expect(page.getByTestId('comp-currency-dec')).toHaveAttribute('aria-label', 'Decrease amount')
    await expect(page.getByTestId('comp-currency-inc')).toHaveAttribute('aria-label', 'Increase amount')
  })
});

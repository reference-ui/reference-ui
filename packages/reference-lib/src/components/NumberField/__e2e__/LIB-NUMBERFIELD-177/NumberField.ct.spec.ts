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
  test('NF-EDIT-09: Invalid paste leaves text, selection, controlled state, and callbacks unchanged', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const order = page.getByTestId('commit-lab-order')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Letters at a pinned caret: prevented, zero mutation.
    await stagePaste(page, input, 'abc')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('5')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 5')
    // Malformed grouping over a range: the range selection survives.
    await stagePaste(page, input, '1,0,0')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('5')
    await expect(caret()).resolves.toEqual([0, 1])
    await expect(log).toHaveText('log: none')
    // Duplicate decimal: set up a valid decimal, then reject the dot.
    await stagePaste(page, input, '1.5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(log).toHaveText('log: 1.5')
    await stagePaste(page, input, '.')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 1.5')
    await expect(display).toHaveText('Value: 1.5')
    // Overflow: nonfinite results never cross the callback.
    await stagePaste(page, input, '1e999')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([0, 3])
    await expect(log).toHaveText('log: 1.5')
    // Foreign-script digits reject like letters under a Latin locale.
    await stagePaste(page, input, '١٢')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([0, 3])
    await expect(log).toHaveText('log: 1.5')
    // Consumer paste observation precedes every prevention: all six
    // pastes logged 'paste' while only the valid setup paste (3rd)
    // produced a 'request' — every invalid paste was observed, then
    // stopped with no request after it. (Prep arrows/select-all also log
    // 'key', so the order is asserted structurally, not verbatim.)
    const entries = ((await order.textContent()) ?? '')
      .replace('order: ', '')
      .split(',')
      .filter(e => e === 'paste' || e === 'request')
    expect(entries.filter(e => e === 'paste')).toHaveLength(6)
    expect(entries.filter(e => e === 'request')).toHaveLength(1)
    expect(entries).toEqual(['paste', 'paste', 'paste', 'request', 'paste', 'paste', 'paste'])
    // Second sign + conflicting affix on the unbounded currency field.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    const currencyCaret = () =>
      currency.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await stagePaste(page, currency, '-5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-5')
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
    // (The prep blur commits the setup draft, so the field shows the
    // formatted '-$5.00' from here on — prevention still holds.)
    await stagePaste(page, currency, '-')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-$5.00')
    await expect(currencyCaret()).resolves.toEqual([0, 0])
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
    await stagePaste(page, currency, '€9')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-$5.00')
    await expect(currencyCaret()).resolves.toEqual([0, 6])
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
  })
});

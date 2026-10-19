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
  test('NF-EDIT-08: Valid paste splices at the current selection and retains the resulting caret', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Full replacement, then end / middle / ranged insertions — each
    // paste lands natively with the caret after the payload and exactly
    // one parseable request.
    await stagePaste(page, input, '4')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(log).toHaveText('log: 4')
    await stagePaste(page, input, '2')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('42')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(log).toHaveText('log: 4,42')
    await stagePaste(page, input, '.')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4.2')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(log).toHaveText('log: 4,42,4.2')
    await stagePaste(page, input, '5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 4,42,4.2,4.5')
    // Supported localized digits paste and request identically
    // (ar-EG: ASCII live spelling formats to Eastern Arabic at commit).
    await mount('components/NumberField/NumberField/CompositionFixture')
    const arInput = page.getByTestId('composition-input')
    const arLog = page.getByTestId('composition-log')
    const arDisplay = page.getByTestId('composition-display')
    const arCaret = () =>
      arInput.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await stagePaste(page, arInput, '١٢')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(arInput).toHaveValue('١٢')
    await expect(arCaret()).resolves.toEqual([2, 2])
    await expect(arLog).toHaveText('log: 12')
    await expect(arDisplay).toHaveText('Value: 12')
    await stagePaste(page, arInput, '34')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(arInput).toHaveValue('34')
    await expect(arLog).toHaveText('log: 12,34')
    // Locale formatting applies only at commit — the live buffer keeps
    // the pasted spelling until the boundary.
    await page.getByTestId('composition-outside').click()
    await expect(arInput).toHaveValue('٣٤')
    await expect(arDisplay).toHaveText('Value: 34')
    // Currency: the pasted plain digits stay ungrouped live and format
    // at commit.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await stagePaste(page, currency, '2500')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('2500')
    await expect(currencyDisplay).toHaveText('Currency Value: 2500')
    await page.keyboard.press('Enter')
    await expect(currency).toHaveValue('$2,500.00')
    await expect(currencyDisplay).toHaveText('Currency Value: 2500')
  })
});

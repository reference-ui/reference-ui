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
  test('NF-PARSE-07: Disabling grouping removes pasted group tokens without changing the number or caret model', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NoGroupingFixture')
    const input = page.getByTestId('no-grouping-input')
    const log = page.getByTestId('no-grouping-log')
    const display = page.getByTestId('no-grouping-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // US grouped form: separators strip, the number holds, the caret
    // lands after the stripped payload.
    await stagePaste(page, input, '1,000')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1000')
    await expect(caret()).resolves.toEqual([4, 4])
    await expect(log).toHaveText('log: 1000')
    await expect(display).toHaveText('Value: 1000')
    // Committed display stays ungrouped.
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('1000')
    await expect(display).toHaveText('Value: 1000')
    // German grouped form under de-DE: the dot strips (never a decimal).
    await page.getByTestId('no-grouping-de').click()
    await expect(input).toHaveValue('1000')
    await stagePaste(page, input, '2.500')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('2500')
    await expect(caret()).resolves.toEqual([4, 4])
    await expect(log).toHaveText('log: 1000,2500')
    await expect(display).toHaveText('Value: 2500')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2500')
    await expect(display).toHaveText('Value: 2500')
  })
});

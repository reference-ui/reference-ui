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
  test('NF-EDIT-02: Valid partial edits remain visible while impossible ordinary insertions are canceled', async ({
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
    // Sign partial stages verbatim with no callback; a letter into it
    // cancels with text, caret, and dirty state intact.
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('-', { delay: 20 })
    await expect(input).toHaveValue('-')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: none')
    await input.pressSequentially('a', { delay: 20 })
    await expect(input).toHaveValue('-')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 5')
    // Decimal partial completes and requests; a duplicate dot cancels.
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('1.5', { delay: 20 })
    await expect(input).toHaveValue('1.5')
    await expect(log).toHaveText('log: 1,1.5')
    await input.pressSequentially('.', { delay: 20 })
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 1,1.5')
    // A second sign at the head cancels; the staged buffer persists.
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('-5', { delay: 20 })
    await expect(input).toHaveValue('-5')
    await expect(log).toHaveText('log: 1,1.5,-5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await input.pressSequentially('-', { delay: 20 })
    await expect(input).toHaveValue('-5')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: 1,1.5,-5')
    // Localized partials (de-DE comma decimal) stage; duplicates and
    // letters cancel; completion requests.
    await mount('components/NumberField/NumberField/NoGroupingFixture')
    const deInput = page.getByTestId('no-grouping-input')
    const deLog = page.getByTestId('no-grouping-log')
    const deCaret = () =>
      deInput.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await page.getByTestId('no-grouping-de').click()
    await deInput.click()
    await deInput.pressSequentially(',', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deCaret()).resolves.toEqual([1, 1])
    await expect(deInput).toHaveAttribute('data-editing', '')
    await expect(deLog).toHaveText('log: none')
    await deInput.pressSequentially(',', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deCaret()).resolves.toEqual([1, 1])
    await deInput.pressSequentially('a', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deLog).toHaveText('log: none')
    await deInput.pressSequentially('5', { delay: 20 })
    await expect(deInput).toHaveValue(',5')
    await expect(deLog).toHaveText('log: 0.5')
  })
});

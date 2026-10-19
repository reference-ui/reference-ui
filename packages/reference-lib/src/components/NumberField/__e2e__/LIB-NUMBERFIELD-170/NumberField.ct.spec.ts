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
  test('NF-EDIT-16: Cut, undo, redo, and ranged replacement stay browser-native with requests only for new meanings', async ({
    mount,
    page,
    browserName,
  }) => {
    // Zero command-interception code exists in the engine (this
    // class): cut/undo/redo/select-all reach the input natively and only
    // newly parseable resulting text publishes (live-request rules).
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    await input.click()
    // Select-all + type replaces (click caret is unpinned); Home/End are
    // bound-handled here, so arrows navigate (native, EDIT-06).
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('43', { delay: 20 })
    await expect(input).toHaveValue('43')
    await expect(log).toHaveText('log: 4,43')
    await expect(display).toHaveText('Value: 43')
    // Cut all: native empty + live null request.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+x')
    await expect(input).toHaveValue('')
    await expect(log).toHaveText('log: 4,43,null')
    await expect(display).toHaveText('Value: None')
    // Undo/redo traverse natively on every engine, but WebKit walks two
    // history levels per command (typing-level + cut-level, one input
    // event per level — observed native behavior, probed 2026-09-28)
    // while Chromium/Firefox pop one level. Either way no command is
    // canceled and every newly parseable meaning publishes (EDIT-06
    // per-engine precedent for native-outcome branches).
    const webkitHistory = browserName === 'webkit'
    await page.keyboard.press('ControlOrMeta+z')
    if (webkitHistory) {
      await expect(input).toHaveValue('5')
      await expect(log).toHaveText('log: 4,43,null,43,5')
      await expect(display).toHaveText('Value: 5')
    } else {
      await expect(input).toHaveValue('43')
      await expect(log).toHaveText('log: 4,43,null,43')
      await expect(display).toHaveText('Value: 43')
    }
    // Redo re-clears natively (two levels again on WebKit).
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(input).toHaveValue('')
    const redoLog = webkitHistory ? 'log: 4,43,null,43,5,43,null' : 'log: 4,43,null,43,null'
    await expect(log).toHaveText(redoLog)
    // Ranged replacement over typed text: native splice, one request.
    await input.pressSequentially('123', { delay: 20 })
    await expect(log).toHaveText(`${redoLog},1,12,123`)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('9')
    await expect(input).toHaveValue('923')
    await expect(log).toHaveText(`${redoLog},1,12,123,923`)
    // Localized tokens: cutting inside currency text stays native and
    // only a newly parseable meaning publishes.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await currency.click()
    await expect(currency).toHaveValue('$1,234.50')
    // Portable caret-to-start: bare Home is a caret no-op on FF/WebKit
    // macOS builds (EDIT-06 pins the platform rule), so
    // select-all + ArrowLeft collapse instead of Home. Same SPEC step:
    // cut the individual currency token.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ControlOrMeta+x')
    await expect(currency).toHaveValue('1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(currency).toHaveValue('$1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
  })
});

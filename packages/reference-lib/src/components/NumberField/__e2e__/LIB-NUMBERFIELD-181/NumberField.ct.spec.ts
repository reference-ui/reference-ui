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
  test('NF-DYNAMIC-05: Interactive replacement cancels pending key, repeat, composition, and failed-submit work', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/DynamicFixture')
    const input = page.getByTestId('dynamic-input')
    const inc = page.getByTestId('dynamic-inc')
    const log = page.getByTestId('dynamic-log')
    const display = page.getByTestId('dynamic-display')
    const submits = page.getByTestId('dynamic-submits')
    // Programmatic toggle clicks: the mouse stays held on the stepper, so
    // only the replacement — never a drag/leave — ends the session.
    const flip = (id: string) =>
      page.getByTestId(id).evaluate(el => (el as HTMLElement).click())
    const hold = async (target: typeof inc = inc) => {
      const box = await target.boundingBox()
      expect(box).not.toBeNull()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
    }
    const activeTag = () => page.evaluate(() => document.activeElement?.tagName ?? 'NONE')
    // V1: disable mid-hold ends the repeat; the stale release never steps;
    // the disabled input blurs natively (body) and stays there — the
    // engine never refocuses; a fresh press steps.
    await hold()
    await expect(log).toHaveText('log: 6')
    await expect(input).toBeFocused()
    await flip('dynamic-toggle-disabled')
    await expect(inc).toBeDisabled()
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6')
    await expect(activeTag()).resolves.toBe('BODY')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6')
    await flip('dynamic-toggle-disabled')
    await expect(inc).not.toBeDisabled()
    await expect(activeTag()).resolves.toBe('BODY')
    await inc.click()
    await expect(log).toHaveText('log: 6,7')
    // V2: read-only mid-hold ends the repeat identically, but the
    // focusable input keeps native focus throughout.
    await hold()
    await expect(log).toHaveText('log: 6,7,8')
    await expect(input).toBeFocused()
    await flip('dynamic-toggle-readonly')
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8')
    await expect(input).toBeFocused()
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8')
    await flip('dynamic-toggle-readonly')
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9')
    // V3: stepper removal mid-hold ends the session; re-added steppers need
    // a fresh press.
    await hold()
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await flip('dynamic-toggle-steppers')
    await expect(inc).toHaveCount(0)
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await flip('dynamic-toggle-steppers')
    await expect(inc).toHaveCount(1)
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9,10,11')
    // V4: owner-root replacement mid-hold remounts clean; focus follows
    // native removal rules (body); fresh edits step from control.
    await hold()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await flip('dynamic-toggle-owner')
    await expect(page.getByTestId('dynamic-portal-host').locator('[data-testid="dynamic-field"]')).toHaveCount(1)
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await expect(activeTag()).resolves.toBe('BODY')
    await expect(input).toHaveValue('12')
    await flip('dynamic-toggle-owner')
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    // V5: disable mid-composition cancels the suspension; focus follows
    // the native rule (body); the stale end is ignored; a fresh edit
    // publishes immediately after re-enable. Whether disable COMMITS is
    // engine-defined (probed): Chromium never delivers disable-blur to
    // React onBlur, so the draft freezes staged; Firefox/WebKit deliver
    // it, so the ordinary blur boundary commits (invalid reverts + failed
    // boundary, cleared by the fresh edit below).
    await input.click()
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await flip('dynamic-toggle-disabled')
    // Focus settles asynchronously on WebKit (V1's hold-wait covers the
    // same landing); Chromium/Firefox move synchronously.
    await page.waitForTimeout(300)
    await expect(activeTag()).resolves.toBe('BODY')
    const frozenDraft = browserName === 'chromium'
    await expect(input).toHaveValue(frozenDraft ? 'ni3hao' : '13')
    if (frozenDraft) {
      await expect(input).toHaveAttribute('data-editing', '')
    } else {
      await expect(input).not.toHaveAttribute('data-editing', '')
    }
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await input.evaluate(el => {
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(input).toHaveValue(frozenDraft ? 'ni3hao' : '13')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await flip('dynamic-toggle-disabled')
    await input.fill('42')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42')
    // V6: key repeats are gated per event; a disabled repeat never steps.
    await input.click()
    await page.keyboard.press('ArrowUp')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43')
    await flip('dynamic-toggle-disabled')
    await input.evaluate(el => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    })
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43')
    await flip('dynamic-toggle-disabled')
    await input.click()
    await page.keyboard.press('ArrowUp')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44')
    // V7: authoritative replacement clears failed-submit work; submit flows.
    // Staged programmatically: fill() routes through the EDIT-02 typed
    // gate, so letters must bypass beforeinput like EDIT-17 staging.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('abc')
    await page.getByTestId('dynamic-outside').click()
    await expect(input).toHaveValue('44')
    // FORM-11 probe pattern: the engine listener runs first, so the
    // probe's defaultPrevented reflects blocking (the fixture counts
    // delivered events either way).
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="dynamic-form"]') as HTMLFormElement
      ;(window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits = []
      form.addEventListener('submit', e => {
        ;(window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits.push(e.defaultPrevented)
      })
    })
    const preventedFlags = () =>
      page.evaluate(() => (window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits)
    await page.getByTestId('dynamic-submit').click()
    await expect(preventedFlags()).resolves.toEqual([true])
    await page.getByTestId('dynamic-set-99').click()
    await expect(display).toHaveText('Value: 99')
    await page.getByTestId('dynamic-submit').click()
    await expect(preventedFlags()).resolves.toEqual([true, false])
    // V8: authoritative replacement mid-hold ends the repeat; the stale
    // release click is suppressed; only a fresh press steps.
    const dec = page.getByTestId('dynamic-dec')
    await hold(dec)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await flip('dynamic-set-99')
    await expect(display).toHaveText('Value: 99')
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await inc.click()
    await expect(display).toHaveText('Value: 100')
  })
});

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
  test('NF-ENV-06: Open ShadowRoot operation scopes focus, IDs, listeners, and same-root forms to the owner root', async ({
    mount,
    page,
  }) => {
    // Console spy attaches before mount; the light-DOM calibration
    // stepper (unresolvable labelledby) proves the spy hears NumberField
    // diagnostics, so the shadow silence below is meaningful.
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await mount('components/NumberField/NumberField/ShadowFixture')
    const qty = page.getByTestId('shadow-qty-input')
    const price = page.getByTestId('shadow-price-input')
    const qtyLog = page.getByTestId('shadow-qty-log')
    const priceLog = page.getByTestId('shadow-price-log')
    const shadowActiveTestId = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="shadow-host"]')
        const active = host?.shadowRoot?.activeElement as HTMLElement | null
        return active?.getAttribute('data-testid') ?? active?.tagName ?? 'NONE'
      })
    // Edit + step both shadow fields through composed events.
    await qty.fill('7')
    await expect(qtyLog).toHaveText('log: 7')
    await page.getByTestId('shadow-qty-inc').click()
    await expect(qtyLog).toHaveText('log: 7,8')
    await price.fill('12')
    await expect(priceLog).toHaveText('log: 12')
    // Stepper labelledby resolves in shadow (a document-global lookup
    // finds no target and renders nothing): the stepper exists + steps.
    const priceInc = page.getByTestId('shadow-price-inc')
    await expect(priceInc).toHaveCount(1)
    await priceInc.click()
    await expect(priceLog).toHaveText('log: 12,13')
    // Native shadow focus semantics: the shadow root owns the input,
    // the document only sees the host.
    await qty.click()
    await expect(shadowActiveTestId()).resolves.toBe('shadow-qty-input')
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName ?? 'NONE'))
      .toBe('DIV')
    // Input labelledby resolves in shadow: no unnamed-Input diagnostic
    // fires for the shadow-only target; the calibration diagnostic lands.
    await expect
      .poll(() => errors.filter(e => e.includes('does not resolve')).length)
      .toBe(1)
    expect(errors.filter(e => e.includes('has no accessible name'))).toEqual([])
    expect(errors.filter(e => e.includes('collides across independent roots'))).toEqual([])
    await expect(page.getByTestId('shadow-cal-inc')).toHaveCount(0)
    // Same-root form: canonical payload from both shadow fields.
    await page.getByTestId('shadow-submit').click()
    await expect(page.getByTestId('shadow-payload')).toHaveText('payload: qty=8,price=13')
    // Same-root reset: staged invalid text reverts to control, no request.
    await qty.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(qty).toHaveValue('abc')
    await page.getByTestId('shadow-reset').click()
    await expect(qty).toHaveValue('8')
    await expect(qtyLog).toHaveText('log: 7,8')
    // Shadow IDs are invisible to document-global lookup.
    const docLookup = await page.evaluate(() => ({
      span: document.getElementById('shadow-qty-name') !== null,
      input: document.getElementById(
        (
          document
            .querySelector('[data-testid="shadow-host"]')
            ?.shadowRoot?.querySelector('[data-testid="shadow-qty-input"]') as HTMLInputElement | null
        )?.id ?? 'shadow-missing-id'
      ) !== null,
    }))
    expect(docLookup).toEqual({ span: false, input: false })
  })
});

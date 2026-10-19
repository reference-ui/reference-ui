/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-ENV-03: Listbox should preserve roving, typeahead, and virtual scrolling inside a ShadowRoot', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/Shadow')
    await expect(page.getByTestId('sh-root')).toBeVisible()
    await expect(page.getByTestId('sh-alpha')).toBeVisible()

    const shadowActive = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="sh-host"]')
        const active = host?.shadowRoot?.activeElement
        return active?.getAttribute?.('data-testid') ?? null
      })

    // Tab crosses into the shadow tree; arrows rove in composed order.
    // WebKit skips the sh-mount button between sh-before and
    // the shadow host, so ONE Tab reaches sh-alpha there;
    // tab1=sh-alpha, tab2=sh-opt-0 are pinned.
    await page.getByTestId('sh-before').focus()
    await page.keyboard.press('Tab')
    if (browserName !== 'webkit') {
      await page.keyboard.press('Tab')
    }
    expect(await shadowActive()).toBe('sh-alpha')
    await page.keyboard.press('ArrowDown')
    expect(await shadowActive()).toBe('sh-bravo')

    // Typeahead resolves inside the shadow tree without selecting
    await page.keyboard.type('c')
    expect(await shadowActive()).toBe('sh-charlie')
    await page.waitForTimeout(1100)
    await page.keyboard.press('Space')
    await expect(page.getByTestId('sh-calls')).toHaveText('["charlie"]')

    // Virtual scrolling consults the owning root, not the light DOM
    await page.getByTestId('sh-opt-1').evaluate(el => (el as HTMLElement).focus())
    expect(await shadowActive()).toBe('sh-opt-1')
    await page.keyboard.type('z')
    await expect(page.getByTestId('sh-scroll-log')).toHaveText('[15]')
    await page.getByTestId('sh-mount-13-17').click()
    expect(await shadowActive()).toBe('sh-opt-15')
    await expect(page.getByTestId('sh-opt-15')).toHaveAttribute('aria-posinset', '16')
  })
});

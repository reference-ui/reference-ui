/**
 * Calendar browser proofs: grid rendering, selection, navigation,
 * locale presentation, keyboard moves, and constrained states. Mounts
 * the story machines and asserts one-request-per-gesture discipline
 * with stable tab stops in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

// Landing-sequence engine scope: Safari/WebKit never delivers
// click-focus to buttons/links (mousedown blurs to body) and its native Tab
// order skips them, honoring text controls + explicit tabindex stops only.
// `engineOf` sniffs the Playwright project (`react19` on agentct Chromium,
// `react19-firefox`/`react19-webkit` on the sweep vehicle) so specs can
// compensate delivery or assert the deterministic platform outcome.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('Calendar CT', () => {
  test('CA-STATE-04/CA-SINGLE-04: out-of-bounds days are natively disabled; unavailable days stay focusable but silent', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/Constrained')

    for (const blocked of ['2024-04-04', '2024-04-21']) {
      const button = page.locator(`button[data-date="${blocked}"]`)
      await expect(button).toBeDisabled()
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('data-disabled', '')
    }
    // Unavailable: focusable — no native disabled, aria-disabled,
    // data-unavailable. (Playwright's toBeEnabled treats aria-disabled as
    // disabled, so focusability is asserted by focusing directly.)
    const unavailable = page.locator('button[data-date="2024-04-12"]')
    await expect(unavailable).not.toHaveAttribute('disabled', '')
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await expect(unavailable).toHaveAttribute('data-unavailable', '')
    await expect(unavailable).not.toHaveAttribute('data-disabled', '')
    await unavailable.focus()
    await expect(unavailable).toBeFocused()
    await expect(page.locator('button[data-date="2024-04-10"]')).toBeEnabled()

    // Synthetic dispatch bypasses native disabled suppression, so the
    // guard itself is what keeps out-of-bounds dates silent.
    await page.locator('button[data-date="2024-04-04"]').dispatchEvent('click')
    await expect(page.getByTestId('con-changes')).toHaveText('none')

    // Real gestures on the unavailable day are silent in every modality
    // and leave the roving tab stop untouched. Force bypasses Playwright's
    // aria-disabled actionability gate; the click itself is still trusted.
    await unavailable.click({ force: true })
    await unavailable.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press(' ')
    await expect(page.getByTestId('con-changes')).toHaveText('none')
    await expect(page.getByTestId('con-month-reqs')).toHaveText('none')
    await expect(page.locator('button[data-date="2024-04-05"]')).toHaveAttribute('tabindex', '0')

    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(page.getByTestId('con-changes')).toHaveText('2024-04-10')
  })
});

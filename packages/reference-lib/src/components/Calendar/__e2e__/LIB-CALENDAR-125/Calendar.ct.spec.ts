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

test.describe('Calendar view defaulting + environments (VIEW-13, DAY-14, ENV)', () => {
  test('CA-ENV-03: focus, labels, announcements, and preview work inside an open ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/ShadowRange')

    const shadowActiveDate = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="shadow-host"]')!
        const active = host.shadowRoot!.activeElement
        return active?.getAttribute?.('data-date') ?? null
      })

    // Tab enters the shadow tree (the document sees only the host) and
    // reaches the grid's pending-start tab stop through the header.
    await page.getByTestId('shadow-before').click()
    await page.keyboard.press('Tab')
    const hostFocused = await page.evaluate(
      () =>
        document.activeElement?.getAttribute('data-testid') === 'shadow-host'
    )
    expect(hostFocused).toBe(true)
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
    expect(await shadowActiveDate()).toBe('2024-04-10')

    // Arrow movement stays inside the root.
    await page.keyboard.press('ArrowRight')
    expect(await shadowActiveDate()).toBe('2024-04-11')

    // Full accessible labels resolve locally.
    await expect(page.locator('button[data-date="2024-04-10"]')).toHaveAttribute(
      'aria-label',
      'Wednesday, 10 April 2024'
    )

    // Hover previews the pending interval across the shadow boundary.
    await page.locator('button[data-date="2024-04-15"]').hover()
    await expect(page.locator('button[data-date="2024-04-15"]')).toHaveAttribute(
      'data-range-end',
      ''
    )

    // Cross-month keyboard focus waits for the controlled month, then
    // lands once with exactly one live heading mutation (CA-VIEW-11 count).
    await page.locator('button[data-date="2024-04-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('shadow-month-reqs')).toHaveText('2024-05')
    expect(await shadowActiveDate()).toBe('2024-04-30')
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]')!
      const node = host.shadowRoot!.querySelector('[data-reference-calendar-heading]')!
      ;(window as unknown as { __headingMutations: number }).__headingMutations = 0
      new MutationObserver((records) => {
        const w = window as unknown as { __headingMutations: number }
        for (const record of records) {
          if (record.type === 'characterData') w.__headingMutations += 1
          for (const added of record.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) w.__headingMutations += 1
          }
        }
      }).observe(node, { characterData: true, childList: true, subtree: true })
    })
    await page.getByTestId('shadow-accept-month').click()
    expect(await shadowActiveDate()).toBe('2024-05-01')
    expect(
      await page.evaluate(
        () => (window as unknown as { __headingMutations: number }).__headingMutations
      )
    ).toBe(1)

    // Day ids are unique inside the root and invisible to the document.
    const idCheck = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]')!
      const ids = [...host.shadowRoot!.querySelectorAll('[id]')].map((el) => el.id)
      return {
        unique: new Set(ids).size === ids.length,
        documentSeesFirst: document.getElementById(ids[0]) !== null,
      }
    })
    expect(idCheck).toEqual({ unique: true, documentSeesFirst: false })
  })
});

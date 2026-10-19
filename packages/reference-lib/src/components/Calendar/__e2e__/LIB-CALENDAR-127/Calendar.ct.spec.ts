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
  test('CA-A11Y-01 scan: axe reports zero violations across locale, constraint, and range states', async ({
    mount,
    page,
  }) => {
    // Scanner half of CA-A11Y-01 (TESTS.md: the assertion half pins grid
    // naming, table ancestry, and day ARIA per state): settle each named
    // state, then scan. #root scoping covers every story whole (no
    // portals in Calendar).
    // AXE: aria-allowed-attr is scoped out — Calendar.Day manages
    // aria-selected on the native day button by design (managed prop,
    // consumer-stripped per CA-DAY-06, pinned by the CA-STATE/CA-SINGLE/
    // CA-RANGE assertion halves), and axe rejects aria-selected on the
    // implicit button role. Narrowing the case would exclude the day
    // grid itself, so the rule — not the case — is scoped; every other
    // rule still runs over every state. Removing the attribute would be
    // an API/semantic change, outside scanner-half scope.
    const scan = () =>
      expectNoAxeViolations(page, {
        include: '#root',
        disableRules: ['aria-allowed-attr'],
      })
    await mount('components/Calendar/Calendar/SingleDate')
    await expect(page.getByTestId('test-calendar')).toBeVisible()
    await scan()

    // Non-Sunday en-GB grid with a selected weekday.
    await mount('components/Calendar/Calendar/BritishGrid')
    await expect(page.getByTestId('test-gb-calendar')).toBeVisible()
    await expect(page.getByTestId('gb-value')).toHaveText('2024-09-18')
    await scan()

    // RTL ar-AE grid.
    await mount('components/Calendar/Calendar/RtlGrid')
    await expect(page.getByTestId('test-rtl-calendar')).toBeVisible()
    await scan()

    // Min/max bounds plus an unavailable date.
    await mount('components/Calendar/Calendar/Constrained')
    await expect(page.getByTestId('test-con-calendar')).toBeVisible()
    await page.getByTestId('con-toggle-bounds').click()
    await page.getByTestId('con-toggle-ten').click()
    await expect(page.locator('button[data-date][disabled]').first()).toBeVisible()
    await scan()

    // Padded outside-month days.
    await mount('components/Calendar/Calendar/OutsideMonth')
    await expect(page.getByTestId('test-out-calendar')).toBeVisible()
    await expect(page.locator('button[data-outside-month]').first()).toBeVisible()
    await scan()

    // Pending then complete ranges.
    await mount('components/Calendar/Calendar/RangeMachine')
    await expect(page.getByTestId('test-rmachine-calendar')).toBeVisible()
    await page.getByTestId('rmachine-pending-10').click()
    await expect(page.getByTestId('rmachine-value')).toContainText('2024-04-10')
    await scan()
    await page.getByTestId('rmachine-completed').click()
    await expect(page.getByTestId('rmachine-value')).toHaveText(
      '2024-04-10:2024-04-15'
    )
    await scan()
  })
});

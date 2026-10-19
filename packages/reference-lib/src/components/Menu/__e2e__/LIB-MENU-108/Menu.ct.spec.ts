/**
 * Menu browser proofs: composition gates plus the root-level parity
 * re-targets across DOM, focus, typeahead, and action rows. Mounts the
 * story fixtures and asserts levels, roving, and one-selection
 * discipline in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Menu dynamic choice and link parts', () => {

  test('MN-LINK-09: Dynamic links use current href, label, state, and close policy', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/LinksDynamic')
    await page.getByTestId('btn-dyn-link-trigger').click()
    await expect(page.getByTestId('menu-dyn-link-root')).toBeFocused()
    const docs = page.getByTestId('dyn-link-docs')
    await docs.focus()
    await page.keyboard.press('o')
    await expect(docs).toBeFocused()

    // Retarget: current text matches, stale text does not, href is current.
    await page.getByTestId('btn-dyn-link-retarget').evaluate(el => (el as HTMLElement).click())
    await expect(docs).toHaveAttribute('href', '#new-section')
    await page.waitForTimeout(1200)
    await docs.focus()
    await page.keyboard.press('n')
    await expect(docs).toBeFocused()
    await page.waitForTimeout(1200)
    await page.getByTestId('dyn-link-api').focus()
    await page.keyboard.press('o')
    await expect(page.getByTestId('dyn-link-api')).toBeFocused()

    // Current close policy controls dismissal; navigation still runs once.
    await page.getByTestId('btn-dyn-link-stay').evaluate(el => (el as HTMLElement).click())
    await docs.click()
    await expect(page.getByTestId('menu-dyn-link-action')).toHaveText('Dyn Link Action: docs')
    expect(await page.evaluate(() => window.location.hash)).toBe('#new-section')
    await expect(page.getByTestId('menu-dyn-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-dyn-link-open-logs')).toHaveText(
      'Dyn Link Open Logs: true'
    )

    // Disabled links leave roving; reorder and removal stay current.
    await page.getByTestId('btn-dyn-link-disable').evaluate(el => (el as HTMLElement).click())
    await expect(docs).toHaveAttribute('aria-disabled', 'true')
    await page.getByTestId('btn-dyn-link-reorder').evaluate(el => (el as HTMLElement).click())
    const first = await page
      .getByTestId('menu-dyn-link-root')
      .locator('[role="menuitem"]')
      .first()
      .getAttribute('data-testid')
    expect(first).toBe('dyn-link-api')
    await page.getByTestId('btn-dyn-link-remove').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-link-api')).toHaveCount(0)
  })
})

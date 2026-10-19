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

test.describe('Menu LinkItem (FEATURES #3)', () => {

  test('MN-LINK-07: Disabled link is skipped and inert on every route', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()
    const disabled = page.getByTestId('menu-link-disabled')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).not.toHaveAttribute('tabindex', '0')

    await page.getByTestId('menu-link-stay').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-link-plain')).toBeFocused()

    await disabled.click({ force: true })
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: None')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    expect(await page.evaluate(() => window.location.hash)).toBe('')

    await disabled.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: None')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
  })
})

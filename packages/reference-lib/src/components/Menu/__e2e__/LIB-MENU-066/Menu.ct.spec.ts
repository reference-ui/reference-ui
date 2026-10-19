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
  test('MN-LINK-01: LinkItem is a native anchor with menuitem semantics in roving order', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()
    const help = page.getByTestId('menu-link-help')
    await expect(help).toHaveAttribute('role', 'menuitem')
    expect(await help.evaluate(el => el.tagName.toLowerCase())).toBe('a')
    expect(await help.evaluate(el => el instanceof HTMLAnchorElement)).toBe(true)
    await expect(help).toHaveAttribute('href', '#help-section')
    await expect(page.getByTestId('menu-link-download')).toHaveAttribute('download', 'report.csv')
    await expect(page.getByTestId('menu-link-blank')).toHaveAttribute('target', '_blank')

    await help.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-link-download')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByTestId('menu-link-plain')).toBeFocused()
  })
})

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

test.describe('Menu Nested Submenus (FEATURES #1)', () => {
  test('MN-DOM-03: Submenu trigger exposes expansion and a stable relationship to content', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await expect(trigger).toHaveAttribute('role', 'menuitem')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-controls')

    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    const content = page.getByTestId('menu-sub-content')
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    if (!contentId) throw new Error('expected stable submenu content id')
    await expect(trigger).toHaveAttribute('aria-controls', contentId)

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    expect(await page.getByTestId('menu-sub-content').getAttribute('id')).toBe(contentId)
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)
  })
})

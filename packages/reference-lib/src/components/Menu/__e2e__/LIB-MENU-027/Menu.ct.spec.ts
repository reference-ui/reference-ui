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

test.describe('Menu parity (root-level re-targets)', () => {

  test('MN-DOM-03: Menu trigger exposes expansion and a stable relationship to content', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-controls')

    await trigger.click()
    const content = page.getByTestId('menu-content')
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    // The trigger controls the Popover layer, which owns the Menu.
    const controls = await trigger.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const controlled = page.locator(`[id="${controls}"]`)
    await expect(controlled).toHaveCount(1)
    await expect(controlled.getByTestId('menu-content')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await expect(page.getByTestId('menu-content')).toBeVisible()
    expect(await page.getByTestId('menu-content').getAttribute('id')).toBe(contentId)
  })
})

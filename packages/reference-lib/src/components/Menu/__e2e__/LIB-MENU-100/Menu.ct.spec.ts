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

test.describe('Menu placement and dynamic ownership', () => {
  test('MN-DOM-08: Submenu content uses the shared Popover engine from its trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    const content = page.getByTestId('menu-sub-content')
    await expect(content).toBeVisible()

    await expect(content).toHaveAttribute('data-side', 'right')
    await expect(content).toHaveAttribute('data-state', 'open')

    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()
    if (!triggerBox || !contentBox) throw new Error('expected trigger and content boxes')
    expect(contentBox.x).toBeGreaterThanOrEqual(triggerBox.x + triggerBox.width - 20)
    expect(Math.abs(contentBox.y - triggerBox.y)).toBeLessThan(48)

    // One stable id across viewport change; single positioned node.
    const id = await content.getAttribute('id')
    expect(id).toBeTruthy()
    await page.setViewportSize({ width: 700, height: 480 })
    await page.waitForTimeout(300)
    await expect(content).toBeVisible()
    expect(await content.getAttribute('id')).toBe(id)
    await expect(content).toHaveAttribute('data-side', 'right')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(1)
    await page.setViewportSize({ width: 800, height: 480 })
  })
})

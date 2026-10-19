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

test.describe('Menu Composition Gates & Browser Proofs', () => {

  test('MN-DOM-02: Keyboard roving focus highlights MenuItem with solid background and no outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Basic')
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')

    await trigger.click()
    await expect(content).toBeVisible()

    const itemEdit = page.getByTestId('menu-item-edit')
    const itemDuplicate = page.getByTestId('menu-item-duplicate')
    await expect(itemEdit).toBeVisible()

    // Focus first item
    await itemEdit.focus()
    await expect(itemEdit).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'item-focused')

    const itemStyles = await itemEdit.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        backgroundColor: s.backgroundColor,
        color: s.color,
      }
    })

    // No outline ring
    const isOutlineAbsent =
      itemStyles.outlineStyle === 'none' ||
      itemStyles.outlineWidth === '0px' ||
      itemStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      itemStyles.outlineColor === 'transparent' ||
      itemStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)

    // Solid background (not transparent)
    expect(itemStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(itemStyles.backgroundColor).not.toBe('transparent')
    expect(itemStyles.backgroundColor.includes('/ 0)')).toBe(false)

    // Arrow navigation down to duplicate item
    await page.keyboard.press('ArrowDown')
    await expect(itemDuplicate).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'item-duplicate-focused')

    // Escape closes menu and returns focus
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.waitForTimeout(300)
    await snap(page, 'escape-closed')
  })
})

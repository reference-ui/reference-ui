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

  test('MN-DOM-10: Mirrored default placement with explicit geometry passthrough', async ({
    mount,
    page,
  }) => {
    // LTR default resolves right-start.
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-content')).toHaveAttribute('data-side', 'right')

    // RTL default mirrors to left-start.
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    await page.getByTestId('menu-rtl-trigger').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-content')).toHaveAttribute('data-side', 'left')

    // Explicit geometry reaches Popover once; consumer transform survives.
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-explicit-trigger').click()
    await expect(page.getByTestId('menu-probe-explicit-root')).toBeFocused()
    await page.getByTestId('probe-explicit-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const explicit = page.getByTestId('probe-explicit-content')
    await expect(explicit).toBeVisible()
    await expect(explicit).toHaveAttribute('data-side', 'bottom')
    expect(await explicit.getAttribute('style')).toContain('translateX(4px)')
  })
})

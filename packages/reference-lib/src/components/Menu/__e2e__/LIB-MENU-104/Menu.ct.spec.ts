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

  test('MN-DYNAMIC-04: Submenu control relationships follow a trigger id change', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-id-trigger').click()
    await expect(page.getByTestId('menu-probe-id-root')).toBeFocused()
    const trigger = page.getByTestId('probe-id-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-id-item')).toBeFocused()
    const contentId = await page.getByTestId('probe-id-content').getAttribute('id')

    // The id update itself requests nothing and keeps expansion + control.
    await page
      .getByTestId('btn-probe-id-change')
      .evaluate(el => (el as HTMLElement).click())
    await expect(trigger).toHaveAttribute('id', 'probe-id-trigger-v2')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)
    await expect(page.locator('#probe-id-trigger-v1')).toHaveCount(0)
    await expect(page.locator('#probe-id-trigger-v2')).toHaveCount(1)
    await expect(page.getByTestId('menu-probe-id-logs')).toHaveText('Id Logs: idsub:onOpen')

    // Close and reopen resolve only to the live node.
    await page.getByTestId('probe-id-item').focus()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('probe-id-item')).toBeFocused()
    await expect(page.getByTestId('menu-probe-id-logs')).toHaveText(
      'Id Logs: idsub:onOpen,idsub:onDismiss,idsub:onOpen'
    )
    await expect(page.locator('#probe-id-trigger-v1')).toHaveCount(0)
  })
})

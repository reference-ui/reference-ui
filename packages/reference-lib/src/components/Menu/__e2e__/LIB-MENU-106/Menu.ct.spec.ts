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

  test('MN-LINK-06: Nested target and download links keep native effects with tree dismissal', async ({
    mount,
    page,
    context,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-nested-trigger').click()
    await expect(page.getByTestId('menu-link-nested-root')).toBeFocused()
    await page.getByTestId('menu-link-nested-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-link-nested-content')).toBeVisible()

    // _blank: the browser receives the exact target request, then one tree unwind.
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTestId('menu-link-nested-blank').click(),
    ])
    expect(popup.url()).toContain('#nested-blank')
    await popup.close()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: NestedBlank')
    await expect(page.getByTestId('menu-link-nested-logs')).toHaveText(
      'Nested Logs: nested:onOpen,nested:onDismiss'
    )
    await expect(page.getByTestId('menu-link-nested-root-logs')).toHaveText(
      'Nested Root Logs: true,false'
    )
    await expect(page.getByTestId('menu-link-nested-root')).toHaveCount(0)
  })
})

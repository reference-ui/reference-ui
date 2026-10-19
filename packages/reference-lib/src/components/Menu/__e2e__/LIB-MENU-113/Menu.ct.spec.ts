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

test.describe('Menu composition gates', () => {

  test('MN-COMP-05: Mixed link-and-command menu keeps native link gestures', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')

    // Plain activation navigates natively and dismisses by default.
    await page.getByTestId('btn-link-trigger').click()
    await page.getByTestId('menu-link-help').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)

    // Keyboard activation preserves navigation with default dismissal.
    // Settle the pointer-open entry focus first: it lands on a frame and
    // would otherwise steal focus back after our programmatic focus.
    await page.getByTestId('btn-link-trigger').click()
    const linkRoot = page.getByTestId('menu-link-root')
    await expect(linkRoot).toBeVisible()
    await expect(linkRoot).toBeFocused()
    const download = page.getByTestId('menu-link-download')
    await download.focus()
    await expect(download).toBeFocused()
    await download.press('Enter')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Download')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)

    // Alternate gestures stay native: no select, no dismiss.
    await page.getByTestId('btn-link-trigger').click()
    await page.keyboard.down('Meta')
    await page.getByTestId('menu-link-help').click()
    await page.keyboard.up('Meta')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Download')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()

    // Cancellation stops both navigation and dismissal.
    await page.getByTestId('menu-link-cancel').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: CancelObserved')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText(
      'Link Open Logs: true,false,true,false,true'
    )

    // Preserved-open links navigate without dismissing.
    await page.getByTestId('menu-link-stay').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Stay')
    expect(await page.evaluate(() => window.location.hash)).toBe('#stay-section')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
  })
})

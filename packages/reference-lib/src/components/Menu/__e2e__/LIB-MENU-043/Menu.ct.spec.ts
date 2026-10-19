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

  test('MN-ACT-08: Menu uses current item callbacks and disabled membership after rerender', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-dynamic-trigger').click()
    const alphaHandle = await page.getByTestId('dynamic-item-alpha').elementHandle()

    await page.getByTestId('btn-mutate-items').click()
    await expect(page.getByTestId('dynamic-item-alpha')).toHaveCount(0)
    expect(await alphaHandle!.evaluate(el => el.isConnected)).toBe(false)
    await expect(page.getByTestId('dynamic-item-bravo')).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('dynamic-item-delta').click()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: dyn:delta')
    await expect(page.getByTestId('menu-content-dynamic')).toHaveCount(0)

    await page.getByTestId('btn-dynamic-trigger').click()
    await page.getByTestId('dynamic-item-bravo').click({ force: true })
    await expect(page.getByTestId('menu-content-dynamic')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: dyn:delta')
  })
})

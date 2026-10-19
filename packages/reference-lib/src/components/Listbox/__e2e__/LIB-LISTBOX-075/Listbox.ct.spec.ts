/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-VIRT-10: Virtual Listbox should cancel an unresolved focus target when it unmounts during scroll work', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualUnmount')
    await expect(page.getByTestId('vu-root')).toBeVisible()

    // Navigate toward an unmounted target, then unmount before the window lands
    await page.getByTestId('vu-opt-4').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vu-scroll-log')).toHaveText('[5]')

    // Observe exactly the unmount window: mount-time render noise (css()
    // static misses, React 18's primitive `ref`-as-prop warning) predates it.
    const problems: string[] = []
    page.on('pageerror', err => problems.push(`pageerror: ${err.message}`))
    page.on('console', msg => {
      if (msg.type() === 'error') {
        problems.push(`error: ${msg.text()}`)
      } else if (msg.type() === 'warning' && !msg.text().includes('[reference-ui] css()')) {
        problems.push(`warning: ${msg.text()}`)
      }
    })
    await page.getByTestId('vu-unmount').click()
    await expect(page.getByTestId('vu-listbox')).toHaveCount(0)

    // The late window update lands on nothing: no callbacks, no focus, no noise
    await page.getByTestId('vu-mount-5-10').click()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('vu-listbox')).toHaveCount(0)
    await expect(page.getByTestId('vu-scroll-log')).toHaveText('[5]')
    expect(problems).toEqual([])

    // A separately mounted Listbox remains fully interactive
    await page.getByTestId('vu-s-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vu-s-bravo')).toBeFocused()
    expect(problems).toEqual([])
  })
});

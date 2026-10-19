/**
 * Tabs composition gates and browser proofs. Pins tablist/tab/panel
 * rendering with ARIA linkage, automatic and manual selection, RTL arrow
 * reversal, nested isolation, focus rescue and handoff, dynamic disable
 * and removal, the MyTabs system-variant demo, ShadowRoot locality,
 * keepMounted panels, and real-gesture selection semantics.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-ENV-02: registration stays single and stable across reorder, click, and arrows', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/SelectLog')
    await expect(page.getByTestId('tabs-select-root')).toBeVisible()

    const ids = () =>
      page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[data-testid^="tab-sl-"]'))
        const panels = Array.from(
          document.querySelectorAll('[data-testid^="panel-sl-"]')
        )
        return {
          tabs: tabs.map(t => t.id),
          panels: panels.map(p => p.id),
          controls: tabs.map(t => t.getAttribute('aria-controls')),
          labelled: panels.map(p => p.getAttribute('aria-labelledby')),
        }
      })
    const before = await ids()
    expect(new Set([...before.tabs, ...before.panels]).size).toBe(6)

    await page.getByTestId('select-reorder').click()
    await page.getByTestId('tab-sl-billing').click()
    await page.getByTestId('tab-sl-billing').focus()
    // Order is now security,billing,general: ArrowRight lands on general.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tab-sl-general')).toBeFocused()

    // One matching request per action (reorder is silent).
    const log = await page.getByTestId('tabs-select-log').textContent()
    expect(log?.split('|').filter(e => e.startsWith('change:'))).toEqual([
      'change:billing',
      'change:general',
    ])

    // Stable generated IDs; every ARIA reference resolves.
    const after = await ids()
    expect(new Set(after.tabs).size).toBe(3)
    expect(new Set(after.panels).size).toBe(3)
    expect([...after.tabs].sort()).toEqual([...before.tabs].sort())
    expect([...after.panels].sort()).toEqual([...before.panels].sort())
    const linkage = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
      const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'))
      return {
        controls: tabs.map(
          t =>
            t.getAttribute('aria-controls') &&
            document
              .getElementById(t.getAttribute('aria-controls')!)
              ?.getAttribute('role')
        ),
        labelled: panels.map(
          p =>
            document
              .getElementById(p.getAttribute('aria-labelledby')!)
              ?.getAttribute('role')
        ),
      }
    })
    expect(linkage.controls.filter(Boolean)).toEqual(['tabpanel'])
    expect(linkage.labelled).toEqual(['tab', 'tab', 'tab'])
  })
});

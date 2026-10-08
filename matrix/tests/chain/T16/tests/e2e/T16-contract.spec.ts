import { expect, test } from '@playwright/test'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'

const shellTestIds = [
  't16-lib-icon',
  't16-direct-icon',
  't16-fixture-check-badge',
  't16-fixture-copy-badge',
]

/**
 * Published icons rule count: the icons baseSystem ships its compiled
 * utilities as text, one `reference-icons__*` selector per rule line. This
 * is the deliberate lib→icons coupling: lib layers the icons compile, so a
 * consumer must receive exactly this many icons rules — no more (a
 * duplicated layer copy) and no fewer (dropped rules). The count floats
 * with the icons compile instead of being pinned, so icons-side output
 * changes move the expectation instead of breaking it.
 */
function publishedIconsRuleCount(): number {
  const streams = (iconsBaseSystem as { streams?: Array<{ utilities?: unknown }> }).streams
  const utilities = streams?.[0]?.utilities
  if (typeof utilities !== 'string' || utilities.length === 0) {
    throw new Error('icons baseSystem has no published utilities stream')
  }
  return utilities.match(/^\s*\.reference-icons__[^\s{]*/gm)?.length ?? 0
}

test.describe('T16 — compose a prebuilt aliased-host package', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t16 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t16-root')).toBeVisible()
  })

  test('aliased-host shells are visible through both paths', async ({ page }) => {
    for (const testId of shellTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  test('zero `no compiled class` console warnings during render', async ({ page }) => {
    const misses: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('no compiled class')) {
        misses.push(message.text())
      }
    })
    await page.reload()
    await expect(page.getByTestId('chain-t16-root')).toBeVisible()
    // Let the runtime settle: every shell above must resolve every prop.
    for (const testId of shellTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
    expect(misses).toEqual([])
  })

  test('shell computed styles apply on every aliased host', async ({ page }) => {
    for (const testId of shellTestIds) {
      const styles = await page.getByTestId(testId).evaluate((element) => {
        const computed = getComputedStyle(element)
        return {
          display: computed.display,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          lineHeight: computed.lineHeight,
          flexShrink: computed.flexShrink,
        }
      })
      expect(styles.display, `${testId} display`).toMatch(/flex/)
      expect(styles.alignItems, `${testId} align-items`).toBe('center')
      expect(styles.justifyContent, `${testId} justify-content`).toBe('center')
      expect(styles.lineHeight, `${testId} line-height`).toBe('0px')
      expect(styles.flexShrink, `${testId} flex-shrink`).toBe('0')
    }
  })

  test('every emitted class has a backing rule', async ({ page }) => {
    const { unbacked, unexpectedForeign } = await page
      .getByTestId('chain-t16-root')
      .evaluate((root) => {
        // Owned classes are derived from the cascade itself, not a pinned
        // prefix list: the top-level `@layer` prelude names every composed
        // system, and each system mints classes as `<name>__*`. A newly
        // composed system lands in the prelude automatically, so its classes
        // are checked without touching this test. The `ref-*` globals are
        // not layer-scoped, so they stay a named convention. Residual
        // coupling: if the compiler ever mints a system class outside the
        // `<name>__` shape, it falls into `foreign` below and fails loudly
        // instead of passing silently.
        const preludes: string[][] = []
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              const layerRule = rule as CSSRule & { nameList?: string[] }
              if (layerRule.nameList && Array.isArray(layerRule.nameList)) {
                preludes.push(layerRule.nameList)
              }
            }
          } catch {
            continue
          }
        }
        const outer = preludes.find((names) => names.includes('chain-t16'))
        if (outer === undefined) {
          throw new Error('no top-level @layer prelude names chain-t16')
        }
        const ownedPrefixes = [...outer.map((name) => `${name}__`), 'ref-']
        const isOwned = (name: string): boolean =>
          ownedPrefixes.some((prefix) => name.startsWith(prefix))
        const classes = new Set<string>()
        const foreign = new Set<string>()
        for (const element of [root, ...root.querySelectorAll('*')]) {
          for (const name of element.classList) {
            if (isOwned(name)) {
              classes.add(name)
            } else {
              foreign.add(name)
            }
          }
        }
        const selectors: string[] = []
        const collect = (rules: CSSRuleList | null | undefined): void => {
          if (rules == null) return
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              selectors.push(rule.selectorText)
            } else if ('cssRules' in rule) {
              collect((rule as CSSGroupingRule).cssRules)
            }
          }
        }
        for (const sheet of document.styleSheets) {
          try {
            collect(sheet.cssRules)
          } catch {
            // Cross-origin sheets are opaque; the suite serves its own CSS
            // same-origin, so anything unreachable here cannot back our classes.
            continue
          }
        }
        return {
          unbacked: [...classes].filter(
            (name) => !selectors.some((selector) => selector.includes(`.${CSS.escape(name)}`))
          ),
          // Closed world: the only foreign classes on this page are the
          // `material-symbols*` hooks from the SVG library inside the icons.
          // Anything else foreign is a new system (or a mint-shape change)
          // the contract above does not understand — fail, don't skip.
          unexpectedForeign: [...foreign].filter(
            (name) => !name.startsWith('material-symbols')
          ),
        }
      })
    expect(unexpectedForeign).toEqual([])
    expect(unbacked).toEqual([])
  })

  test('icons rules arrive exactly once (no duplicated layer copy)', async ({ page }) => {
    const expected = publishedIconsRuleCount()
    expect(expected).toBeGreaterThan(0)
    const { total, duplicates } = await page.evaluate(() => {
      const selectors: string[] = []
      const collect = (rules: CSSRuleList | null | undefined): void => {
        if (rules == null) return
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText.includes('reference-icons__')) {
              selectors.push(rule.selectorText)
            }
          } else if ('cssRules' in rule) {
            collect((rule as CSSGroupingRule).cssRules)
          }
        }
      }
      for (const sheet of document.styleSheets) {
        try {
          collect(sheet.cssRules)
        } catch {
          continue
        }
      }
      const counts = new Map<string, number>()
      for (const selector of selectors) {
        counts.set(selector, (counts.get(selector) ?? 0) + 1)
      }
      return {
        total: selectors.length,
        duplicates: [...counts.entries()]
          .filter(([, count]) => count > 1)
          .map(([selector]) => selector),
      }
    })
    // Icons reach this page on one path only (transitively through lib's
    // layers), so every published rule must appear exactly once: a duplicate
    // means the layer copy shipped twice, a shortfall means rules were
    // dropped in composition.
    expect(duplicates).toEqual([])
    expect(total).toBe(expected)
  })
})

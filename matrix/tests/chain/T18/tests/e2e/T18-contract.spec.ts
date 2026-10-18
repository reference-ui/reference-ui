import { expect, test, type Page } from '@playwright/test'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'
import { baseSystem as libBaseSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as packageBaseSystem } from '@fixtures/primitive-named-library/baseSystem'
import { chipPaddingLg } from '@fixtures/primitive-named-library'
import {
  type ColorProbe,
  T18_CHIP_TEST_ID,
  T18_OWN_PREFIX,
  T18_PROBES,
  probeClass,
  probeStem,
} from '../../src/probe'

/**
 * T18 — ownership: a tag imported from a package is never an own host.
 *
 * Each probe renders through another package's bundled runtime, so its
 * class carries that package's system name, and the consumer sheet must back
 * exactly that class with the consumer token. The `provenance` probes are the
 * shapes the old name-based gate got wrong (plan probes 1, 1b, 2, 3): it
 * backed them under `chain-t18__` instead, so they painted nothing and the
 * runtime warned `no compiled class`.
 *
 * The provenance gate has landed (component-ownership plan S1, with S5
 * sending upstream rosters apart from the own hosts), so `PROVENANCE_LANDED`
 * is true and every probe must pass. Setting it back to false marks the
 * provenance tests expected-fail again; Playwright fails a marked test that
 * passes, so a stale mark cannot hide.
 *
 * Re-sync order (as T17): `ref sync` lib, rebuild the fixture, matrix
 * `setup --packages=@matrix/chain-t18 --sync`, then this spec. A stale
 * `.reference-ui` is the classic false pass.
 */
const PROVENANCE_LANDED = true
const PROVENANCE_PENDING =
  'RED until component-ownership S1 + S5: a Package-bound tag is still gated by name and backed under chain-t18__'

const PROBES: readonly ColorProbe[] = Object.values(T18_PROBES)
const EXTERNAL_TODAY = PROBES.filter((probe) => probe.status === 'external-today')
const PROVENANCE = PROBES.filter((probe) => probe.status === 'provenance')

type SystemLike = { streams?: Array<{ utilities?: unknown }> }

function streamUtilities(system: SystemLike): string {
  return (system.streams ?? [])
    .map((stream) => (typeof stream.utilities === 'string' ? stream.utilities : ''))
    .join('\n')
}

/** Every style-rule selector in the loaded sheets, nested groups included. */
async function loadedSelectors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
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
        continue
      }
    }
    return selectors
  })
}

/**
 * The system-qualified classes the loaded sheets back for one stem, e.g.
 * `['reference-ui__c_t18LibInk', 'primitive-named-library__c_t18LibInk']`.
 * Whole-class match: the stem must end the class name.
 */
function backedClassesForStem(selectors: readonly string[], stem: string): string[] {
  const pattern = new RegExp(`\\.([A-Za-z0-9-]+__${stem})(?![\\w-])`, 'g')
  const found = new Set<string>()
  for (const selector of selectors) {
    for (const match of selector.matchAll(pattern)) found.add(match[1])
  }
  return [...found].sort()
}

/** Classes on the probed elements (and their subtrees) that no loaded rule backs. */
async function unbackedClasses(page: Page, testIds: readonly string[] | null): Promise<{
  unbacked: string[]
  unexpectedForeign: string[]
}> {
  return page.getByTestId('chain-t18-root').evaluate((root, ids) => {
    // Owned prefixes come from the cascade itself, as in T16/T17: the
    // top-level `@layer` prelude names every composed system.
    const preludes: string[][] = []
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const layerRule = rule as CSSRule & { nameList?: string[] }
          if (layerRule.nameList && Array.isArray(layerRule.nameList)) preludes.push(layerRule.nameList)
        }
      } catch {
        continue
      }
    }
    const outer = preludes.find((names) => names.includes('chain-t18'))
    if (outer === undefined) throw new Error('no top-level @layer prelude names chain-t18')
    const ownedPrefixes = [...outer.map((name) => `${name}__`), 'ref-']
    const isOwned = (name: string): boolean => ownedPrefixes.some((prefix) => name.startsWith(prefix))

    const scopes =
      ids === null
        ? [root]
        : ids.map((id) => {
            const element = root.querySelector(`[data-testid="${id}"]`)
            if (element === null) throw new Error(`no probe ${id} under the root`)
            return element
          })
    const classes = new Set<string>()
    const foreign = new Set<string>()
    for (const scope of scopes) {
      for (const element of [scope, ...scope.querySelectorAll('*')]) {
        for (const name of element.classList) (isOwned(name) ? classes : foreign).add(name)
      }
    }

    const selectors: string[] = []
    const collect = (rules: CSSRuleList | null | undefined): void => {
      if (rules == null) return
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) selectors.push(rule.selectorText)
        else if ('cssRules' in rule) collect((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        collect(sheet.cssRules)
      } catch {
        continue
      }
    }
    const namesClass = (selector: string, name: string): boolean =>
      selector.split(`.${CSS.escape(name)}`).slice(1).some((rest) => !/^[\w\\-]/.test(rest))
    return {
      unbacked: [...classes].filter((name) => !selectors.some((selector) => namesClass(selector, name))).sort(),
      // Closed world: the only third-party classes are the icons' SVG hooks.
      unexpectedForeign: [...foreign].filter((name) => !name.startsWith('material-symbols')).sort(),
    }
  }, testIds)
}

/** The `no compiled class` runtime misses logged during one fresh render. */
async function compiledClassMisses(page: Page): Promise<string[]> {
  const misses: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('no compiled class')) misses.push(message.text())
  })
  await page.reload()
  await expect(page.getByTestId('chain-t18-root')).toBeVisible()
  for (const probe of PROBES) await expect(page.getByTestId(probe.testId)).toBeVisible()
  // The runtime holds miss candidates until `load`, then probes the sheets;
  // let that flush land before reading the log.
  await page.waitForLoadState('load')
  await page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100))))
  )
  return misses
}

async function computedValue(page: Page, probe: ColorProbe): Promise<string> {
  return page.getByTestId(probe.testId).evaluate((element, property) => {
    const computed = getComputedStyle(element)
    if (property === 'color') return computed.color
    const sides = [computed.paddingTop, computed.paddingRight, computed.paddingBottom, computed.paddingLeft]
    return new Set(sides).size === 1 ? sides[0] : sides.join(' ')
  }, probe.property)
}

test.describe('T18 — ownership by provenance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t18 root and every probe', async ({ page }) => {
    await expect(page.getByTestId('chain-t18-root')).toBeVisible()
    for (const testId of [...PROBES.map((probe) => probe.testId), T18_CHIP_TEST_ID]) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  test('probe tokens are absent from every published sheet (novelty)', () => {
    // A probe stem already shipped by lib, icons or the fixture could back a
    // class by coincidence, so a passing paint must come from this compile.
    const published = [libBaseSystem, iconsBaseSystem, packageBaseSystem]
      .map((system) => streamUtilities(system as SystemLike))
      .join('\n')
    for (const probe of PROBES) {
      expect(published, `${probe.token} in a published sheet`).not.toContain(probe.token)
      expect(published, `${probe.computed} in a published sheet`).not.toContain(probe.computed)
    }
  })

  test('each runtime mints its own system name on its probe (the half that already works)', async ({ page }) => {
    // Pins the runtime half, so the backing tests below can only fail on the
    // compile half: whoever renders the probe names the class, never the app.
    for (const probe of PROBES) {
      const classes = await page.getByTestId(probe.testId).evaluate((element) => [...element.classList])
      expect(classes, `${probe.testId} (${probe.shape})`).toContain(probeClass(probe))
      expect(classes, `${probe.testId} (${probe.shape})`).not.toContain(`${T18_OWN_PREFIX}${probeStem(probe)}`)
    }
  })

  for (const probe of PROBES) {
    test(`${probe.testId}: backed under ${probe.runtimePrefix} and paints the consumer token`, async ({ page }) => {
      test.fail(!PROVENANCE_LANDED && probe.status === 'provenance', PROVENANCE_PENDING)
      const stem = probeStem(probe)
      const backed = backedClassesForStem(await loadedSelectors(page), stem)
      // Today's provenance failure lands here: the stem is backed under
      // `chain-t18__` only, never under the runtime's system name.
      expect(backed, `classes the sheet backs for ${stem} (${probe.shape})`).toContain(probeClass(probe))
      expect(backed, `own-qualified rule for ${stem} (${probe.shape})`).not.toContain(`${T18_OWN_PREFIX}${stem}`)
      expect(await computedValue(page, probe), `${probe.testId} computed ${probe.property}`).toBe(probe.computed)
    })
  }

  test('chip owns size: no style class, its own padding, no rule for the owned value', async ({ page }) => {
    const chip = page.getByTestId(T18_CHIP_TEST_ID)
    const observed = await chip.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        size: element.getAttribute('data-size'),
        classes: [...element.classList],
        padding: [computed.paddingTop, computed.paddingRight, computed.paddingBottom, computed.paddingLeft],
      }
    })
    expect(observed.size).toBe('lg')
    expect(observed.classes.filter((name) => name.includes('__size_'))).toEqual([])
    expect(observed.padding).toEqual([chipPaddingLg, chipPaddingLg, chipPaddingLg, chipPaddingLg])
    expect(backedClassesForStem(await loadedSelectors(page), 'size_lg')).toEqual([])
  })

  test('every class on the external-today probes and the chip has a backing rule', async ({ page }) => {
    const ids = [...EXTERNAL_TODAY.map((probe) => probe.testId), T18_CHIP_TEST_ID]
    const { unbacked, unexpectedForeign } = await unbackedClasses(page, ids)
    expect(unexpectedForeign).toEqual([])
    expect(unbacked).toEqual([])
  })

  test('every runtime miss today belongs to a provenance probe', async ({ page }) => {
    // Guards the rest of the page while the red tier stands: any miss not
    // naming a provenance stem is a new break, not the known one.
    const stems = PROVENANCE.map((probe) => probeStem(probe))
    const misses = await compiledClassMisses(page)
    expect(misses.filter((message) => !stems.some((stem) => message.includes(stem)))).toEqual([])
  })

  test('every class under the root has a backing rule', async ({ page }) => {
    test.fail(!PROVENANCE_LANDED, PROVENANCE_PENDING)
    const { unbacked, unexpectedForeign } = await unbackedClasses(page, null)
    expect(unexpectedForeign).toEqual([])
    expect(unbacked).toEqual([])
  })

  test('zero `no compiled class` console warnings during render', async ({ page }) => {
    test.fail(!PROVENANCE_LANDED, PROVENANCE_PENDING)
    expect(await compiledClassMisses(page)).toEqual([])
  })
})

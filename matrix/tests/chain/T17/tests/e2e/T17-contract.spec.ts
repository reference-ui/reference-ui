import { expect, test } from '@playwright/test'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'
import { baseSystem as libBaseSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as fixtureBaseSystem } from '@fixtures/aliased-host-library'
import {
  T17_CSS_RGB,
  T17_CONTROL_CLASS,
  T17_CONTROL_RGB,
  T17_ICONS_PREFIX,
  T17_PROBE_COLOR_RGB,
  T17_PROBE_COLOR_TOKEN,
  T17_PROBE_ICON_CLASSES,
  T17_PROBE_RAW_HEX,
  T17_PROBE_SPACING_PX,
  T17_PROBE_SPACING_TOKEN,
  T17_PROBE_TONE_CLASS,
  T17_PROBE_TONE_COMPUTED,
  T17_PROBE_TONE_LINE_VAR,
  T17_PROBE_TONE_SURFACE_VAR,
  T17_PROBE_TONE_TOKEN,
} from '../../src/probe'

/**
 * T17 — fan-out contract: consuming prebuilt components with style props.
 *
 * Re-sync / re-materialize order this suite assumes (G1 §3 amendment ii):
 * rebuild the Rust binding → `ref sync` icons → `ref sync` lib →
 * re-materialize lib `react.mjs` → republish base systems → matrix
 * `setup --packages=@matrix/chain-t17 --sync` → run this spec. Native gate
 * evidence requires a fresh `ref sync` first (`pnpm agent playwright` does
 * not re-sync; a stale `.reference-ui` is the classic false pass).
 *
 * T16 stays frozen and keeps its `publishedIconsRuleCount` exact-equality;
 * this spec retires that gate in favour of structured accounting, because a
 * consumer compile legitimately adds its own foreign-qualified icons rules.
 */

/** The `reference-icons__p_t17ProbeGap` rule the external `<Field>` fan-out adds
 *  to the icons qualifier (every external want fans out to every composed
 *  system). It is a consumer-owned foreign stem, not an icons-canonical rule. */
const T17_FIELD_ICONS_CLASS = `${T17_ICONS_PREFIX}p_${T17_PROBE_SPACING_TOKEN}`

const expectedProbeIconsClasses = [...T17_PROBE_ICON_CLASSES, T17_FIELD_ICONS_CLASS]

type SystemLike = {
  name?: string
  streams?: Array<{ name?: string; utilities?: unknown }>
}

function streamUtilities(system: SystemLike): string {
  return (system.streams ?? [])
    .map((stream) => (typeof stream.utilities === 'string' ? stream.utilities : ''))
    .join('\n')
}

/** The icons package's published `reference-icons__*` selector set (7 rules). */
function publishedIconsSelectors(): string[] {
  const utilities = streamUtilities(iconsBaseSystem as SystemLike)
  return utilities.match(/^\s*\.reference-icons__[^\s{]*/gm)?.map((line) => line.trim()) ?? []
}

const TEST_IDS = {
  directIcon: 't17-direct-icon',
  libIcon: 't17-lib-icon',
  field: 't17-field',
  overrideBadge: 't17-override-badge',
  rawIcon: 't17-raw-icon',
  controlsIcon: 't17-controls-icon',
  cssIcon: 't17-css-icon',
  hoverIcon: 't17-hover-icon',
  toneIcon: 't17-tone-icon',
}

test.describe('T17 — style prebuilt components with consumer style props', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t17 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t17-root')).toBeVisible()
  })

  test('every probe is visible through the prebuilt paths', async ({ page }) => {
    for (const testId of Object.values(TEST_IDS)) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  test('probe token and value are absent from every published sheet (novelty)', () => {
    // If a probe stem/value already shipped inside icons/lib/fixture, a green
    // paint could be a coincidental hit instead of fan-out, so assert absence.
    const publishedText = [
      streamUtilities(iconsBaseSystem as SystemLike),
      streamUtilities(libBaseSystem as SystemLike),
      streamUtilities(fixtureBaseSystem as SystemLike),
    ].join('\n')
    expect(publishedText).not.toContain(T17_PROBE_COLOR_TOKEN)
    expect(publishedText).not.toContain(T17_PROBE_SPACING_TOKEN)
    expect(publishedText).not.toContain(T17_PROBE_COLOR_RGB)
    expect(publishedText).not.toContain(T17_PROBE_RAW_HEX.slice(1))
    expect(publishedText).not.toContain('00b7ab')
    // The tone is gated by name only: lib's published utilities already carry
    // percentages such as `41%`, so a value check would be a false alarm.
    expect(publishedText).not.toContain(T17_PROBE_TONE_TOKEN)
    expect(publishedText).not.toContain(T17_PROBE_TONE_LINE_VAR)
  })

  test('no reference-icons rule originates from lib own entry (pins C-T16)', () => {
    const libOwn = (libBaseSystem as SystemLike).streams?.find(
      (stream) => stream.name === 'reference-ui'
    )
    expect(typeof libOwn?.utilities).toBe('string')
    expect(libOwn?.utilities as string).not.toContain(T17_ICONS_PREFIX)
    // The lib baseSystem still carries the icons entry (transitively layered)…
    const libIcons = (libBaseSystem as SystemLike).streams?.find(
      (stream) => stream.name === 'reference-icons'
    )
    expect(typeof libIcons?.utilities).toBe('string')
    // …and it is canonical-only: no consumer probe leaked into the published entry.
    expect(libIcons?.utilities as string).not.toContain(T17_PROBE_COLOR_TOKEN)
  })

  test('consumer probe color paints on the direct-import and lib-re-export icons', async ({ page }) => {
    for (const testId of [TEST_IDS.directIcon, TEST_IDS.libIcon]) {
      const color = await page.getByTestId(testId).evaluate((element) => {
        return getComputedStyle(element).color
      })
      expect(color, `${testId} computed color`).toBe(T17_PROBE_COLOR_RGB)
    }
  })

  test('prebuilt root (Field) receives the consumer spacing token', async ({ page }) => {
    const padding = await page.getByTestId(TEST_IDS.field).evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        top: computed.paddingTop,
        right: computed.paddingRight,
        bottom: computed.paddingBottom,
        left: computed.paddingLeft,
      }
    })
    expect(padding).toEqual({
      top: T17_PROBE_SPACING_PX,
      right: T17_PROBE_SPACING_PX,
      bottom: T17_PROBE_SPACING_PX,
      left: T17_PROBE_SPACING_PX,
    })
  })

  test('override: consumer value beats the package default', async ({ page }) => {
    const badge = page.getByTestId(TEST_IDS.overrideBadge)
    const color = await badge.evaluate((element) => getComputedStyle(element).color)
    expect(color).toBe(T17_PROBE_COLOR_RGB)
    const classes = await badge.evaluate((element) => [...element.classList])
    // The consumer probe class is present…
    expect(classes).toContain(`aliased-host-library__c_${T17_PROBE_COLOR_TOKEN}`)
  })

  test('value-kind split: a raw CSS value paints from the consumer', async ({ page }) => {
    const color = await page.getByTestId(TEST_IDS.rawIcon).evaluate((element) => {
      return getComputedStyle(element).color
    })
    expect(color).toBe(T17_PROBE_COLOR_RGB)
  })

  test('consumer tone on color paints the ink at the line amount', async ({ page }) => {
    const color = await page.getByTestId(TEST_IDS.toneIcon).evaluate((element) => {
      return getComputedStyle(element).color
    })
    expect(color).toBe(T17_PROBE_TONE_COMPUTED)
  })

  test('tone rule reads the line amount: color is a line-role prop', async ({ page }) => {
    // The toned probe emits exactly one foreign-qualified rule. `color` draws
    // `--tones-*-line`, so that rule must reference the line var, never the surface var.
    const colorValues = await page.evaluate((className) => {
      const values: string[] = []
      const namesClass = (selector: string, name: string): boolean =>
        selector.split(`.${CSS.escape(name)}`).slice(1).some((rest) => !/^[\w\\-]/.test(rest))
      const collect = (rules: CSSRuleList | null | undefined): void => {
        if (rules == null) return
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            if (namesClass(rule.selectorText, className)) {
              values.push(rule.style.getPropertyValue('color'))
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
      return values
    }, T17_PROBE_TONE_CLASS)
    expect(colorValues).toHaveLength(1)
    expect(colorValues[0]).toContain(`var(${T17_PROBE_TONE_LINE_VAR})`)
    expect(colorValues[0]).not.toContain(T17_PROBE_TONE_SURFACE_VAR)
  })

  test('positive controls paint through prebuilt parts (className/style/native)', async ({ page }) => {
    const icon = page.getByTestId(TEST_IDS.controlsIcon)
    const observed = await icon.evaluate((element, controlClass) => {
      return {
        color: getComputedStyle(element).color,
        hasClass: element.classList.contains(controlClass),
        role: element.getAttribute('role'),
        label: element.getAttribute('aria-label'),
      }
    }, T17_CONTROL_CLASS)
    expect(observed.color).toBe(T17_CONTROL_RGB)
    expect(observed.hasClass).toBe(true)
    expect(observed.role).toBe('img')
    expect(observed.label).toBe('t17 controls')
  })

  test('css prop and condition arm paint through an external component', async ({ page }) => {
    const cssColor = await page.getByTestId(TEST_IDS.cssIcon).evaluate((element) => {
      return getComputedStyle(element).color
    })
    expect(cssColor).toBe(T17_CSS_RGB)

    const hoverIcon = page.getByTestId(TEST_IDS.hoverIcon)
    await hoverIcon.hover()
    const hoverColor = await hoverIcon.evaluate((element) => getComputedStyle(element).color)
    expect(hoverColor).toBe(T17_CSS_RGB)
  })

  test('zero `no compiled class` console warnings during render', async ({ page }) => {
    const misses: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('no compiled class')) {
        misses.push(message.text())
      }
    })
    await page.reload()
    await expect(page.getByTestId('chain-t17-root')).toBeVisible()
    for (const testId of Object.values(TEST_IDS)) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
    expect(misses).toEqual([])
  })

  test('probe paints via an explicitly foreign-qualified selector in the loaded sheet', async ({ page }) => {
    // The computed-paint gate above can pass through an unexpected path; this
    // pins the rule itself: each probe class must be directly backed by a
    // `reference-icons__`-qualified selector in the loaded sheet.
    const present = await page.evaluate((classes) => {
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
      // Whole-class match: `c_t17ProbeInk` must not be satisfied by the toned
      // `c_t17ProbeInk/t17ProbeTone` rule, which contains it as a prefix.
      const namesClass = (selector: string, name: string): boolean =>
        selector.split(`.${CSS.escape(name)}`).slice(1).some((rest) => !/^[\w\\-]/.test(rest))
      return classes.map((className) =>
        selectors.some((selector) => namesClass(selector, className))
      )
    }, [...T17_PROBE_ICON_CLASSES])
    expect(present).toEqual(T17_PROBE_ICON_CLASSES.map(() => true))
  })

  test('structured icons accounting: canonical set plus consumer-own probes, no duplicates', async ({ page }) => {
    const { canonical, probe, duplicates, total } = await page.evaluate((probeClasses) => {
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
      const icons = selectors.filter((selector) => selector.includes('reference-icons__'))
      // Whole-class match, so each probe stem owns exactly its own rule.
      const namesClass = (selector: string, name: string): boolean =>
        selector.split(`.${CSS.escape(name)}`).slice(1).some((rest) => !/^[\w\\-]/.test(rest))
      const isProbe = (selector: string): boolean =>
        probeClasses.some((className) => namesClass(selector, className))
      const counts = new Map<string, number>()
      for (const selector of icons) {
        counts.set(selector, (counts.get(selector) ?? 0) + 1)
      }
      return {
        canonical: icons.filter((selector) => !isProbe(selector)),
        probe: icons.filter(isProbe),
        total: icons.length,
        duplicates: [...counts.entries()]
          .filter(([, count]) => count > 1)
          .map(([selector]) => selector),
      }
    }, expectedProbeIconsClasses)

    const canonicalExpected = publishedIconsSelectors()
    expect(canonicalExpected.length).toBeGreaterThan(0)
    // Exact set: canonical rules arrive once, matching the published icons entry.
    expect([...canonical].sort()).toEqual([...canonicalExpected].sort())
    // Exact set: the consumer's own foreign probe stems, no extras, none missing.
    expect(probe.length).toBe(expectedProbeIconsClasses.length)
    expect(total).toBe(canonicalExpected.length + expectedProbeIconsClasses.length)
    // Duplicates in neither source.
    expect(duplicates).toEqual([])
  })

  test('every emitted class has a backing rule', async ({ page }) => {
    const { unbacked, unexpectedForeign } = await page
      .getByTestId('chain-t17-root')
      .evaluate((root, controlClass) => {
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
        const outer = preludes.find((names) => names.includes('chain-t17'))
        if (outer === undefined) {
          throw new Error('no top-level @layer prelude names chain-t17')
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
            continue
          }
        }
        // Whole-class match: a backing rule for `c_t17ProbeInk/t17ProbeTone` must
        // not stand in for a missing `c_t17ProbeInk` rule.
        const namesClass = (selector: string, name: string): boolean =>
          selector.split(`.${CSS.escape(name)}`).slice(1).some((rest) => !/^[\w\\-]/.test(rest))
        return {
          unbacked: [...classes].filter(
            (name) => !selectors.some((selector) => namesClass(selector, name))
          ),
          // Closed world: the only foreign classes on this page are the
          // `material-symbols*` hooks from the SVG library inside the icons
          // and the consumer-authored `className` positive control (an
          // arbitrary consumer class carries no backing rule by design).
          unexpectedForeign: [...foreign].filter(
            (name) => !name.startsWith('material-symbols') && name !== controlClass
          ),
        }
      }, T17_CONTROL_CLASS)
    expect(unexpectedForeign).toEqual([])
    expect(unbacked).toEqual([])
  })
})

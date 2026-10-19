/**
 * T18 probe constants: the single source of truth shared by the render entry,
 * the token fragment, and the contract spec. Every probe gets its own novel
 * token, so the rules one probe triggers (one per system its renderer names)
 * can never back another probe's class by coincidence.
 */

/** Marker asserted by the colocated vitest unit test. */
export const matrixChainT18Marker = 'reference-ui-matrix-chain-t18'

/** The consumer's own system name: no probe here may be backed under it. */
export const T18_OWN_PREFIX = 'chain-t18__'
/** Systems whose bundled runtimes render the probes. */
export const T18_LIB_PREFIX = 'reference-ui__'
export const T18_PACKAGE_PREFIX = 'primitive-named-library__'
export const T18_ICONS_PREFIX = 'reference-icons__'

/**
 * Whether a probe took the external path before provenance or only after it
 * (component-ownership plan S1 + S5). Provenance has landed, so the spec
 * passes every `provenance` probe and the status only guards against a
 * regression; see the README flip list.
 */
export type ProbeStatus = 'external-today' | 'provenance'

/**
 * The package whose bundled runtime renders a probe. Its published streams
 * are the only systems that may back the probe's stem (styling plan §3: lib
 * renders through `reference-icons` and `reference-ui`, so a lib tag backs
 * under both; the fixture and icons under their one system each). A rule
 * under any other composed system, or the app's, is the spray S2 removed.
 */
export type ProbeRenderer = 'lib' | 'package' | 'icons'

export interface ColorProbe {
  /** `data-testid` on the probed element. */
  testId: string
  /** The import shape under test, for failure messages. */
  shape: string
  /** Novel consumer token; the class stem is `c_<token>` (`p_<token>` for spacing). */
  token: string
  /** The token value as Chromium computes it. */
  computed: string
  /** The property the probe styles (`color` or `padding`). */
  property: 'color' | 'padding'
  /** The prefix the rendering runtime mints, so the backing rule must carry it. */
  runtimePrefix: string
  /** The package that renders it; the no-spray check reads its published streams. */
  renderer: ProbeRenderer
  status: ProbeStatus
}

export const T18_PROBES = {
  libButton: {
    testId: 't18-lib-button',
    shape: "import { Button } from '@reference-ui/lib/primitives'",
    token: 't18LibInk',
    computed: 'rgb(161, 18, 92)',
    property: 'color',
    runtimePrefix: T18_LIB_PREFIX,
    renderer: 'lib',
    status: 'external-today',
  },
  namespaceButton: {
    testId: 't18-namespace-button',
    shape: "import * as Acme from '@fixtures/primitive-named-library'; <Acme.Button>",
    token: 't18NamespaceInk',
    computed: 'rgb(18, 92, 161)',
    property: 'color',
    runtimePrefix: T18_PACKAGE_PREFIX,
    renderer: 'package',
    status: 'external-today',
  },
  icon: {
    testId: 't18-icon',
    shape: "import { ContentCopyIcon } from '@reference-ui/icons' (icons composed in layers)",
    token: 't18IconInk',
    computed: 'rgb(92, 161, 18)',
    property: 'color',
    runtimePrefix: T18_ICONS_PREFIX,
    renderer: 'icons',
    status: 'external-today',
  },
  acmeButton: {
    testId: 't18-acme-button',
    shape: "import { Button } from '@fixtures/primitive-named-library'",
    token: 't18AcmeInk',
    computed: 'rgb(140, 61, 7)',
    property: 'color',
    runtimePrefix: T18_PACKAGE_PREFIX,
    renderer: 'package',
    status: 'provenance',
  },
  barrelButton: {
    testId: 't18-barrel-button',
    shape: "import { Button } from './ui' (re-exports '@reference-ui/lib/primitives')",
    token: 't18BarrelInk',
    computed: 'rgb(7, 140, 61)',
    property: 'color',
    runtimePrefix: T18_LIB_PREFIX,
    renderer: 'lib',
    status: 'provenance',
  },
  wrapperButton: {
    testId: 't18-wrapper-button',
    shape: "same-file css wrapper around '@reference-ui/lib/primitives' Button",
    token: 't18WrapInk',
    computed: 'rgb(61, 7, 140)',
    property: 'color',
    runtimePrefix: T18_LIB_PREFIX,
    renderer: 'lib',
    status: 'provenance',
  },
  tile: {
    testId: 't18-tile',
    shape: "import { Tile } from '@fixtures/primitive-named-library' (published in jsxElements)",
    token: 't18TileGap',
    computed: '17px',
    property: 'padding',
    runtimePrefix: T18_PACKAGE_PREFIX,
    renderer: 'package',
    status: 'provenance',
  },
} as const satisfies Record<string, ColorProbe>

/** `<Chip size="lg">`: the chip owns `size`, so no probe token, only its own padding. */
export const T18_CHIP_TEST_ID = 't18-chip'

/** The class a probe's runtime mints for it, e.g. `primitive-named-library__c_t18AcmeInk`. */
export function probeClass(probe: ColorProbe): string {
  return `${probe.runtimePrefix}${probeStem(probe)}`
}

/** The class stem without a system prefix, e.g. `c_t18AcmeInk`. */
export function probeStem(probe: ColorProbe): string {
  return `${probe.property === 'color' ? 'c' : 'p'}_${probe.token}`
}

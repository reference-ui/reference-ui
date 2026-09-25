// Default-channel repro rows: one minimal world per userspace code.
// It takes nothing and emits the fixtures the repro suite compiles.
// Rows stay minimal — one style statement or one config key — so a red
// row names its culprit; the runner asserts code plus severity.
import { type ReproRow, styleFile } from './repro-world.ts'

// Every `diagnostics`-channel code: fatals plus proof-backed warnings.
// Resolves, static/global lines, host skips, and recipe/scan refusals.
export const DEFAULT_ROWS: ReproRow[] = [
  {
    code: 'ATM-W-UNKNOWN-PROPERTY',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: "  staticCss: { notAStyleProp: ['x'] },",
    files: {},
  },
  {
    code: 'ATM-W-INVALID-CSS-VALUE',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/warn.ts': styleFile('export const cls = css({ display: true })') },
  },
  {
    code: 'ATM-W-UNKNOWN-COLOR',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/color.ts': styleFile("export const cls = css({ color: 'notacolor-xyz' })") },
  },
  {
    code: 'ATM-W-UNKNOWN-TOKEN-PATH',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/path.ts': styleFile("export const cls = css({ caretColor: 'ui.missing.path' })") },
  },
  {
    code: 'ATM-E-UNKNOWN-TOKEN',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/bad.ts': styleFile("export const cls = css({ color: '{colors.nope}' })") },
  },
  {
    code: 'ATM-W-UNKNOWN-CONDITION',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/cond.ts': styleFile("export const cls = css({ _hovr: { color: 'red' } })") },
  },
  {
    code: 'ATM-W-MISSING-CONTAINER-ROOT',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/cq.ts': styleFile("export const cls = css({ r: { md: { p: '1r' } } })"),
      'theme/cq-globals.ts': [
        "import { globalCss } from '@reference-ui/neo'",
        '',
        "globalCss({ body: { color: 'red' } })",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-NON-CANONICAL-NUMERIC',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/num.ts': styleFile("export const cls = css({ width: 'Infinity' as any })") },
  },
  {
    code: 'ATM-W-MALFORMED-OPACITY',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/opacity.ts': styleFile("export const cls = css({ color: 'red.500/' })") },
  },
  {
    code: 'ATM-W-UNTERMINATED-BRACE',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/brace.ts': styleFile('export const cls = css({ content: \'"{oops"\' })') },
  },
  {
    code: 'ATM-W-STATIC-WILDCARD',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: "  staticCss: { display: ['*'] },",
    files: {},
  },
  {
    code: 'ATM-W-EMPTY-AT-RULE',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/empty-rule.ts': [
        "import { globalCss } from '@reference-ui/neo'",
        '',
        "globalCss({ '@supports': { body: { color: 'gray' } } })",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-UNSUPPORTED-GLOBAL-VALUE',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/nested-cond.ts': [
        "import { globalCss } from '@reference-ui/neo'",
        '',
        "globalCss({ body: { color: { sm: ['red'] } } })",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-TRACE-SKIPPED',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/broken.tsx': 'export function Broken( {\n' },
  },
  {
    code: 'ATM-E-PARSE',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/broken.tsx': 'export function Broken( {\n' },
  },
  {
    code: 'ATM-E-RECIPE-ARG-SHAPE',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/recipe-arg.ts': [
        "import { recipe } from '@reference-ui/react'",
        '',
        "export const r = recipe('nope')",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-E-RECIPE-SPREAD',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/recipe-spread.ts': [
        "import { recipe } from '@reference-ui/react'",
        '',
        "const rest = { base: { color: 'blue' } }",
        "export const r = recipe({ className: 'spreadr', ...rest })",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-E-RECIPE-CLASSNAME',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/recipe-name.ts': [
        "import { recipe } from '@reference-ui/react'",
        '',
        "const r1 = recipe({ base: { color: 'red' } })",
        '',
        'void r1',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-E-DUPLICATE-RECIPE',
    severity: 'error',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/recipe-dup.ts': [
        "import { recipe } from '@reference-ui/react'",
        '',
        "const b1 = recipe({ className: 'duplicateBadge', base: { display: 'inline-flex' } })",
        "const b2 = recipe({ className: 'duplicateBadge', base: { display: 'flex' } })",
        '',
        'void b1',
        'void b2',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-MISSING-STYLE-PLAN',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/miss.ts': styleFile("export const cls = css({ color: '{colors.nope}' })") },
  },
  {
    code: 'ATM-W-RESPONSIVE-LEAF-IMPORTANT',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: {
      'theme/leaf.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'export const cls = css({',
        "  width: { base: '50px!', md: '60px' },",
        "  color: 'red',",
        '})',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-UNREALIZABLE-EXTENSION',
    severity: 'warning',
    channel: 'diagnostics',
    configExtra: '',
    files: { 'theme/ext.ts': styleFile("export const cls = css({ translateX: '10px' })") },
  },
]

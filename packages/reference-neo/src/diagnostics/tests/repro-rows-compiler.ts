// Compiler-channel repro rows: one minimal world per backchannel code.
// It takes nothing and emits the fixtures the repro suite compiles.
// Every row opts into `logs: ['compiler']`; without it the channel
// stays silent by design and the row would fail for the wrong reason.
import { type ReproRow, styleFile } from './repro-world.ts'

// Every `compilerDiagnostics`-channel code: extract refusals and notes.
// Dynamic shapes, spreads, non-object args, and the refused token call.
export const COMPILER_ROWS: ReproRow[] = [
  {
    code: 'ATM-W-DYNAMIC-IDENTIFIER',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/dynamic-ident.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'export function tint(themeColor: string): string {',
        '  return css({ color: themeColor })',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-UNFOLDABLE-SPREAD',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/dynamic-spread.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'export function spreadIt(overrides: Record<string, string>): string {',
        "  return css({ color: 'brand', ...overrides })",
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-DYNAMIC-EXPRESSION',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/dynamic-expr.ts': styleFile('export const cls = css({ color: maybeColor() })') },
  },
  {
    code: 'ATM-W-DYNAMIC-MEMBER',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/dynamic-member.ts': styleFile('export const cls = css({ width: props.w })') },
  },
  {
    code: 'ATM-W-DYNAMIC-TEMPLATE',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      // Split so the linter never reads fixture `${…}` as a placeholder.
      'theme/dynamic-tpl.ts': styleFile('export const cls = css({ margin: `${' + 'gap}px` })'),
    },
  },
  {
    code: 'ATM-W-DYNAMIC-UNARY',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/dynamic-unary.ts': styleFile('export const cls = css({ order: typeof x })') },
  },
  {
    code: 'ATM-W-DYNAMIC-BINARY',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/dynamic-binary.ts': styleFile('export const cls = css({ order: 1 / 0 })') },
  },
  {
    code: 'ATM-W-MUTATED-BINDING',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/mutated.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        "let tint = 'red'",
        "tint = 'blue'",
        'export const tinted = css({ color: tint })',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-UNFOLDABLE-KEY',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/key.ts': styleFile("export const cls = css({ [dynamicKey]: '10px' })") },
  },
  {
    code: 'ATM-W-UNKNOWN-BREAKPOINT',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/bp.ts': styleFile("export const cls = css({ r: { wat: { p: '1r' } } })") },
  },
  {
    code: 'ATM-W-NON-OBJECT-CONDITION',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: { 'theme/cond-shape.ts': styleFile("export const cls = css({ _hover: 'red' })") },
  },
  {
    code: 'ATM-W-NON-OBJECT-CSS-ARG',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/css-arg.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'declare const fn: () => Record<string, string>',
        '',
        'export const callArg = css(fn())',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-NON-OBJECT-JSX-STYLE',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/jsx-style.tsx': [
        "import { Div } from '@reference-ui/react'",
        '',
        'declare const cond: boolean',
        '',
        "export const logical = <Div css={cond && { color: 'green' }} />",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-RESPONSIVE-ARRAY-SPREAD',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/arr-spread.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'declare const dyn: string',
        '',
        "export const refused = css({ padding: ['8px', ...dyn, '12px'] })",
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-TAGGED-TEMPLATE-SITE',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/tagged.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'export const tagged = css`',
        '  color: red;',
        '`',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-UNFOLDABLE-OBJECT-PROP',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/obj-prop.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'declare const pick: () => string',
        '',
        "const dyn = { color: pick(), padding: '4px' }",
        'export const spread = css({ ...dyn })',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-PARTIAL-OBJECT-PROP',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/partial-prop.ts': [
        "import { css } from '@reference-ui/react'",
        '',
        'declare const flag: boolean',
        'declare const run: () => string',
        '',
        "const part = { color: flag ? 'white' : run() }",
        'export const spread = css({ ...part })',
        '',
      ].join('\n'),
    },
  },
  {
    code: 'ATM-W-TOKEN-CALL-REFUSED',
    severity: 'warning',
    channel: 'compilerDiagnostics',
    configExtra: "  logs: ['compiler'],",
    files: {
      'theme/token-call.ts': [
        "import { css, token } from '@reference-ui/react'",
        '',
        'export const refused = css({ color: token() })',
        '',
      ].join('\n'),
    },
  },
]

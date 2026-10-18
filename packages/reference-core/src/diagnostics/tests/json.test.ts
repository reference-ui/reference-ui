// Contract pins for JSON diagnostics: the wire bytes, exactly.
// They take typed and legacy rows and assert the canonical encodings the
// Rust transport and the template js mirror pin, so any cross-language
// drift fails loudly on this side too. JSON is wire: these bytes are the
// schema, unlike the playtested human frames.
import { describe, expect, it } from 'vitest'
import {
  encodeBatch,
  encodeDiagnostic,
  formatJsonDiagnostics,
  parseTypedBatch,
  parseTypedDiagnostic,
  reportedSyncEntries,
} from '../index.ts'
import type { NeoDiagnostic, TypedDiagnostic } from '../index.ts'

/** Byte-identical to the Rust transport goldens in `diagnostics/src/transport.rs`. */
const SINGLE_GOLDEN =
  '{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN",' +
  '"message":"unknown token path `colors.nope` for prop `color`",' +
  '"file":"app/Button.tsx","line":12,"column":7}'

const BATCH_GOLDEN =
  '[{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN",' +
  '"message":"unknown token path `colors.nope` for prop `color`"},' +
  '{"severity":"error","code":"RS-E-EXAMPLE-BOOM","message":"refused: two recipes claim `btn`"}]'

const SPAN_GOLDEN =
  '{"severity":"warning","code":"RS-W-EXAMPLE-TOKEN",' +
  '"message":"unknown token path `colors.nope` for prop `color`",' +
  '"file":"app/Button.tsx","line":12,"column":7,' +
  '"span":{"start":240,"end":252},' +
  '"labels":[{"span":{"start":240,"end":252},"message":"no such token path"}],' +
  '"help":["point the path at an existing token"]}'

/** Neo-realistic golden: a located atomic warning with its rendering channel. */
const ATOMIC_GOLDEN =
  '{"severity":"warning","code":"ATM-W-UNKNOWN-COLOR",' +
  '"message":"unknown color `notacolor-xyz`",' +
  '"file":"theme/warn.ts","line":5,"column":22,' +
  '"span":{"start":118,"end":133},' +
  '"labels":[{"span":{"start":118,"end":133},"message":"no such color here"}],' +
  '"help":["use a color token or a CSS color"]}'

describe('JSON wire goldens', () => {
  it('encodes the single, batch, and span goldens byte-for-byte', () => {
    expect(encodeDiagnostic(parseTypedDiagnostic(SINGLE_GOLDEN))).toBe(SINGLE_GOLDEN)
    expect(encodeBatch(parseTypedBatch(BATCH_GOLDEN))).toBe(BATCH_GOLDEN)
    expect(encodeDiagnostic(parseTypedDiagnostic(SPAN_GOLDEN))).toBe(SPAN_GOLDEN)
  })

  it('encodes a located atomic warning with its rendering channel byte-for-byte', () => {
    const rendered: TypedDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-COLOR',
      message: 'unknown color `notacolor-xyz`',
      file: 'theme/warn.ts',
      line: 5,
      column: 22,
      span: { start: 118, end: 133 },
      labels: [{ span: { start: 118, end: 133 }, message: 'no such color here' }],
      help: ['use a color token or a CSS color'],
    }
    expect(encodeDiagnostic(rendered)).toBe(ATOMIC_GOLDEN)
    expect(parseTypedDiagnostic(ATOMIC_GOLDEN)).toEqual(rendered)
  })

  it('emits the reported set as one canonical array with no trailing newline', () => {
    const rows = parseTypedBatch(BATCH_GOLDEN)
    expect(formatJsonDiagnostics(rows)).toBe(BATCH_GOLDEN)
    expect(formatJsonDiagnostics([])).toBe('[]')
  })
})

describe('canonical order', () => {
  it('encodes shuffled keys and stripped unknowns to the golden bytes', () => {
    const shuffled = {
      help: ['point the path at an existing token'],
      message: 'unknown token path `colors.nope` for prop `color`',
      labels: [{ message: 'no such token path', span: { end: 252, start: 240 } }],
      span: { end: 252, start: 240 },
      column: 7,
      line: 12,
      file: 'app/Button.tsx',
      code: 'RS-W-EXAMPLE-TOKEN',
      severity: 'warning',
      producer: 'should-not-ship',
    } as unknown as TypedDiagnostic
    expect(encodeDiagnostic(shuffled)).toBe(SPAN_GOLDEN)
  })

  it('drops empty label and help lists on encode like the Rust struct', () => {
    const emptied: TypedDiagnostic = {
      severity: 'warning',
      code: 'RS-W-EXAMPLE-TOKEN',
      message: 'unknown token path `colors.nope` for prop `color`',
      file: 'app/Button.tsx',
      line: 12,
      column: 7,
      labels: [],
      help: [],
    }
    expect(encodeDiagnostic(emptied)).toBe(SINGLE_GOLDEN)
  })
})

describe('legacy carries', () => {
  it('passes info telemetry and codeless stragglers through verbatim', () => {
    const telemetry: NeoDiagnostic = {
      severity: 'info',
      code: 'ATM-I-HARVEST-SINK',
      message: 'sank a dynamic lookup',
    }
    const codeless: NeoDiagnostic = { severity: 'warning', message: 'codeless engine string' }
    expect(formatJsonDiagnostics([telemetry, codeless])).toBe(
      '[{"severity":"info","code":"ATM-I-HARVEST-SINK","message":"sank a dynamic lookup"},' +
        '{"severity":"warning","message":"codeless engine string"}]'
    )
  })

  it('preserves input order with no dedupe: agents count raw rows', () => {
    const rows = parseTypedBatch(BATCH_GOLDEN)
    const repeated = [rows[1]!, rows[0]!, rows[0]!]
    const parsed = JSON.parse(formatJsonDiagnostics(repeated)) as TypedDiagnostic[]
    expect(parsed).toHaveLength(3)
    expect(parsed.map(row => row.code)).toEqual([
      'RS-E-EXAMPLE-BOOM',
      'RS-W-EXAMPLE-TOKEN',
      'RS-W-EXAMPLE-TOKEN',
    ])
  })

  it('round-trips typed rows through the parser unchanged', () => {
    const rows = parseTypedBatch(BATCH_GOLDEN)
    expect(parseTypedBatch(formatJsonDiagnostics(rows))).toEqual(rows)
  })
})

describe('reported set', () => {
  it('selects userspace warnings plus every compiler entry in channel order', () => {
    const userspaceWarning: NeoDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-COLOR',
      message: 'no such color',
    }
    const userspaceError: NeoDiagnostic = {
      severity: 'error',
      code: 'ATM-E-UNKNOWN-TOKEN',
      message: 'refused',
    }
    const compiler: NeoDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-DYNAMIC-IDENTIFIER',
      message: 'dynamic',
    }
    const telemetry: NeoDiagnostic = {
      severity: 'info',
      code: 'ATM-I-HARVEST-SINK',
      message: 'sank',
    }
    expect(reportedSyncEntries([userspaceWarning, userspaceError], [compiler, telemetry])).toEqual([
      userspaceWarning,
      compiler,
      telemetry,
    ])
    expect(reportedSyncEntries([userspaceWarning], undefined)).toEqual([userspaceWarning])
    expect(reportedSyncEntries([], [])).toEqual([])
  })
})

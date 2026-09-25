// Unit pins for the diagnostic transport and code mirror.
// They take wire payloads and assert typed round-trips, fail-closed parsing,
// the typed/legacy partition, and the tasty push. No compiler runs here;
// the repro suite proves the codes end to end.
import { describe, expect, it } from 'vitest'
import {
  DiagnosticParseError,
  codeNamespace,
  codeSeverityTag,
  encodeBatch,
  encodeDiagnostic,
  fromTastyDiagnostic,
  isErrorCode,
  isRegisteredNamespace,
  isTypedDiagnostic,
  isWarningCode,
  parseCode,
  parseTypedBatch,
  parseTypedDiagnostic,
  partitionTyped,
  pullSyncDiagnostics,
} from './index.ts'
import type { NeoDiagnostic, TypedDiagnostic } from './index.ts'

describe('parseCode', () => {
  it('parses warning and error codes into namespace and tag', () => {
    expect(parseCode('ATM-W-UNKNOWN-PROPERTY')).toBe('ATM-W-UNKNOWN-PROPERTY')
    expect(codeNamespace('ATM-W-UNKNOWN-PROPERTY')).toBe('ATM')
    expect(codeSeverityTag('ATM-W-UNKNOWN-PROPERTY')).toBe('W')
    expect(isWarningCode('ATM-W-UNKNOWN-PROPERTY')).toBe(true)
    expect(isErrorCode('ATM-W-UNKNOWN-PROPERTY')).toBe(false)
    expect(parseCode('ATM-E-UNKNOWN-TOKEN')).toBe('ATM-E-UNKNOWN-TOKEN')
    expect(isErrorCode('ATM-E-UNKNOWN-TOKEN')).toBe(true)
    expect(isRegisteredNamespace('ATM-W-UNKNOWN-PROPERTY')).toBe(true)
  })

  it('refuses off-shape codes with the reason', () => {
    for (const bad of ['', 'ATM', 'ATM-W', 'ATM-W-', 'ATM-X-NAME', 'ATM-I-NAME', 'atm-W-NAME', 'ATM-W-name']) {
      expect(() => parseCode(bad)).toThrow(DiagnosticParseError)
    }
    expect(() => parseCode(42)).toThrow(DiagnosticParseError)
    expect(() => parseCode(`ATM-W-${'N'.repeat(60)}`)).toThrow(DiagnosticParseError)
  })

  it('reads unregistered but well-shaped codes as advisory', () => {
    expect(parseCode('ZZ-W-SOMETHING')).toBe('ZZ-W-SOMETHING')
    expect(isRegisteredNamespace('ZZ-W-SOMETHING')).toBe(false)
  })
})

describe('parseTypedDiagnostic', () => {
  it('round-trips a located warning through JSON bytes', () => {
    const warning = {
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-COLOR',
      message: 'no such color',
      file: 'theme/color.ts',
      line: 3,
      column: 31,
    } as const
    const bytes = encodeDiagnostic({ ...warning })
    expect(parseTypedDiagnostic(bytes)).toEqual(warning)
    expect(parseTypedDiagnostic({ ...warning })).toEqual(warning)
  })

  it('round-trips a bare error without a location', () => {
    const error = { severity: 'error', code: 'ATM-E-UNKNOWN-TOKEN', message: 'refused' } as const
    expect(parseTypedDiagnostic(encodeDiagnostic({ ...error }))).toEqual(error)
  })

  it('fails closed on tag mismatches, blank messages, and bad shapes', () => {
    const mismatched = { severity: 'warning', code: 'ATM-E-UNKNOWN-TOKEN', message: 'm' }
    const blank = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: '  ' }
    const noCode = { severity: 'warning', message: 'm' }
    const noMessage = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR' }
    const info = { severity: 'info', code: 'ATM-W-UNKNOWN-COLOR', message: 'm' }
    for (const bad of [mismatched, blank, noCode, noMessage, info, 42, null, ['array']]) {
      expect(() => parseTypedDiagnostic(bad)).toThrow(DiagnosticParseError)
    }
    expect(() => parseTypedDiagnostic('{nope')).toThrow(DiagnosticParseError)
  })

  it('fails closed on off-shape locations', () => {
    const badFile = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm', file: 42 }
    const badLine = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm', line: 1.5 }
    expect(() => parseTypedDiagnostic(badFile)).toThrow(DiagnosticParseError)
    expect(() => parseTypedDiagnostic(badLine)).toThrow(DiagnosticParseError)
  })

  it('round-trips the span, labels, and help rendering channel', () => {
    const rendered: TypedDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-COLOR',
      message: 'no such color',
      file: 'theme/color.ts',
      line: 3,
      column: 31,
      span: { start: 240, end: 252 },
      labels: [{ span: { start: 240, end: 252 }, message: 'no such color here' }],
      help: ['use a color token or a CSS color'],
    }
    expect(parseTypedDiagnostic(encodeDiagnostic(rendered))).toEqual(rendered)
  })

  it('normalizes empty label and help lists to absent like Rust', () => {
    const base = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm' }
    expect(parseTypedDiagnostic({ ...base, labels: [], help: [] })).toEqual(base)
    expect(parseTypedDiagnostic({ ...base, labels: [] })).toEqual(base)
  })

  it('fails closed on off-shape spans, labels, and help', () => {
    const base = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm' }
    const reversed = { ...base, span: { start: 9, end: 4 } }
    const fractional = { ...base, span: { start: 1.5, end: 2 } }
    const negative = { ...base, span: { start: -1, end: 2 } }
    const blankLabel = { ...base, labels: [{ span: { start: 1, end: 2 }, message: '  ' }] }
    const shapelessLabels = { ...base, labels: 'nope' }
    const blankHelp = { ...base, help: [''] }
    const shapelessHelp = { ...base, help: 'nope' }
    for (const bad of [reversed, fractional, negative, blankLabel, shapelessLabels, blankHelp, shapelessHelp]) {
      expect(() => parseTypedDiagnostic(bad)).toThrow(DiagnosticParseError)
    }
  })
})

describe('parseTypedBatch', () => {
  it('round-trips a batch and refuses any bad row', () => {
    const batch = [
      { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'no such color' },
      { severity: 'error', code: 'ATM-E-UNKNOWN-TOKEN', message: 'refused' },
    ] as const
    const rows = batch.map(row => ({ ...row }))
    expect(parseTypedBatch(encodeBatch(rows))).toEqual(rows)
    expect(() => parseTypedBatch([{ severity: 'warning', code: 'bogus', message: 'm' }])).toThrow(
      DiagnosticParseError
    )
    expect(() => parseTypedBatch({})).toThrow(DiagnosticParseError)
    expect(() => parseTypedBatch('not json')).toThrow(DiagnosticParseError)
  })
})

describe('isTypedDiagnostic', () => {
  it('accepts matching warn/err rows and refuses legacy carries', () => {
    const warning: NeoDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-COLOR',
      message: 'no such color',
    }
    const error: NeoDiagnostic = { severity: 'error', code: 'ATM-E-UNKNOWN-TOKEN', message: 'refused' }
    expect(isTypedDiagnostic(warning)).toBe(true)
    expect(isTypedDiagnostic(error)).toBe(true)
    expect(isTypedDiagnostic({ ...warning, severity: 'info', code: 'ATM-I-HARVEST-SINK' })).toBe(false)
    expect(isTypedDiagnostic({ severity: 'warning', message: 'codeless engine string' })).toBe(false)
    expect(isTypedDiagnostic({ ...warning, code: 'ATM-E-UNKNOWN-TOKEN' })).toBe(false)
    expect(isTypedDiagnostic({ ...warning, message: '  ' })).toBe(false)
  })

  it('partitions channels into typed rows and legacy carries in order', () => {
    const typed: NeoDiagnostic = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm' }
    const legacy: NeoDiagnostic = { severity: 'warning', message: 'codeless' }
    const split = partitionTyped([legacy, typed])
    expect(split.typed).toEqual([typed])
    expect(split.legacy).toEqual([legacy])
  })
})

describe('fromTastyDiagnostic', () => {
  it('carries severity, code, message, and location onto the native shape', () => {
    expect(
      fromTastyDiagnostic({
        level: 'warning',
        code: 'TST-W-DUPLICATE-SYMBOL-NAME',
        message: 'Duplicate symbol name `Shared`.',
      })
    ).toEqual({
      severity: 'warning',
      code: 'TST-W-DUPLICATE-SYMBOL-NAME',
      message: 'Duplicate symbol name `Shared`.',
    })
    expect(
      fromTastyDiagnostic({
        level: 'warning',
        code: 'TST-W-PARSE-ERROR',
        message: 'parse reported an error',
        file: 'src/broken.ts',
      })
    ).toEqual({
      severity: 'warning',
      code: 'TST-W-PARSE-ERROR',
      message: 'parse reported an error',
      file: 'src/broken.ts',
    })
  })

  it('carries the rendering channel onto the native shape when present', () => {
    expect(
      fromTastyDiagnostic({
        level: 'warning',
        code: 'TST-W-PARSE-ERROR',
        message: 'parse reported an error',
        file: 'src/broken.ts',
        line: 12,
        column: 7,
        span: { start: 240, end: 252 },
        labels: [{ span: { start: 240, end: 252 }, message: 'broken here' }],
        help: ['fix the syntax error'],
      })
    ).toEqual({
      severity: 'warning',
      code: 'TST-W-PARSE-ERROR',
      message: 'parse reported an error',
      file: 'src/broken.ts',
      line: 12,
      column: 7,
      span: { start: 240, end: 252 },
      labels: [{ span: { start: 240, end: 252 }, message: 'broken here' }],
      help: ['fix the syntax error'],
    })
  })
})

describe('pullSyncDiagnostics', () => {
  it('pulls both channels and defaults the compiler list when absent', () => {
    const userspace: NeoDiagnostic = { severity: 'warning', code: 'ATM-W-UNKNOWN-COLOR', message: 'm' }
    expect(pullSyncDiagnostics({ diagnostics: [userspace] })).toEqual({ userspace: [userspace], compiler: [] })
    const compiler: NeoDiagnostic = {
      severity: 'warning',
      code: 'ATM-W-DYNAMIC-IDENTIFIER',
      message: 'n',
    }
    expect(pullSyncDiagnostics({ diagnostics: [], compilerDiagnostics: [compiler] })).toEqual({
      userspace: [],
      compiler: [compiler],
    })
  })
})

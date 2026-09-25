/**
 * Seam tests for the diagnostics template: wire goldens, fail-closed parsing, and rendering.
 * Pins the exact JSON bytes the Rust transport tests pin, so any cross-language drift fails loudly.
 * Covers code validation, batch parsing, one-line rendering, and the message-pattern helpers.
 */
import { describe, expect, it } from 'vitest'

import {
  codeNamespace,
  codeSeverityTag,
  createError,
  createLabel,
  createSpan,
  createWarning,
  DiagnosticParseError,
  didYouMean,
  encodeBatch,
  encodeDiagnostic,
  hint,
  inlineCode,
  isError,
  isWarning,
  isRegisteredNamespace,
  joinLines,
  parseBatch,
  parseCode,
  parseDiagnostic,
  renderFull,
  renderOneLine,
  suggest,
  suggestForCode,
  supportsSuggestions,
  SUGGESTION_CODES,
} from './index'

/** Byte-identical to the Rust transport goldens in `src/transport.rs`. */
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

describe('codes', () => {
  it('parses valid codes and splits namespace and tag', () => {
    expect(parseCode('ATM-W-UNKNOWN-PROPERTY')).toBe('ATM-W-UNKNOWN-PROPERTY')
    expect(codeNamespace('ATM-W-UNKNOWN-PROPERTY')).toBe('ATM')
    expect(codeSeverityTag('ATM-W-UNKNOWN-PROPERTY')).toBe('W')
    expect(codeSeverityTag('RS-E-EXAMPLE-BOOM')).toBe('E')
    expect(parseCode('ATM-W-I-THING')).toBe('ATM-W-I-THING')
  })

  it('rejects malformed codes and the reserved info tag', () => {
    for (const bad of [
      '',
      'ATM',
      'ATM-W',
      'ATM-W-',
      'ATM-X-NAME',
      'ATM-I-NAME',
      'atm-W-NAME',
      'ATM-w-NAME',
      'ATM-W-name',
      'ATM-W--NAME',
      42,
      null,
    ]) {
      expect(() => parseCode(bad as string)).toThrow(DiagnosticParseError)
    }
    expect(() => parseCode('ATM-I-NAME')).toThrow(/reserved/)
    expect(() => parseCode(`ATM-W-${'N'.repeat(60)}`)).toThrow(/64/)
  })

  it('advises on registry membership without refusing foreign shapes', () => {
    expect(isRegisteredNamespace('ATM-W-UNKNOWN-PROPERTY')).toBe(true)
    expect(isRegisteredNamespace('ZZ-W-SOMETHING')).toBe(false)
  })
})

describe('transport', () => {
  it('parses the Rust golden vectors byte-for-byte', () => {
    const single = parseDiagnostic(SINGLE_GOLDEN)
    expect(single.code).toBe('RS-W-EXAMPLE-TOKEN')
    expect(single.file).toBe('app/Button.tsx')
    expect(single.line).toBe(12)
    expect(isWarning(single)).toBe(true)
    const batch = parseBatch(BATCH_GOLDEN)
    expect(batch).toHaveLength(2)
    expect(isError(batch[1]!)).toBe(true)
  })

  it('encodes back to the identical golden bytes', () => {
    expect(encodeDiagnostic(parseDiagnostic(SINGLE_GOLDEN))).toBe(SINGLE_GOLDEN)
    expect(encodeBatch(parseBatch(BATCH_GOLDEN))).toBe(BATCH_GOLDEN)
  })

  it('carries the span, labels, and help rendering channel', () => {
    const rendered = parseDiagnostic(SPAN_GOLDEN)
    expect(rendered.span).toEqual({ start: 240, end: 252 })
    expect(rendered.labels).toEqual([
      { span: { start: 240, end: 252 }, message: 'no such token path' },
    ])
    expect(rendered.help).toEqual(['point the path at an existing token'])
    expect(encodeDiagnostic(rendered)).toBe(SPAN_GOLDEN)
    const built = createWarning('RS-W-EXAMPLE-TOKEN', 'unknown token', {
      file: 'app/Button.tsx',
      span: createSpan(240, 252),
      labels: [createLabel(createSpan(240, 252), 'no such token path')],
      help: ['point the path at an existing token'],
    })
    expect(built.span).toEqual({ start: 240, end: 252 })
    expect(built.labels).toHaveLength(1)
    expect(built.help).toHaveLength(1)
    expect(parseDiagnostic(encodeDiagnostic(built))).toEqual(built)
  })

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
    } as unknown as Parameters<typeof encodeDiagnostic>[0]
    expect(encodeDiagnostic(shuffled)).toBe(SPAN_GOLDEN)
  })

  it('drops empty label and help lists on encode and parse like Rust', () => {
    const emptied = {
      severity: 'warning',
      code: 'RS-W-EXAMPLE-TOKEN',
      message: 'unknown token path `colors.nope` for prop `color`',
      file: 'app/Button.tsx',
      line: 12,
      column: 7,
      labels: [],
      help: [],
    } as unknown as Parameters<typeof encodeDiagnostic>[0]
    expect(encodeDiagnostic(emptied)).toBe(SINGLE_GOLDEN)
    expect(parseDiagnostic({ ...emptied })).toEqual(parseDiagnostic(SINGLE_GOLDEN))
  })

  it('fails closed on off-shape spans, labels, and help', () => {
    const base = { severity: 'warning', code: 'RS-W-X', message: 'm' }
    expect(() => parseDiagnostic({ ...base, span: { start: 9, end: 4 } })).toThrow(
      DiagnosticParseError
    )
    expect(() => parseDiagnostic({ ...base, span: { start: 1.5, end: 2 } })).toThrow(
      DiagnosticParseError
    )
    expect(() =>
      parseDiagnostic({ ...base, labels: [{ span: { start: 1, end: 2 }, message: '  ' }] })
    ).toThrow(DiagnosticParseError)
    expect(() => parseDiagnostic({ ...base, labels: 'nope' })).toThrow(DiagnosticParseError)
    expect(() => parseDiagnostic({ ...base, help: [''] })).toThrow(DiagnosticParseError)
    expect(() => parseDiagnostic({ ...base, help: 'nope' })).toThrow(DiagnosticParseError)
    expect(() => createSpan(9, 4)).toThrow(DiagnosticParseError)
    expect(() => createSpan(-1, 2)).toThrow(DiagnosticParseError)
    expect(() => createLabel(createSpan(1, 2), '  ')).toThrow(DiagnosticParseError)
    expect(() =>
      createWarning('RS-W-X', 'm', { span: { start: 9, end: 4 } })
    ).toThrow(DiagnosticParseError)
  })

  it('fails closed on corrupt payloads like the Rust decoders', () => {
    expect(() => parseDiagnostic('{"severity":"warning"}')).toThrow(DiagnosticParseError)
    expect(() => parseDiagnostic('not json')).toThrow(DiagnosticParseError)
    expect(() => parseDiagnostic({ severity: 'warning' })).toThrow(DiagnosticParseError)
    expect(() =>
      parseBatch('[{"severity":"warning","code":"bogus","message":"m"}]')
    ).toThrow(DiagnosticParseError)
    expect(() => parseBatch('{"severity":"warning"}')).toThrow(DiagnosticParseError)
    expect(() =>
      parseDiagnostic({ severity: 'warning', code: 'RS-E-X', message: 'm' })
    ).toThrow(/carries `-E-`/)
    expect(() =>
      parseDiagnostic({ severity: 'warning', code: 'RS-W-X', message: '   ' })
    ).toThrow(/blank/)
  })

  it('constructs warnings and errors with the same checks as Rust', () => {
    const warning = createWarning('RS-W-EXAMPLE-TOKEN', 'subject', {
      file: 'a.tsx',
      line: 1,
      column: 2,
    })
    expect(warning.severity).toBe('warning')
    expect(warning.file).toBe('a.tsx')
    expect(createError('RS-E-EXAMPLE-BOOM', 'refused').severity).toBe('error')
    expect(() => createWarning('RS-E-EXAMPLE-BOOM', 'x')).toThrow(/carries/)
    expect(() => createWarning('RS-W-EXAMPLE-TOKEN', '  ')).toThrow(/blank/)
  })
})

describe('rendering', () => {
  it('renders one-line rows for located, file-only, and bare diagnostics', () => {
    expect(renderOneLine(parseDiagnostic(SINGLE_GOLDEN))).toBe(
      'app/Button.tsx:12:7 RS-W-EXAMPLE-TOKEN unknown token path `colors.nope` for prop `color`'
    )
    const fileOnly = createWarning('RS-W-EXAMPLE-TOKEN', 'subject', { file: 'a.tsx' })
    expect(renderOneLine(fileOnly)).toBe('a.tsx RS-W-EXAMPLE-TOKEN subject')
    expect(renderOneLine(createError('RS-E-EXAMPLE-BOOM', 'refused'))).toBe(
      'RS-E-EXAMPLE-BOOM refused'
    )
  })

  it('keeps one-liners to the subject and full renders to every line', () => {
    const multi = createWarning('RS-W-EXAMPLE-TOKEN', 'subject\nsecond line', {
      file: 'a.tsx',
      line: 1,
      column: 2,
    })
    expect(renderOneLine(multi)).toBe('a.tsx:1:2 RS-W-EXAMPLE-TOKEN subject')
    expect(renderFull(multi)).toBe('a.tsx:1:2 RS-W-EXAMPLE-TOKEN subject\nsecond line')
  })
})

describe('message pattern', () => {
  it('renders the micro-syntax and parity suggest vectors', () => {
    expect(inlineCode('color')).toBe('`color`')
    expect(hint('use a token')).toBe('hint: use a token')
    expect(didYouMean('colors.navy')).toBe('did you mean `colors.navy`?')
    expect(joinLines(['one', 'two'])).toBe('one\ntwo')
    expect(suggest('colr', ['color', 'margin'])).toBe('color')
    expect(suggest('color', ['color', 'margin'])).toBe('color')
    expect(suggest('zzz', ['color', 'margin'])).toBeUndefined()
    expect(suggest('colors.nope', ['colors.nope-500'])).toBeUndefined()
    expect(suggest('colr', [])).toBeUndefined()
  })

  it('gates suggestions to unknown-from-known-set codes like Rust', () => {
    expect(SUGGESTION_CODES).toHaveLength(8)
    expect(suggestForCode('ATM-W-UNKNOWN-PROPERTY', 'colr', ['color', 'margin'])).toBe('color')
    expect(suggestForCode('TGN-W-UNKNOWN-STRICT-CATEGORY', 'colour', ['colors'])).toBe('colors')
    for (const silent of [
      'ATM-E-UNKNOWN-RETENTION-TOKEN',
      'ATM-E-PARSE',
      'TST-W-PARSE-ERROR',
      'not-a-code',
    ]) {
      expect(suggestForCode(silent, 'colr', ['color', 'margin'])).toBeUndefined()
    }
    expect(suggestForCode('ATM-W-UNKNOWN-PROPERTY', 'zzz', ['color', 'margin'])).toBeUndefined()
    expect(supportsSuggestions('ATM-E-UNKNOWN-TOKEN')).toBe(true)
    expect(supportsSuggestions('ATM-W-DYNAMIC-EXPRESSION')).toBe(false)
  })

  it('composes the unknown-token worked example identically to Rust', () => {
    const unknown = 'colors.navvy-500'
    const known = suggest(unknown, ['colors.navy-500', 'colors.nope-500', 'space.4'])
    const subject = `unknown token path ${inlineCode(unknown)} for prop ${inlineCode('color')}`
    const message =
      known === undefined
        ? subject
        : joinLines([
            subject,
            `${didYouMean(known)} · ${hint('token paths are dotted category/name pairs')}`,
          ])
    expect(message).toBe(
      'unknown token path `colors.navvy-500` for prop `color`\n' +
        'did you mean `colors.navy-500`? · hint: token paths are dotted category/name pairs'
    )
  })
})

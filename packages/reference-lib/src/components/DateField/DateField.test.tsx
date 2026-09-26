import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DateField } from './DateField'

describe('DateField required locale (FEATURES #1)', () => {
  it('DF-FMT-06: DateField should require an explicit locale and skip environment defaults', () => {
    // Missing locale throws loudly on the childless host (fail-closed).
    expect(() =>
      renderToString(
        // @ts-expect-error — locale is required; the runtime must throw.
        <DateField value={null} onChange={() => {}} />
      )
    ).toThrow('[reference-ui] DateField requires an explicit locale prop.')

    // Missing locale throws loudly on the compound host too (throw-for-all).
    expect(() =>
      renderToString(
        // @ts-expect-error — locale is required; the runtime must throw.
        <DateField value={null} onChange={() => {}}>
          <DateField.Picker />
        </DateField>
      )
    ).toThrow('[reference-ui] DateField requires an explicit locale prop.')

    // Explicit null from a JS consumer throws the same way.
    expect(() =>
      renderToString(
        <DateField value={null} onChange={() => {}} locale={null as unknown as string} />
      )
    ).toThrow('[reference-ui] DateField requires an explicit locale prop.')

    // With an explicit locale the SSR markup is deterministic: identical
    // across renders with no environment read (no navigator access exists
    // on this path — grep DateField.tsx for `navigator`).
    const first = renderToString(
      <DateField value="2024-02-01" onChange={() => {}} locale="en-GB" />
    )
    const second = renderToString(
      <DateField value="2024-02-01" onChange={() => {}} locale="en-GB" />
    )
    expect(first).toContain('2024-02-01')
    expect(second).toBe(first)
  })
})

describe('DateField required value + onChange (controlled-only)', () => {
  it('DF-CTL-01: DateField should throw without an explicit value (null is the empty value)', () => {
    // Missing value throws loudly on the childless host (fail-closed).
    expect(() =>
      renderToString(
        // @ts-expect-error — value is required; the runtime must throw.
        <DateField onChange={() => {}} locale="en-GB" />
      )
    ).toThrow('[reference-ui] DateField requires an explicit value prop (null is the empty value).')

    // Explicit undefined from a JS consumer throws the same way.
    expect(() =>
      renderToString(
        <DateField value={undefined as unknown as null} onChange={() => {}} locale="en-GB" />
      )
    ).toThrow('[reference-ui] DateField requires an explicit value prop')

    // Missing value throws loudly on the compound host too (throw-for-all).
    expect(() =>
      renderToString(
        // @ts-expect-error — value is required; the runtime must throw.
        <DateField onChange={() => {}} locale="en-GB">
          <DateField.Picker />
        </DateField>
      )
    ).toThrow('[reference-ui] DateField requires an explicit value prop')

    // null is the legal empty value — renders, no throw.
    expect(() =>
      renderToString(<DateField value={null} onChange={() => {}} locale="en-GB" />)
    ).not.toThrow()
  })

  it('DF-CTL-02: DateField should throw without onChange (no silent-frozen controlled)', () => {
    // Missing onChange throws loudly — a value without a writer would be
    // silently frozen, so the field refuses to render instead.
    expect(() =>
      renderToString(
        // @ts-expect-error — onChange is required; the runtime must throw.
        <DateField value={null} locale="en-GB" />
      )
    ).toThrow('[reference-ui] DateField requires an explicit onChange prop.')

    // Explicit null from a JS consumer throws the same way.
    expect(() =>
      renderToString(
        <DateField value={null} onChange={null as unknown as (v: null) => void} locale="en-GB" />
      )
    ).toThrow('[reference-ui] DateField requires an explicit onChange prop.')

    // Compound host throws too (throw-for-all).
    expect(() =>
      renderToString(
        // @ts-expect-error — onChange is required; the runtime must throw.
        <DateField value={null} locale="en-GB">
          <DateField.Picker />
        </DateField>
      )
    ).toThrow('[reference-ui] DateField requires an explicit onChange prop.')
  })
})

describe('DateField constraint bounds (FEATURES #3)', () => {
  it('DF-BND-04: DateField should fail when min is after max or either is not canonical ISO', () => {
    // Fail-closed: invalid bounds throw during render, so no edit session
    // (and no input at all) can exist.
    expect(() =>
      renderToString(
        <DateField
          value={null}
          onChange={() => {}}
          locale="en-GB"
          min="2024-06-30"
          max="2024-06-01"
        />
      )
    ).toThrow('[reference-ui] DateField: "min" (2024-06-30) must not be after "max" (2024-06-01).')

    expect(() =>
      renderToString(
        <DateField value={null} onChange={() => {}} locale="en-GB" min="2024-6-1" />
      )
    ).toThrow('[reference-ui] DateField: "min" must be a canonical ISO date (YYYY-MM-DD)')

    expect(() =>
      renderToString(
        <DateField value={null} onChange={() => {}} locale="en-GB" max="30/06/2024" />
      )
    ).toThrow('[reference-ui] DateField: "max" must be a canonical ISO date (YYYY-MM-DD)')

    expect(() =>
      renderToString(
        <DateField
          value={null}
          onChange={() => {}}
          locale="en-GB"
          min="2024-06-30"
          max="2024-06-01"
        >
          <DateField.Picker />
        </DateField>
      )
    ).toThrow('"min" (2024-06-30) must not be after "max"')

    // Legal bounds render.
    expect(() =>
      renderToString(
        <DateField
          value="2024-06-15"
          onChange={() => {}}
          locale="en-GB"
          min="2024-06-01"
          max="2024-06-30"
        />
      )
    ).not.toThrow()
  })

  it('programmatic out-of-range value renders display plus managed invalid (DF-BND-02 logic; ID proven in CT)', () => {
    // Out-of-range canonical value still displays, with managed invalid.
    const invalidHtml = renderToString(
      <DateField
        value="2024-05-31"
        onChange={() => {}}
        locale="en-GB"
        min="2024-06-01"
        max="2024-06-30"
      />
    )
    expect(invalidHtml).toContain('2024-05-31')
    expect(invalidHtml).toContain('aria-invalid="true"')
    expect(invalidHtml).toContain('data-invalid="true"')

    // Unavailable-marked value is invalid the same way.
    const unavailableHtml = renderToString(
      <DateField
        value="2024-06-15"
        onChange={() => {}}
        locale="en-GB"
        isDateUnavailable={(d) => d === '2024-06-15'}
      />
    )
    expect(unavailableHtml).toContain('aria-invalid="true"')

    // In-range value carries no managed invalid.
    const validHtml = renderToString(
      <DateField
        value="2024-06-15"
        onChange={() => {}}
        locale="en-GB"
        min="2024-06-01"
        max="2024-06-30"
      />
    )
    expect(validHtml).not.toContain('aria-invalid="true"')
    expect(validHtml).not.toContain('data-invalid')

    // Managed invalid wins over an authored aria-invalid={false}.
    const managedWinsHtml = renderToString(
      <DateField
        value="2024-05-31"
        onChange={() => {}}
        locale="en-GB"
        min="2024-06-01"
        max="2024-06-30"
        aria-invalid={false}
      />
    )
    expect(managedWinsHtml).toContain('aria-invalid="true"')
  })
})

/**
 * Member-host station (ATM-SITE-22, RS-36). `<Overlay.Content />` extracts
 * when `OverlayContent` is a host; `<Accordion.Content />` with no host
 * stays silent. Zero diagnostics either way.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const SYSTEM = '@reference-ui/lib'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-22',
  verify(result) {
    expect(hasWant(result, 'minW', '40r')).toBe(true)
    expect(hasWant(result, 'bg', 'red')).toBe(true)
    expect(hasWant(result, 'p', '4r')).toBe(false)

    expect(result.css?.classes?.['minW:40r']).toBe(`${SYSTEM}__min-w_40r`)
    expect(result.css?.classes?.['bg:red']).toBe(`${SYSTEM}__bg_red`)
    expect(result.css?.classes?.['p:4r']).toBeUndefined()

    const sheet = result.stylesheet
    expect(sheet).toContain('min-width: calc(40 * var(--spacing-root));')
    expect(sheet).toContain('background: red;')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

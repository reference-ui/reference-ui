/**
 * Station specification for ATL-PAIR-02.
 * Validates the usedWith policy: a component found in one file reports no co-usage, and a
 * widely used component keeps at most twelve co-used names with none rated rare.
 * Proves ATL-PAIR-02 (score_used_with in src/usage_policy.rs).
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-PAIR-02',
  verify(result) {
    const dialog = result.components.find(c => c.name === 'Dialog')!
    expect(dialog).toBeDefined()
    expect(dialog.count).toBe(1)
    expect(dialog.usedWith).toEqual({})

    const button = result.components.find(c => c.name === 'Button')!
    expect(button).toBeDefined()
    expect(button.count).toBe(21)

    const entries = Object.entries(button.usedWith)
    expect(entries.length).toBeLessThanOrEqual(12)
    expect(entries.map(([, usage]) => usage)).not.toContain('rare')

    expect(button.usedWith.Card).toBe('very common')
    expect(button.usedWith.Divider).toBeUndefined()
    expect(button.usedWith.Alert).toBe('occasional')
    expect(button.usedWith.Text).toBeUndefined()
  },
}

export default spec

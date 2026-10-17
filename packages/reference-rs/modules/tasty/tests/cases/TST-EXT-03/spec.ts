/**
 * Case specification for TST-EXT-03.
 * `declare module './base' { interface Base { extra } }` is a module augmentation tasty does not merge.
 * The scan must warn TST-W-UNSUPPORTED-AUGMENTATION naming the augmenting file and module, and `Base`
 * keeps only its own member, so the augmentation is visible and not merged silently.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-03',
  async verify({ api, emitted }) {
    const diagnostics = emitted.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    const [augmentation] = diagnostics
    expect(augmentation!.code).toBe('TST-W-UNSUPPORTED-AUGMENTATION')
    expect(augmentation!.severity).toBe('warning')
    expect(augmentation!.file).toContain('augment.ts')
    expect(augmentation!.message).toContain('`./base`')

    const warned = api
      .getWarnings()
      .some(w => w.code === 'TST-W-UNSUPPORTED-AUGMENTATION' && w.message.includes('`./base`'))
    expect(warned).toBe(true)

    const base = await api.loadSymbolByName('Base')
    const names = base.getMembers().map(member => member.getName()).sort()
    expect(names).toEqual(['id'])
  },
}

export default spec

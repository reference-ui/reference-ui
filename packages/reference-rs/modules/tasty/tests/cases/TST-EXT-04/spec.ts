/**
 * Station specification for TST-EXT-04.
 * `declare global`, `import x = require()`, and `export =` each warn TST-W-UNSUPPORTED-SYNTAX once in
 * their own file, naming the construct. The skipped global `Window` never becomes a symbol, and the
 * named declarations beside each statement still extract.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-04',
  async verify({ api, emitted }) {
    const syntax = (emitted.diagnostics ?? []).filter(d => d.code === 'TST-W-UNSUPPORTED-SYNTAX')
    expect(syntax).toHaveLength(3)
    const messageFor = (file: string) =>
      syntax.find(d => d.file?.endsWith(file))?.message ?? ''
    expect(messageFor('globals.ts')).toContain('`declare global`')
    expect(messageFor('requires.ts')).toContain('`import x = require()`')
    expect(messageFor('assign.ts')).toContain('`export =`')

    const warned = api
      .getWarnings()
      .filter(w => w.code === 'TST-W-UNSUPPORTED-SYNTAX')
    expect(warned).toHaveLength(3)

    expect(await api.findSymbolByName('Window')).toBeUndefined()

    const local = await api.loadSymbolByName('Local')
    expect(local.getName()).toBe('Local')
    const sided = await api.loadSymbolByName('Sided')
    expect(sided.getName()).toBe('Sided')
  },
}

export default spec

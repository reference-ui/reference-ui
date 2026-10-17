/**
 * Case specification for TST-QRY-02.
 * `typeof f<Args>` keeps the explicit type arguments in the type query expression and resolves no
 * value for them; a plain `typeof f` keeps the bare name. Proves the instantiation lowering.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface TypeQueryRaw {
  kind?: string
  expression?: string
  resolved?: unknown
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-QRY-02',
  async verify({ api }) {
    const ofString = await api.loadSymbolByName('IdentityOfString')
    const instantiated = ofString.getUnderlyingType()?.getRaw() as TypeQueryRaw
    expect(instantiated.kind).toBe('type_query')
    expect(instantiated.expression).toBe('identity<string>')
    expect(instantiated.resolved ?? undefined).toBeUndefined()

    const plain = await api.loadSymbolByName('IdentityPlain')
    const bare = plain.getUnderlyingType()?.getRaw() as TypeQueryRaw
    expect(bare.kind).toBe('type_query')
    expect(bare.expression).toBe('identity')
  },
}

export default spec

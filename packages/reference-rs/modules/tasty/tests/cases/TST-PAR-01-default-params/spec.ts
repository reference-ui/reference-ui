/**
 * Station specification for TST-PAR-01-default-params.
 * Verifies default values on generic type parameters and partial default configurations.
 * Proves primary SPEC ID anchor TST-PAR-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-PAR-01',
  async verify({ api }) {
    const withDefault = await api.loadSymbolByName('WithDefault')
    const keyValue = await api.loadSymbolByName('KeyValue')
    const partialDefault = await api.loadSymbolByName('PartialDefault')

    expect(withDefault.getKind()).toBe('typeAlias')
    expect(withDefault.getTypeParameters()[0]?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'string',
    })
    expect(withDefault.getUnderlyingType()?.getKind()).toBe('object')
    expect(withDefault.getUnderlyingType()?.describe()).toBe('{ ... }')

    const keyValueParams = keyValue.getTypeParameters()
    expect(keyValueParams.find((p) => p.name === 'K')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'string',
    })
    expect(keyValueParams.find((p) => p.name === 'V')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'unknown',
    })

    const partialParams = partialDefault.getTypeParameters()
    expect(partialParams.find((p) => p.name === 'T')?.default).toBeUndefined()
    expect(partialParams.find((p) => p.name === 'U')?.default).toMatchObject({
      kind: 'intrinsic',
      name: 'number',
    })
  },
}

export default spec

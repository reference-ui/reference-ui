/**
 * Station specification for TST-SIG-02.
 * An interface accessor pair is one property typed by its getter and not readonly; a lone getter
 * is readonly and a lone setter is typed by its parameter. A method stays a method.
 * Proves the accessor folding in interface member lowering.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../harness/helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-SIG-02',
  async verify({ api }) {
    const accessors = await api.loadSymbolByName('Accessors')
    const values = accessors.getMembers().filter(member => member.getName() === 'value')
    expect(values).toHaveLength(1)
    expect(values[0]!.getKind()).toBe('property')
    expect(values[0]!.isReadonly()).toBe(false)
    expect(values[0]!.getType()?.getRaw()).toMatchObject({ kind: 'intrinsic', name: 'string' })

    const readOnly = await api.loadSymbolByName('ReadOnlyAccessors')
    expect(findMember(readOnly, 'id').getKind()).toBe('property')
    expect(findMember(readOnly, 'id').isReadonly()).toBe(true)
    expect(findMember(readOnly, 'id').getType()?.getRaw()).toMatchObject({ kind: 'intrinsic', name: 'number' })

    const writeOnly = await api.loadSymbolByName('WriteOnlyAccessors')
    expect(findMember(writeOnly, 'token').getKind()).toBe('property')
    expect(findMember(writeOnly, 'token').isReadonly()).toBe(false)
    expect(findMember(writeOnly, 'token').getType()?.getRaw()).toMatchObject({ kind: 'intrinsic', name: 'string' })

    const withMethod = await api.loadSymbolByName('WithMethod')
    expect(findMember(withMethod, 'run').getKind()).toBe('method')
  },
}

export default spec

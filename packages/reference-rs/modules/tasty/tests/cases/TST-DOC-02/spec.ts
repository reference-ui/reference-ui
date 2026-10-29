/**
 * Case specification for TST-DOC-02.
 * Verifies JSDoc on members of an object type literal: in an intersection, as a plain alias body, and nested.
 * Proves primary SPEC ID anchor TST-DOC-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface DocRaw {
  description?: string
  descriptionRaw?: string
  jsdoc?: { summary?: string; tags?: Array<{ name?: string; value?: string }> }
}

interface RawNode {
  kind?: string
  members?: Array<DocRaw & { name?: string; type?: RawNode }>
  types?: RawNode[]
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DOC-02',
  async verify({ api }) {
    const literalMembers = async (name: string) => {
      const raw = (await api.loadSymbolByName(name)).getRaw() as DocRaw & {
        definition?: RawNode
      }
      const definition = raw.definition
      const literal =
        definition?.kind === 'intersection'
          ? definition.types?.find(part => part.kind === 'object')
          : definition
      const byName = new Map((literal?.members ?? []).map(m => [m.name, m]))
      return { raw, byName }
    }

    const dialog = await literalMembers('DialogProps')
    expect(dialog.raw.description).toBe('Alias comment that must stay on the alias.')
    const open = dialog.byName.get('open')
    expect(open?.description).toBe('Shown.')
    expect(open?.jsdoc?.tags).toEqual([{ name: 'default', value: 'false' }])
    expect(dialog.byName.get('onClose')?.description).toBe('Fired on close.')
    expect(dialog.byName.get('bare')?.description).toBeUndefined()
    expect(dialog.byName.get('bare')?.jsdoc).toBeUndefined()

    const plain = await literalMembers('Plain')
    expect(plain.byName.get('label')?.description).toBe('The label.')
    expect(plain.byName.get('count')?.description).toBeUndefined()

    const nested = await literalMembers('Nested')
    const box = nested.byName.get('box')
    expect(box?.description).toBe('The outer box.')
    const inner = new Map((box?.type?.members ?? []).map(m => [m.name, m]))
    expect(inner.get('width')?.description).toBe('Inner width.')
    expect(inner.get('height')?.description).toBeUndefined()

    const undocumented = await literalMembers('Undocumented')
    expect(undocumented.raw.description).toBe('Alias only.')
    expect(undocumented.byName.get('first')?.description).toBeUndefined()
    expect(undocumented.byName.get('first')?.jsdoc).toBeUndefined()
    expect(undocumented.byName.get('second')?.description).toBe('Second member.')

    const box2 = await literalMembers('UndocumentedBox')
    expect(box2.raw.description).toBe('Alias only, over an intersection.')
    expect(box2.byName.get('first')?.description).toBeUndefined()
    expect(box2.byName.get('first')?.jsdoc).toBeUndefined()
  },
}

export default spec

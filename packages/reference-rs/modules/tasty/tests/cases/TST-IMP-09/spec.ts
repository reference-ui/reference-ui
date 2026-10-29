/**
 * Case specification for TST-IMP-09.
 * Verifies that a type re-exported from another package keeps its description, members, member descriptions and @default tags.
 * Proves primary SPEC ID anchor TST-IMP-09.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface RawJsdocTag {
  name: string
  value?: string
}

interface RawMember {
  name: string
  description?: string
  jsdoc?: { tags: RawJsdocTag[] }
}

interface RawObjectType {
  kind: string
  members?: RawMember[]
}

interface RawIntersection {
  kind: string
  types: RawObjectType[]
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-IMP-09',
  async verify({ api }) {
    expect(api.getWarnings()).toEqual([])

    const iconProps = await api.loadSymbolByName('IconProps')
    const raw = iconProps.getRaw() as {
      library: string
      description?: string
      definition: RawIntersection
    }
    expect(raw.library).toBe('tasty-case-acme-icons')
    expect(raw.description).toBe('Props of every icon: the box props, plus `tone` and `size`.')

    const own = raw.definition.types.find(type => type.kind === 'object')
    const members = own?.members ?? []
    expect(members.map(member => member.name)).toEqual(['tone', 'size'])

    const defaults = Object.fromEntries(
      members.map(member => [
        member.name,
        member.jsdoc?.tags.find(tag => tag.name === 'default')?.value,
      ])
    )
    expect(defaults).toEqual({ tone: "'neutral'", size: '24' })
    expect(members.map(member => member.description)).toEqual([
      'Glyph colour family.',
      'Width and height in pixels.',
    ])

    // The aliased member type the package re-exports beside it is indexed too.
    const tone = await api.loadSymbolByName('IconTone')
    expect(tone.getName()).toBe('IconTone')
  },
}

export default spec

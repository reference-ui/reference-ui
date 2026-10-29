/**
 * Case specification for TST-DOC-03.
 * Verifies that a trailing `//` comment on a member never merges into the next member's JSDoc, in an interface and an alias literal.
 * Proves primary SPEC ID anchor TST-DOC-03.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface DocRaw {
  description?: string
  descriptionRaw?: string
  jsdoc?: { summary?: string }
}

interface RawNode {
  kind?: string
  members?: Array<DocRaw & { name?: string }>
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DOC-03',
  async verify({ api }) {
    const membersOf = async (name: string) => {
      const raw = (await api.loadSymbolByName(name)).getRaw() as {
        members?: RawNode['members']
        definition?: RawNode
      }
      const list = raw.members ?? raw.definition?.members ?? []
      return new Map(list.map(member => [member.name, member]))
    }

    for (const name of ['Window', 'WindowLiteral']) {
      const byName = await membersOf(name)
      expect(byName.get('month')?.description, name).toBe('The month.')
      expect(byName.get('onMonthChange')?.description, name).toBe('Called when the month changes.')
      expect(byName.get('onMonthChange')?.descriptionRaw, name).not.toContain('YYYY')
      expect(byName.get('year')?.description, name).toBeUndefined()
      expect(byName.get('year')?.jsdoc, name).toBeUndefined()
      expect(byName.get('bare')?.description, name).toBeUndefined()
    }

    const window = await membersOf('Window')
    expect(window.get('note')?.descriptionRaw).toBe('standalone note')
  },
}

export default spec

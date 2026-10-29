/**
 * Case specification for TST-DOC-04.
 * Verifies that a top-of-file header comment is not attached to the first declaration, while a JSDoc directly above it still is.
 * Proves primary SPEC ID anchor TST-DOC-04.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface DocRaw {
  description?: string
  descriptionRaw?: string
  jsdoc?: { summary?: string }
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DOC-04',
  async verify({ api }) {
    const docOf = async (name: string) => (await api.loadSymbolByName(name)).getRaw() as DocRaw

    const headed = await docOf('Headed')
    expect(headed.description).toBeUndefined()
    expect(headed.descriptionRaw).toBeUndefined()
    expect(headed.jsdoc).toBeUndefined()

    const alias = await docOf('HeadedAlias')
    expect(alias.description).toBe("The alias's own documentation.")
    expect(alias.descriptionRaw).not.toContain('File header')

    const direct = await docOf('Direct')
    expect(direct.description).toBe('Direct documents itself; the file has no separate header.')
  },
}

export default spec

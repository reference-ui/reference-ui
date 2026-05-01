import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rhythmUtilities } from '../../../../packages/reference-core/src/system/panda/config/extensions/rhythm/utilities'

import { Index, matrixSpacingMarker } from '../../src/index'
import { spacingMatrixClasses } from '../../src/styles'

function readGeneratedStyledFile(...parts: string[]) {
  const filePath = join(process.cwd(), '.reference-ui', 'styled', ...parts)

  expect(existsSync(filePath), `${parts.join('/')} should exist in generated styled output`).toBe(true)

  return readFileSync(filePath, 'utf-8')
}

describe('spacing matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixSpacingMarker).toBe('reference-ui-matrix-spacing')
  })

  it('maps rhythm size units to equal width and height values', () => {
    expect(rhythmUtilities.size.transform('2r')).toEqual({
      width: 'calc(2 * var(--spacing-root))',
      height: 'calc(2 * var(--spacing-root))',
    })
  })

  it('passes through literal CSS values for size width and height', () => {
    expect(rhythmUtilities.size.transform('3rem')).toEqual({
      width: '3rem',
      height: '3rem',
    })
  })

  it('exports the size utility class', () => {
    expect(spacingMatrixClasses.sizeBox).toContain('size_')
  })

  it('emits size on the generated box pattern type surface', () => {
    const boxTypes = readGeneratedStyledFile('patterns', 'box.d.ts')

    expect(boxTypes).toMatch(/\bsize\?:/)
  })

  it('emits size on the generated style-props utility surface', () => {
    const stylePropTypes = readGeneratedStyledFile('types', 'style-props.d.ts')

    expect(stylePropTypes).toContain('UtilityValues["size"]')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('spacing-root')
  })
})
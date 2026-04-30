import { describe, expect, it } from 'vitest'
import { neutralizeStyleCalls } from './neutralize-style-calls'

describe('neutralizeStyleCalls', () => {
  it('renames direct css and cva calls while preserving runtime aliases', () => {
    const result = neutralizeStyleCalls(
      [
        "import { css, cva } from 'src/system/css'",
        'const card = css({ color: \'red\' })',
        'const button = cva({})',
      ].join('\n')
    )

    expect(result).toContain("import { css, cva } from 'src/system/css'")
    expect(result).toContain('const __reference_ui_css = css;')
    expect(result).toContain('const __reference_ui_cva = cva;')
    expect(result).toContain("const card = __reference_ui_css({ color: 'red' })")
    expect(result).toContain('const button = __reference_ui_cva({})')
  })

  it('leaves files without direct style calls unchanged', () => {
    const source = "import { css } from 'src/system/css'\nexport const card = css\n"

    expect(neutralizeStyleCalls(source)).toBe(source)
  })
})
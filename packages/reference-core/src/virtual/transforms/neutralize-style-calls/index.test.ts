import { afterEach, describe, expect, it, vi } from 'vitest'
import { neutralizeStyleCalls } from './index'

const { replaceFunctionNameNative } = vi.hoisted(() => ({
  replaceFunctionNameNative: vi.fn<
    (
      sourceCode: string,
      relativePath: string,
      fromName: string,
      toName: string,
      importFrom?: string,
    ) => string
  >(),
}))

vi.mock('@reference-ui/rust', () => ({
  replaceFunctionName: replaceFunctionNameNative,
}))

afterEach(() => {
  replaceFunctionNameNative.mockReset()
})

describe('neutralizeStyleCalls', () => {
  it('renames direct css and cva calls through the native import-aware rewrite', () => {
    replaceFunctionNameNative.mockImplementation((sourceCode, _relativePath, fromName, toName) => {
      const pattern = new RegExp(`\\b${fromName}\\(`, 'g')
      const callRewritten = sourceCode.replace(pattern, `${toName}(`)
      if (callRewritten === sourceCode) {
        return sourceCode
      }

      return callRewritten.replace(
        "import { css, cva } from 'src/system/css'",
        `import { css, cva } from 'src/system/css'\nconst ${toName} = ${fromName};`,
      )
    })

    const result = neutralizeStyleCalls(
      [
        "import { css, cva } from 'src/system/css'",
        'const card = css({ color: \'red\' })',
        'const button = cva({})',
      ].join('\n'),
      'src/styles.ts',
    )

    expect(replaceFunctionNameNative).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('const card = css({ color: \'red\' })'),
      'src/styles.ts',
      'css',
      '__reference_ui_css',
      'src/system/css',
    )
    expect(replaceFunctionNameNative).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('const card = __reference_ui_css({ color: \'red\' })'),
      'src/styles.ts',
      'cva',
      '__reference_ui_cva',
      'src/system/css',
    )
    expect(result).toContain("import { css, cva } from 'src/system/css'")
    expect(result).toContain('const __reference_ui_css = css;')
    expect(result).toContain('const __reference_ui_cva = cva;')
    expect(result).toContain("const card = __reference_ui_css({ color: 'red' })")
    expect(result).toContain('const button = __reference_ui_cva({})')
  })

  it('leaves files without direct style calls unchanged', () => {
    replaceFunctionNameNative.mockImplementation((sourceCode) => sourceCode)

    const source = "import { css } from 'src/system/css'\nexport const card = css\n"

    expect(neutralizeStyleCalls(source, 'src/styles.ts')).toBe(source)
  })
})
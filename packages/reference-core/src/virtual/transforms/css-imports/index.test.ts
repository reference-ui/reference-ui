import { describe, expect, it, vi } from 'vitest'

const rewriteCssImportsNative = vi.fn<(sourceCode: string, relativePath: string) => string>()

vi.mock('@reference-ui/rust', () => ({
  rewriteCssImports: rewriteCssImportsNative,
}))

describe('rewriteCssImports', () => {
  it('normalizes legacy runtime css imports to the Panda-recognized css path', async () => {
    rewriteCssImportsNative.mockReturnValueOnce(
      "import { css } from 'src/system/runtime';\nconst card = css({});\n"
    )

    const { rewriteCssImports } = await import('./index')

    expect(rewriteCssImports('source', 'src/card.tsx')).toBe(
      "import { css } from 'src/system/css';\nconst card = css({});\n"
    )
    expect(rewriteCssImportsNative).toHaveBeenCalledWith('source', 'src/card.tsx')
  })

  it('leaves already-normalized css imports unchanged', async () => {
    rewriteCssImportsNative.mockReturnValueOnce(
      "import { css } from 'src/system/css';\nconst card = css({});\n"
    )

    const { rewriteCssImports } = await import('./index')

    expect(rewriteCssImports('source', 'src/card.tsx')).toBe(
      "import { css } from 'src/system/css';\nconst card = css({});\n"
    )
  })
})
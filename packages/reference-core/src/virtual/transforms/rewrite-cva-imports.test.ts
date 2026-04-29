import { describe, expect, it, vi } from 'vitest'

const rewriteCvaImportsNative = vi.fn<(sourceCode: string, relativePath: string) => string>()

vi.mock('@reference-ui/rust', () => ({
  rewriteCvaImports: rewriteCvaImportsNative,
}))

describe('rewriteCvaImports', () => {
  it('normalizes legacy runtime cva imports to the Panda-recognized css path', async () => {
    rewriteCvaImportsNative.mockReturnValueOnce(
      "import { cva } from 'src/system/runtime';\nconst button = cva({});\n"
    )

    const { rewriteCvaImports } = await import('./rewrite-cva-imports')

    expect(rewriteCvaImports('source', 'src/button.tsx')).toBe(
      "import { cva } from 'src/system/css';\nconst button = cva({});\n"
    )
    expect(rewriteCvaImportsNative).toHaveBeenCalledWith('source', 'src/button.tsx')
  })

  it('leaves already-normalized cva imports unchanged', async () => {
    rewriteCvaImportsNative.mockReturnValueOnce(
      "import { cva } from 'src/system/css';\nconst button = cva({});\n"
    )

    const { rewriteCvaImports } = await import('./rewrite-cva-imports')

    expect(rewriteCvaImports('source', 'src/button.tsx')).toBe(
      "import { cva } from 'src/system/css';\nconst button = cva({});\n"
    )
  })
})